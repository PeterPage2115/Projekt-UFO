/**
 * API route for map.sql operations.
 * GET: Get latest snapshot info
 * POST: Trigger manual collection (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { snapshots, systemLogs } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { triggerManualCollection, isCollectionInProgress } from '@/lib/map-sql/scheduler';
import { auth } from '@/lib/auth/config';

export async function GET() {
  try {
    const latest = db.select().from(snapshots).orderBy(desc(snapshots.id)).limit(5).all();

    return NextResponse.json({
      collecting: isCollectionInProgress(),
      snapshots: latest.map(s => ({
        id: s.id,
        fetchedAt: s.fetchedAt,
        villageCount: s.villageCount,
        playerCount: s.playerCount,
        allianceCount: s.allianceCount,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch snapshot info' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (isCollectionInProgress()) {
      return NextResponse.json({ error: 'Collection already in progress' }, { status: 409 });
    }

    const result = await triggerManualCollection();

    return NextResponse.json({
      message: 'Collection completed',
      ...result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
