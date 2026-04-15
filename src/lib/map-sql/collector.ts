/**
 * Fetch map.sql from Travian server, parse, store snapshot, and update aggregates.
 */

import { db } from '../db';
import { snapshots, villages, players, alliances, systemLogs } from '../db/schema';
import { parseMapSql, type VillageRow } from './parser';
import { eq } from 'drizzle-orm';

const TRAVIAN_SERVER_URL = process.env.TRAVIAN_SERVER_URL || 'https://rof.x3.international.travian.com';

function log(level: 'info' | 'warn' | 'error', message: string, details?: string) {
  try {
    db.insert(systemLogs).values({
      level,
      category: 'map_sql',
      message,
      details,
      createdAt: new Date().toISOString(),
    }).run();
  } catch {
    console.error(`[map-sql] ${level}: ${message}`);
  }
}

export async function fetchMapSql(): Promise<string> {
  const url = `${TRAVIAN_SERVER_URL.replace(/\/$/, '')}/map.sql`;
  console.log(`[map-sql] Fetching from ${url}`);

  const resp = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    headers: { 'User-Agent': 'ProjektUFO/1.0' },
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch map.sql: ${resp.status} ${resp.statusText}`);
  }

  return resp.text();
}

export function storeSnapshot(rows: VillageRow[]): number {
  const now = new Date().toISOString();

  // Count unique players and alliances
  const uniquePlayers = new Set(rows.filter(r => r.uid !== 0).map(r => r.uid));
  const uniqueAlliances = new Set(rows.filter(r => r.aid !== 0).map(r => r.aid));

  // Insert snapshot
  const result = db.insert(snapshots).values({
    fetchedAt: now,
    villageCount: rows.length,
    playerCount: uniquePlayers.size,
    allianceCount: uniqueAlliances.size,
  }).returning({ id: snapshots.id }).get();

  const snapshotId = result.id;

  // Batch insert villages (chunks of 500 for SQLite variable limit)
  const CHUNK_SIZE = 500;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    db.insert(villages).values(
      chunk.map(r => ({
        snapshotId,
        mapId: r.mapId,
        x: r.x,
        y: r.y,
        tid: r.tid,
        vid: r.vid,
        name: r.name,
        uid: r.uid,
        playerName: r.playerName,
        aid: r.aid,
        allianceName: r.allianceName,
        population: r.population,
        region: r.region,
        isCapital: r.isCapital,
        isCity: r.isCity,
        hasHarbor: r.hasHarbor,
        victoryPoints: r.victoryPoints,
      }))
    ).run();
  }

  // Update aggregates
  updatePlayers(rows, now);
  updateAlliances(rows, now);

  return snapshotId;
}

function updatePlayers(rows: VillageRow[], now: string) {
  // Aggregate player data
  const playerMap = new Map<number, {
    name: string;
    tid: number;
    aid: number;
    allianceName: string;
    totalPop: number;
    villageCount: number;
    tidCounts: Map<number, number>;
  }>();

  for (const r of rows) {
    if (r.uid === 0) continue;

    let pd = playerMap.get(r.uid);
    if (!pd) {
      pd = {
        name: r.playerName,
        tid: r.tid,
        aid: r.aid,
        allianceName: r.allianceName,
        totalPop: 0,
        villageCount: 0,
        tidCounts: new Map(),
      };
      playerMap.set(r.uid, pd);
    }
    pd.totalPop += r.population;
    pd.villageCount += 1;
    pd.tidCounts.set(r.tid, (pd.tidCounts.get(r.tid) || 0) + 1);
  }

  for (const [uid, data] of playerMap) {
    // Primary tribe = most common, tie → lowest tid
    let primaryTid = data.tid;
    let maxCount = 0;
    for (const [tid, count] of data.tidCounts) {
      if (count > maxCount || (count === maxCount && tid < primaryTid)) {
        primaryTid = tid;
        maxCount = count;
      }
    }

    const existing = db.select().from(players).where(eq(players.uid, uid)).get();

    if (!existing) {
      db.insert(players).values({
        uid,
        name: data.name,
        tid: primaryTid,
        aid: data.aid,
        allianceName: data.allianceName,
        totalPop: data.totalPop,
        villageCount: data.villageCount,
        firstSeenAt: now,
        lastUpdatedAt: now,
      }).run();
    } else {
      db.update(players).set({
        name: data.name,
        tid: primaryTid,
        aid: data.aid,
        allianceName: data.allianceName,
        totalPop: data.totalPop,
        villageCount: data.villageCount,
        lastUpdatedAt: now,
      }).where(eq(players.uid, uid)).run();
    }
  }
}

function updateAlliances(rows: VillageRow[], now: string) {
  const allianceMap = new Map<number, {
    name: string;
    totalPop: number;
    members: Set<number>;
  }>();

  for (const r of rows) {
    if (r.aid === 0) continue;

    let ad = allianceMap.get(r.aid);
    if (!ad) {
      ad = { name: r.allianceName, totalPop: 0, members: new Set() };
      allianceMap.set(r.aid, ad);
    }
    ad.totalPop += r.population;
    ad.members.add(r.uid);
  }

  for (const [aid, data] of allianceMap) {
    const existing = db.select().from(alliances).where(eq(alliances.aid, aid)).get();

    if (!existing) {
      db.insert(alliances).values({
        aid,
        name: data.name,
        memberCount: data.members.size,
        totalPop: data.totalPop,
        firstSeenAt: now,
        lastUpdatedAt: now,
      }).run();
    } else {
      db.update(alliances).set({
        name: data.name,
        memberCount: data.members.size,
        totalPop: data.totalPop,
        lastUpdatedAt: now,
      }).where(eq(alliances.aid, aid)).run();
    }
  }
}

export async function collectAndStore(): Promise<{
  snapshotId: number;
  villageCount: number;
  playerCount: number;
  allianceCount: number;
  fetchTimeMs: number;
  storeTimeMs: number;
}> {
  const tStart = performance.now();

  const raw = await fetchMapSql();
  const tFetch = performance.now();

  const rows = parseMapSql(raw);
  if (rows.length === 0) {
    throw new Error('map.sql returned 0 villages — possibly empty or format changed');
  }

  const snapshotId = storeSnapshot(rows);
  const tStore = performance.now();

  const uniquePlayers = new Set(rows.filter(r => r.uid !== 0).map(r => r.uid));
  const uniqueAlliances = new Set(rows.filter(r => r.aid !== 0).map(r => r.aid));

  const result = {
    snapshotId,
    villageCount: rows.length,
    playerCount: uniquePlayers.size,
    allianceCount: uniqueAlliances.size,
    fetchTimeMs: Math.round(tFetch - tStart),
    storeTimeMs: Math.round(tStore - tFetch),
  };

  log('info', `Snapshot #${snapshotId}: ${rows.length} villages, ${uniquePlayers.size} players, ${uniqueAlliances.size} alliances (fetch: ${result.fetchTimeMs}ms, store: ${result.storeTimeMs}ms)`);

  return result;
}
