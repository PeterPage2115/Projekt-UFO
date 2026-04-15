import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { operations, operationTargets, operationAssignments } from '@/lib/db/schema';
import { eq, and, desc, sql, inArray, count } from 'drizzle-orm';
import { auth, type UserRole } from '@/lib/auth/config';
import { canManageOps } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const offset = (page - 1) * limit;

    const isManager = canManageOps(session.user.role as UserRole);

    // Build conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(operations.status, status as 'draft' | 'active' | 'completed' | 'cancelled'));
    }

    // Members can only see operations they're assigned to
    let allowedOperationIds: string[] | null = null;
    if (!isManager) {
      const assigned = db
        .select({ operationId: operationAssignments.operationId })
        .from(operationAssignments)
        .where(eq(operationAssignments.userId, session.user.id))
        .all();

      allowedOperationIds = [...new Set(assigned.map((a) => a.operationId))];

      if (allowedOperationIds.length === 0) {
        return NextResponse.json({
          operations: [],
          pagination: { page, limit, total: 0 },
        });
      }

      conditions.push(inArray(operations.id, allowedOperationIds));
    }

    // Count total
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = db
      .select({ total: count() })
      .from(operations)
      .where(whereClause)
      .all();

    // Fetch operations
    const ops = db
      .select()
      .from(operations)
      .where(whereClause)
      .orderBy(desc(operations.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    // Get counts for each operation
    const opsWithCounts = ops.map((op) => {
      const [{ targetCount }] = db
        .select({ targetCount: count() })
        .from(operationTargets)
        .where(eq(operationTargets.operationId, op.id))
        .all();

      const [{ assignmentCount }] = db
        .select({ assignmentCount: count() })
        .from(operationAssignments)
        .where(eq(operationAssignments.operationId, op.id))
        .all();

      const [{ confirmedCount }] = db
        .select({ confirmedCount: count() })
        .from(operationAssignments)
        .where(
          and(
            eq(operationAssignments.operationId, op.id),
            eq(operationAssignments.status, 'confirmed'),
          ),
        )
        .all();

      return { ...op, targetCount, assignmentCount, confirmedCount };
    });

    return NextResponse.json({
      operations: opsWithCounts,
      pagination: { page, limit, total },
    });
  } catch (error) {
    console.error('GET /api/operations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManageOps(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, landingTime, description } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const validTypes = ['attack', 'fake_and_real', 'scout'] as const;
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Type is required and must be one of: attack, fake_and_real, scout' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const newOperation = {
      id: crypto.randomUUID(),
      name,
      type: type as 'attack' | 'fake_and_real' | 'scout',
      status: 'draft' as const,
      landingTime: landingTime ?? null,
      description: description ?? null,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(operations).values(newOperation).run();

    return NextResponse.json(newOperation, { status: 201 });
  } catch (error) {
    console.error('POST /api/operations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
