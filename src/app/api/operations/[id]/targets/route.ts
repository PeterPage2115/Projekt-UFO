import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { operations, operationTargets, villages, snapshots } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { canManageOps } from '@/lib/auth/guards';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageOps(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: operationId } = await params;

    const operation = db
      .select()
      .from(operations)
      .where(eq(operations.id, operationId))
      .get();

    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    const body = await request.json();
    const { targetX, targetY, isReal, notes } = body;

    if (typeof targetX !== 'number' || typeof targetY !== 'number') {
      return NextResponse.json(
        { error: 'targetX and targetY are required and must be numbers' },
        { status: 400 }
      );
    }

    // Auto-fill village/player name from latest snapshot
    let targetVillageName: string | null = null;
    let targetPlayerName: string | null = null;

    const latestSnapshot = db
      .select()
      .from(snapshots)
      .orderBy(desc(snapshots.id))
      .limit(1)
      .get();

    if (latestSnapshot) {
      const village = db
        .select()
        .from(villages)
        .where(
          and(
            eq(villages.x, targetX),
            eq(villages.y, targetY),
            eq(villages.snapshotId, latestSnapshot.id)
          )
        )
        .get();

      if (village) {
        targetVillageName = village.name;
        targetPlayerName = village.playerName;
      }
    }

    // Calculate next sortOrder
    const maxSort = db
      .select({ max: sql<number>`COALESCE(MAX(${operationTargets.sortOrder}), -1)` })
      .from(operationTargets)
      .where(eq(operationTargets.operationId, operationId))
      .get();

    const sortOrder = (maxSort?.max ?? -1) + 1;

    const newTarget = {
      id: crypto.randomUUID(),
      operationId,
      targetX,
      targetY,
      targetVillageName,
      targetPlayerName,
      isReal: isReal ? 1 : 0,
      notes: notes ?? null,
      sortOrder,
    };

    db.insert(operationTargets).values(newTarget).run();

    return NextResponse.json(newTarget, { status: 201 });
  } catch (error) {
    console.error('POST /api/operations/[id]/targets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageOps(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: operationId } = await params;
    const body = await request.json();
    const { targetId, isReal } = body;

    if (!targetId) {
      return NextResponse.json({ error: 'targetId is required' }, { status: 400 });
    }

    const target = db
      .select()
      .from(operationTargets)
      .where(
        and(
          eq(operationTargets.id, targetId),
          eq(operationTargets.operationId, operationId)
        )
      )
      .get();

    if (!target) {
      return NextResponse.json(
        { error: 'Target not found or does not belong to this operation' },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (typeof isReal === 'number') {
      updates.isReal = isReal;
    }

    if (Object.keys(updates).length > 0) {
      db.update(operationTargets).set(updates).where(eq(operationTargets.id, targetId)).run();
    }

    const updated = db
      .select()
      .from(operationTargets)
      .where(eq(operationTargets.id, targetId))
      .get();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/operations/[id]/targets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageOps(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: operationId } = await params;
    const body = await request.json();
    const { targetId } = body;

    if (!targetId) {
      return NextResponse.json({ error: 'targetId is required' }, { status: 400 });
    }

    const target = db
      .select()
      .from(operationTargets)
      .where(
        and(
          eq(operationTargets.id, targetId),
          eq(operationTargets.operationId, operationId)
        )
      )
      .get();

    if (!target) {
      return NextResponse.json(
        { error: 'Target not found or does not belong to this operation' },
        { status: 404 }
      );
    }

    db.delete(operationTargets).where(eq(operationTargets.id, targetId)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/operations/[id]/targets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
