import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { defenseCalls, defenseResponses } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { TRIBES } from '@/lib/game/tribes';
import { calculateDistance, calculateSendTime } from '@/lib/game/calculators';
import { SERVER_SPEED } from '@/lib/game/constants';

function calcDefAndSpeed(troops: Record<string, number>) {
  let infDef = 0;
  let cavDef = 0;
  let slowest = Infinity;

  for (const [name, count] of Object.entries(troops)) {
    if (count <= 0) continue;
    for (const tribe of Object.values(TRIBES)) {
      const unit = tribe.units.find(u => u.name === name || u.namePl === name);
      if (unit) {
        infDef += unit.defInf * count;
        cavDef += unit.defCav * count;
        if (unit.speed < slowest) slowest = unit.speed;
        break;
      }
    }
  }

  return { infDef, cavDef, slowestSpeed: slowest === Infinity ? 3 : slowest };
}

function checkAndFulfill(callId: string) {
  const call = db.select().from(defenseCalls).where(eq(defenseCalls.id, callId)).get();
  if (!call || call.status !== 'active') return;

  const responses = db.select({
    infDefValue: defenseResponses.infDefValue,
    cavDefValue: defenseResponses.cavDefValue,
  }).from(defenseResponses)
    .where(eq(defenseResponses.defenseCallId, callId))
    .all();

  const totalInf = responses.reduce((sum, r) => sum + (r.infDefValue || 0), 0);
  const totalCav = responses.reduce((sum, r) => sum + (r.cavDefValue || 0), 0);

  const reqInf = call.requestedInfDef || 0;
  const reqCav = call.requestedCavDef || 0;

  if (reqInf > 0 && reqCav > 0 && totalInf >= reqInf && totalCav >= reqCav) {
    db.update(defenseCalls)
      .set({ status: 'fulfilled', updatedAt: new Date().toISOString() })
      .where(eq(defenseCalls.id, callId))
      .run();
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: callId } = await params;
    const call = db.select().from(defenseCalls).where(eq(defenseCalls.id, callId)).get();
    if (!call) {
      return NextResponse.json({ error: 'Nie znaleziono wezwania' }, { status: 404 });
    }
    if (call.status !== 'active') {
      return NextResponse.json({ error: 'Wezwanie nie jest aktywne' }, { status: 400 });
    }

    const body = await req.json();
    const { sourceX, sourceY, sourceVillageName, troops } = body;

    if (sourceX === undefined || sourceY === undefined || !troops || typeof troops !== 'object') {
      return NextResponse.json({ error: 'Brakuje wymaganych pól' }, { status: 400 });
    }

    const { infDef, cavDef, slowestSpeed } = calcDefAndSpeed(troops);

    // Calculate send time based on slowest unit
    let sendTime: string | null = null;
    if (call.impactTime) {
      const distance = calculateDistance(sourceX, sourceY, call.targetX, call.targetY);
      const sendDate = calculateSendTime(call.impactTime, distance, slowestSpeed, SERVER_SPEED);
      sendTime = sendDate.toISOString();
    }

    const id = crypto.randomUUID();
    db.insert(defenseResponses).values({
      id,
      defenseCallId: callId,
      userId: session.user.id,
      sourceX,
      sourceY,
      sourceVillageName: sourceVillageName || null,
      troops: JSON.stringify(troops),
      infDefValue: infDef,
      cavDefValue: cavDef,
      sendTime,
      status: 'pledged',
      createdAt: new Date().toISOString(),
    }).run();

    // Auto-fulfill check
    checkAndFulfill(callId);

    const created = db.select().from(defenseResponses).where(eq(defenseResponses.id, id)).get();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[api/defense/[id]/respond] POST error:', error);
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

    const { id: callId } = await params;
    const body = await req.json();
    const { responseId, status } = body;

    if (!responseId || !status) {
      return NextResponse.json({ error: 'Brakuje wymaganych pól' }, { status: 400 });
    }
    if (!['pledged', 'sent', 'arrived'].includes(status)) {
      return NextResponse.json({ error: 'Nieprawidłowy status' }, { status: 400 });
    }

    const response = db.select().from(defenseResponses)
      .where(and(
        eq(defenseResponses.id, responseId),
        eq(defenseResponses.defenseCallId, callId),
      ))
      .get();

    if (!response) {
      return NextResponse.json({ error: 'Nie znaleziono odpowiedzi' }, { status: 404 });
    }
    if (response.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.update(defenseResponses)
      .set({ status })
      .where(eq(defenseResponses.id, responseId))
      .run();

    const updated = db.select().from(defenseResponses).where(eq(defenseResponses.id, responseId)).get();
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[api/defense/[id]/respond] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: callId } = await params;
    const url = new URL(req.url);
    const responseId = url.searchParams.get('responseId');

    if (!responseId) {
      return NextResponse.json({ error: 'Brakuje responseId' }, { status: 400 });
    }

    const response = db.select().from(defenseResponses)
      .where(and(
        eq(defenseResponses.id, responseId),
        eq(defenseResponses.defenseCallId, callId),
      ))
      .get();

    if (!response) {
      return NextResponse.json({ error: 'Nie znaleziono odpowiedzi' }, { status: 404 });
    }
    if (response.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.delete(defenseResponses)
      .where(eq(defenseResponses.id, responseId))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/defense/[id]/respond] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
