/**
 * API route for global search across players, alliances, and villages.
 * GET: Search with ?q=query&type=all|players|alliances|villages
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players, alliances, villages, snapshots } from '@/lib/db/schema';
import { like, desc, sql, eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim();
    const type = url.searchParams.get('type') || 'all';
    const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)));

    if (!q || q.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    const searchPattern = `%${q}%`;
    const results: Record<string, unknown[]> = {};

    // Search players
    if (type === 'all' || type === 'players') {
      const playerResults = db.select().from(players)
        .where(like(players.name, searchPattern))
        .orderBy(desc(players.totalPop))
        .limit(limit)
        .all();
      results.players = playerResults;
    }

    // Search alliances
    if (type === 'all' || type === 'alliances') {
      const allianceResults = db.select().from(alliances)
        .where(like(alliances.name, searchPattern))
        .orderBy(desc(alliances.totalPop))
        .limit(limit)
        .all();
      results.alliances = allianceResults;
    }

    // Search villages (latest snapshot only)
    if (type === 'all' || type === 'villages') {
      const latest = db.select({ id: snapshots.id }).from(snapshots)
        .orderBy(desc(snapshots.id)).limit(1).get();

      if (latest) {
        const villageResults = db.select().from(villages)
          .where(and(
            eq(villages.snapshotId, latest.id),
            sql`(${villages.name} LIKE ${searchPattern} OR ${villages.playerName} LIKE ${searchPattern})`
          ))
          .orderBy(desc(villages.population))
          .limit(limit)
          .all();
        results.villages = villageResults;
      } else {
        results.villages = [];
      }
    }

    return NextResponse.json({ query: q, results });
  } catch (error) {
    console.error('[api/search] Error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
