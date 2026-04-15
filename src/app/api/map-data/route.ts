/**
 * Lightweight API returning ALL villages from latest snapshot for the interactive map.
 * Minimal fields for performance with 50k+ villages.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { villages, snapshots } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const latest = db
      .select({ id: snapshots.id })
      .from(snapshots)
      .orderBy(desc(snapshots.id))
      .limit(1)
      .get();

    if (!latest) {
      return NextResponse.json({ data: [], snapshotId: null, total: 0 });
    }

    const results = db
      .select({
        x: villages.x,
        y: villages.y,
        name: villages.name,
        playerName: villages.playerName,
        allianceName: villages.allianceName,
        tid: villages.tid,
        aid: villages.aid,
        population: villages.population,
        uid: villages.uid,
      })
      .from(villages)
      .where(eq(villages.snapshotId, latest.id))
      .all();

    return NextResponse.json({
      snapshotId: latest.id,
      data: results,
      total: results.length,
    });
  } catch (error) {
    console.error('[api/map-data] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map data' },
      { status: 500 },
    );
  }
}
