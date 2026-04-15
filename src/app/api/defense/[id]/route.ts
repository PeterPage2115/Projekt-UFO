import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { canManageOps } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { defenseCalls, defenseResponses, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const call = db.select().from(defenseCalls).where(eq(defenseCalls.id, id)).get();
    if (!call) {
      return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
    }

    const responses = db.select({
      id: defenseResponses.id,
      defenseCallId: defenseResponses.defenseCallId,
      userId: defenseResponses.userId,
      sourceX: defenseResponses.sourceX,
      sourceY: defenseResponses.sourceY,
      sourceVillageName: defenseResponses.sourceVillageName,
      troops: defenseResponses.troops,
      infDefValue: defenseResponses.infDefValue,
      cavDefValue: defenseResponses.cavDefValue,
      sendTime: defenseResponses.sendTime,
      status: defenseResponses.status,
      createdAt: defenseResponses.createdAt,
      username: users.username,
      displayName: users.displayName,
    })
      .from(defenseResponses)
      .leftJoin(users, eq(defenseResponses.userId, users.id))
      .where(eq(defenseResponses.defenseCallId, id))
      .all();

    const collectedInfDef = responses.reduce((sum, r) => sum + (r.infDefValue || 0), 0);
    const collectedCavDef = responses.reduce((sum, r) => sum + (r.cavDefValue || 0), 0);

    return NextResponse.json({
      ...call,
      responses,
      responseCount: responses.length,
      collectedInfDef,
      collectedCavDef,
    });
  } catch (error) {
    console.error('[api/defense/[id]] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageOps(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const call = db.select().from(defenseCalls).where(eq(defenseCalls.id, id)).get();
    if (!call) {
      return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (body.status && ['active', 'fulfilled', 'expired', 'cancelled'].includes(body.status)) {
      updates.status = body.status;
    }
    if (body.description !== undefined) updates.description = body.description;
    if (body.requestedInfDef !== undefined) updates.requestedInfDef = body.requestedInfDef;
    if (body.requestedCavDef !== undefined) updates.requestedCavDef = body.requestedCavDef;
    if (body.impactTime !== undefined) updates.impactTime = body.impactTime;
    if (body.waveDelay !== undefined) updates.waveDelay = body.waveDelay;

    db.update(defenseCalls)
      .set(updates)
      .where(eq(defenseCalls.id, id))
      .run();

    const updated = db.select().from(defenseCalls).where(eq(defenseCalls.id, id)).get();
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[api/defense/[id]] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageOps(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const call = db.select().from(defenseCalls).where(eq(defenseCalls.id, id)).get();
    if (!call) {
      return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
    }

    db.update(defenseCalls)
      .set({ status: 'cancelled', updatedAt: new Date().toISOString() })
      .where(eq(defenseCalls.id, id))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/defense/[id]] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
