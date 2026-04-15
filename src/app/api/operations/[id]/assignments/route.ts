import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { operations, operationTargets, operationAssignments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { canManageOps } from '@/lib/auth/guards';
import { calculateDistance, calculateTravelTime, calculateSendTime } from '@/lib/game/calculators';

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
    const { targetId, userId, sourceX, sourceY, sourceVillageName, unitSpeed, waves } = body;

    if (!targetId || !userId || typeof sourceX !== 'number' || typeof sourceY !== 'number' || typeof unitSpeed !== 'number') {
      return NextResponse.json(
        { error: 'targetId, userId, sourceX, sourceY, and unitSpeed are required' },
        { status: 400 }
      );
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

    const distance = calculateDistance(sourceX, sourceY, target.targetX, target.targetY);
    const travelTime = calculateTravelTime(distance, unitSpeed);

    let sendTime: string | null = null;
    if (operation.landingTime) {
      const sendDate = calculateSendTime(operation.landingTime, distance, unitSpeed);
      sendTime = sendDate.toISOString();
    }

    const newAssignment = {
      id: crypto.randomUUID(),
      operationId,
      targetId,
      userId,
      sourceX,
      sourceY,
      sourceVillageName: sourceVillageName ?? null,
      unitSpeed,
      waves: waves ?? 1,
      sendTime,
      travelTime,
      status: 'pending' as const,
      confirmedAt: null,
      notes: null,
    };

    db.insert(operationAssignments).values(newAssignment).run();

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    console.error('POST /api/operations/[id]/assignments error:', error);
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

    const { id: operationId } = await params;
    const body = await request.json();
    const { assignmentId, status, notes } = body;

    if (!assignmentId || !status) {
      return NextResponse.json(
        { error: 'assignmentId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'confirmed', 'sent'] as const;
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const assignment = db
      .select()
      .from(operationAssignments)
      .where(
        and(
          eq(operationAssignments.id, assignmentId),
          eq(operationAssignments.operationId, operationId)
        )
      )
      .get();

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or does not belong to this operation' },
        { status: 404 }
      );
    }

    // Members can only update their own assignments
    if (!canManageOps(session.user.role)) {
      if (assignment.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (status !== 'confirmed' && status !== 'sent') {
        return NextResponse.json(
          { error: 'Members can only set status to confirmed or sent' },
          { status: 403 }
        );
      }
    }

    const updateData: Record<string, unknown> = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (status === 'confirmed') {
      updateData.confirmedAt = new Date().toISOString();
    }

    db.update(operationAssignments)
      .set(updateData)
      .where(eq(operationAssignments.id, assignmentId))
      .run();

    const updated = db
      .select()
      .from(operationAssignments)
      .where(eq(operationAssignments.id, assignmentId))
      .get();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/operations/[id]/assignments error:', error);
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
    const { assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    const assignment = db
      .select()
      .from(operationAssignments)
      .where(
        and(
          eq(operationAssignments.id, assignmentId),
          eq(operationAssignments.operationId, operationId)
        )
      )
      .get();

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or does not belong to this operation' },
        { status: 404 }
      );
    }

    db.delete(operationAssignments).where(eq(operationAssignments.id, assignmentId)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/operations/[id]/assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
