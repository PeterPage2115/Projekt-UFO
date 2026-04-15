/**
 * API route for villages.
 * GET: List villages from latest snapshot with filters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { villages, snapshots } from '@/lib/db/schema';
import { like, eq, desc, asc, and, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    const snapshotId = url.searchParams.get('snapshot');
    const uid = url.searchParams.get('uid');
    const aid = url.searchParams.get('aid');
    const search = url.searchParams.get('search')?.trim();
    const region = url.searchParams.get('region')?.trim();
    const sortBy = url.searchParams.get('sort') || 'population';
    const order = url.searchParams.get('order') || 'desc';

    // Use specified snapshot or latest
    let targetSnapshotId: number;
    if (snapshotId) {
      targetSnapshotId = parseInt(snapshotId, 10);
    } else {
      const latest = db.select({ id: snapshots.id }).from(snapshots).orderBy(desc(snapshots.id)).limit(1).get();
      if (!latest) {
        return NextResponse.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
      targetSnapshotId = latest.id;
    }

    const conditions = [eq(villages.snapshotId, targetSnapshotId)];

    if (uid) conditions.push(eq(villages.uid, parseInt(uid, 10)));
    if (aid) conditions.push(eq(villages.aid, parseInt(aid, 10)));
    if (search) {
      conditions.push(
        sql`(${villages.name} LIKE ${'%' + search + '%'} OR ${villages.playerName} LIKE ${'%' + search + '%'} OR ${villages.allianceName} LIKE ${'%' + search + '%'})`
      );
    }
    if (region) conditions.push(like(villages.region, `%${region}%`));

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    const sortColumn = sortBy === 'name' ? villages.name
      : sortBy === 'playerName' ? villages.playerName
      : sortBy === 'x' ? villages.x
      : sortBy === 'y' ? villages.y
      : villages.population;
    const sortDir = order === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const results = db.select().from(villages)
      .where(whereClause)
      .orderBy(sortDir)
      .limit(limit)
      .offset(offset)
      .all();

    const totalResult = db.select({ count: sql<number>`count(*)` }).from(villages)
      .where(whereClause)
      .get();
    const total = totalResult?.count || 0;

    return NextResponse.json({
      snapshotId: targetSnapshotId,
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[api/villages] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch villages' }, { status: 500 });
  }
}
