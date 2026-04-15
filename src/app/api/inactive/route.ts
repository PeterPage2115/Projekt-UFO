/**
 * Inactive player finder API.
 * Compares earliest vs latest snapshot — players whose total pop AND village count
 * are unchanged are considered inactive.
 *
 * Query params:
 *   fromX, fromY  — center coords for distance calculation
 *   maxDistance    — max distance from center
 *   maxPop        — max population filter
 *   minVillages   — min village count filter
 *   limit         — result limit (default 50, max 500)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { villages, snapshots } from '@/lib/db/schema';
import { eq, asc, desc, and, inArray, sql } from 'drizzle-orm';
import { calculateDistance } from '@/lib/game/calculators';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const fromX = url.searchParams.has('fromX')
      ? parseInt(url.searchParams.get('fromX')!, 10)
      : null;
    const fromY = url.searchParams.has('fromY')
      ? parseInt(url.searchParams.get('fromY')!, 10)
      : null;
    const maxDistance = url.searchParams.has('maxDistance')
      ? parseFloat(url.searchParams.get('maxDistance')!)
      : null;
    const maxPop = url.searchParams.has('maxPop')
      ? parseInt(url.searchParams.get('maxPop')!, 10)
      : null;
    const minVillages = url.searchParams.has('minVillages')
      ? parseInt(url.searchParams.get('minVillages')!, 10)
      : null;
    const limit = Math.min(
      500,
      Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)),
    );

    // Get earliest and latest snapshot IDs
    const earliestSnapshot = db
      .select({ id: snapshots.id })
      .from(snapshots)
      .orderBy(asc(snapshots.id))
      .limit(1)
      .get();
    const latestSnapshot = db
      .select({ id: snapshots.id })
      .from(snapshots)
      .orderBy(desc(snapshots.id))
      .limit(1)
      .get();

    if (!earliestSnapshot || !latestSnapshot) {
      return NextResponse.json({
        data: [],
        error: 'Brak snapshotów w bazie danych',
      });
    }
    if (earliestSnapshot.id === latestSnapshot.id) {
      return NextResponse.json({
        data: [],
        error: 'Potrzeba co najmniej 2 snapshotów do wykrycia nieaktywnych',
      });
    }

    const earliestId = earliestSnapshot.id;
    const latestId = latestSnapshot.id;

    // Aggregate player stats from earliest snapshot
    const earlyStats = db
      .select({
        uid: villages.uid,
        totalPop: sql<number>`COALESCE(SUM(${villages.population}), 0)`,
        villageCount: sql<number>`COUNT(*)`,
      })
      .from(villages)
      .where(eq(villages.snapshotId, earliestId))
      .groupBy(villages.uid)
      .all();

    // Aggregate player stats from latest snapshot
    const lateStats = db
      .select({
        uid: villages.uid,
        playerName: sql<string>`MAX(${villages.playerName})`,
        allianceName: sql<string>`MAX(${villages.allianceName})`,
        tid: sql<number>`MAX(${villages.tid})`,
        aid: sql<number>`MAX(${villages.aid})`,
        totalPop: sql<number>`COALESCE(SUM(${villages.population}), 0)`,
        villageCount: sql<number>`COUNT(*)`,
      })
      .from(villages)
      .where(eq(villages.snapshotId, latestId))
      .groupBy(villages.uid)
      .all();

    // Build lookup from early stats
    const earlyMap = new Map<
      number,
      { totalPop: number; villageCount: number }
    >();
    for (const s of earlyStats) {
      if (s.uid != null && s.uid !== 0) {
        earlyMap.set(s.uid, {
          totalPop: s.totalPop,
          villageCount: s.villageCount,
        });
      }
    }

    // Find inactive: pop AND village count unchanged between snapshots
    const inactivePlayers = lateStats.filter((p) => {
      if (!p.uid || p.uid === 0) return false;
      const early = earlyMap.get(p.uid);
      return (
        early &&
        early.totalPop === p.totalPop &&
        early.villageCount === p.villageCount
      );
    });

    // Get villages for inactive players
    const inactiveUids = inactivePlayers
      .map((p) => p.uid!)
      .filter((uid): uid is number => uid != null);

    const villageRows =
      inactiveUids.length > 0
        ? db
            .select({
              uid: villages.uid,
              x: villages.x,
              y: villages.y,
              name: villages.name,
              population: villages.population,
            })
            .from(villages)
            .where(
              and(
                eq(villages.snapshotId, latestId),
                inArray(villages.uid, inactiveUids),
              ),
            )
            .all()
        : [];

    // Group villages by uid
    const villagesByUid = new Map<
      number,
      Array<{ x: number; y: number; name: string | null; population: number | null }>
    >();
    for (const v of villageRows) {
      if (v.uid == null) continue;
      if (!villagesByUid.has(v.uid)) villagesByUid.set(v.uid, []);
      villagesByUid.get(v.uid)!.push({
        x: v.x,
        y: v.y,
        name: v.name,
        population: v.population,
      });
    }

    // Build results with distance calculation
    let results = inactivePlayers.map((p) => {
      const playerVillages = villagesByUid.get(p.uid!) || [];
      let distance: number | null = null;

      if (
        fromX !== null &&
        fromY !== null &&
        !isNaN(fromX) &&
        !isNaN(fromY) &&
        playerVillages.length > 0
      ) {
        distance = Math.min(
          ...playerVillages.map((v) =>
            calculateDistance(fromX, fromY, v.x, v.y),
          ),
        );
        distance = Math.round(distance * 10) / 10;
      }

      return {
        uid: p.uid,
        playerName: p.playerName,
        allianceName: p.allianceName,
        tid: p.tid,
        aid: p.aid,
        totalPop: p.totalPop,
        villageCount: p.villageCount,
        distance,
        villages: playerVillages,
      };
    });

    // Apply filters
    if (maxPop !== null && !isNaN(maxPop)) {
      results = results.filter((p) => p.totalPop <= maxPop);
    }
    if (minVillages !== null && !isNaN(minVillages)) {
      results = results.filter((p) => p.villageCount >= minVillages);
    }
    if (
      maxDistance !== null &&
      !isNaN(maxDistance) &&
      fromX !== null &&
      fromY !== null
    ) {
      results = results.filter(
        (p) => p.distance !== null && p.distance <= maxDistance,
      );
    }

    // Sort: by distance if center provided, otherwise by pop ascending
    if (fromX !== null && fromY !== null) {
      results.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
    } else {
      results.sort((a, b) => a.totalPop - b.totalPop);
    }

    results = results.slice(0, limit);

    return NextResponse.json({
      data: results,
      meta: {
        earliestSnapshotId: earliestId,
        latestSnapshotId: latestId,
        totalInactive: results.length,
      },
    });
  } catch (error) {
    console.error('[api/inactive] Error:', error);
    return NextResponse.json(
      { error: 'Failed to find inactive players' },
      { status: 500 },
    );
  }
}
