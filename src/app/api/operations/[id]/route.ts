import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { operations, operationTargets, operationAssignments, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth, type UserRole } from '@/lib/auth/config';
import { canManageOps } from '@/lib/auth/guards';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const isManager = canManageOps(session.user.role as UserRole);

    const [operation] = db
      .select()
      .from(operations)
      .where(eq(operations.id, id))
      .all();

    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    // Members must have at least one assignment for this operation
    if (!isManager) {
      const [memberAssignment] = db
        .select({ id: operationAssignments.id })
        .from(operationAssignments)
        .where(
          and(
            eq(operationAssignments.operationId, id),
            eq(operationAssignments.userId, session.user.id),
          ),
        )
        .limit(1)
        .all();

      if (!memberAssignment) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get all targets
    const targets = db
      .select()
      .from(operationTargets)
      .where(eq(operationTargets.operationId, id))
      .all();

    // Get assignments with user info
    const assignmentConditions = [eq(operationAssignments.operationId, id)];
    if (!isManager) {
      assignmentConditions.push(eq(operationAssignments.userId, session.user.id));
    }

    const assignments = db
      .select({
        id: operationAssignments.id,
        operationId: operationAssignments.operationId,
        targetId: operationAssignments.targetId,
        userId: operationAssignments.userId,
        sourceX: operationAssignments.sourceX,
        sourceY: operationAssignments.sourceY,
        sourceVillageName: operationAssignments.sourceVillageName,
        unitSpeed: operationAssignments.unitSpeed,
        waves: operationAssignments.waves,
        sendTime: operationAssignments.sendTime,
        travelTime: operationAssignments.travelTime,
        status: operationAssignments.status,
        confirmedAt: operationAssignments.confirmedAt,
        notes: operationAssignments.notes,
        username: users.username,
      })
      .from(operationAssignments)
      .leftJoin(users, eq(operationAssignments.userId, users.id))
      .where(and(...assignmentConditions))
      .all();

    return NextResponse.json({ operation, targets, assignments });
  } catch (error) {
    console.error('GET /api/operations/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManageOps(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const [existing] = db
      .select()
      .from(operations)
      .where(eq(operations.id, id))
      .all();

    if (!existing) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = ['name', 'type', 'status', 'landingTime', 'description'] as const;
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (updates.type) {
      const validTypes = ['attack', 'fake_and_real', 'scout'];
      if (!validTypes.includes(updates.type as string)) {
        return NextResponse.json(
          { error: 'Type must be one of: attack, fake_and_real, scout' },
          { status: 400 },
        );
      }
    }

    if (updates.status) {
      const validStatuses = ['draft', 'active', 'completed', 'cancelled'];
      if (!validStatuses.includes(updates.status as string)) {
        return NextResponse.json(
          { error: 'Status must be one of: draft, active, completed, cancelled' },
          { status: 400 },
        );
      }
    }

    updates.updatedAt = new Date().toISOString();

    db.update(operations).set(updates).where(eq(operations.id, id)).run();

    const [updated] = db
      .select()
      .from(operations)
      .where(eq(operations.id, id))
      .all();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/operations/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManageOps(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const [existing] = db
      .select()
      .from(operations)
      .where(eq(operations.id, id))
      .all();

    if (!existing) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft operations can be deleted' },
        { status: 400 },
      );
    }

    db.delete(operations).where(eq(operations.id, id)).run();

    return NextResponse.json({ message: 'Operation deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/operations/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
