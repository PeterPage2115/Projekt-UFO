import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { canManageOps } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { defenseCalls, defenseResponses, villages, snapshots } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status) {
      conditions.push(eq(defenseCalls.status, status as 'active' | 'fulfilled' | 'expired' | 'cancelled'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const calls = db.select().from(defenseCalls)
      .where(whereClause)
      .orderBy(desc(defenseCalls.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    const totalResult = db.select({ count: sql<number>`count(*)` })
      .from(defenseCalls)
      .where(whereClause)
      .get();
    const total = totalResult?.count || 0;

    const callsWithResponses = calls.map(call => {
      const responses = db.select({
        infDefValue: defenseResponses.infDefValue,
        cavDefValue: defenseResponses.cavDefValue,
      }).from(defenseResponses)
        .where(eq(defenseResponses.defenseCallId, call.id))
        .all();

      const collectedInfDef = responses.reduce((sum, r) => sum + (r.infDefValue || 0), 0);
      const collectedCavDef = responses.reduce((sum, r) => sum + (r.cavDefValue || 0), 0);

      return {
        ...call,
        responseCount: responses.length,
        collectedInfDef,
        collectedCavDef,
      };
    });

    return NextResponse.json({
      data: callsWithResponses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[api/defense] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageOps(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { type, targetX, targetY, impactTime, waveDelay, requestedInfDef, requestedCavDef, description } = body;

    if (!type || targetX === undefined || targetY === undefined) {
      return NextResponse.json({ error: 'Brakuje wymaganych pól' }, { status: 400 });
    }
    if (!['normal', 'permanent', 'between_waves'].includes(type)) {
      return NextResponse.json({ error: 'Nieprawidłowy typ' }, { status: 400 });
    }

    // Auto-fill village/player name from latest snapshot
    let targetVillageName: string | null = null;
    let targetPlayerName: string | null = null;

    const latestSnapshot = db.select({ id: snapshots.id })
      .from(snapshots)
      .orderBy(desc(snapshots.id))
      .limit(1)
      .get();

    if (latestSnapshot) {
      const village = db.select()
        .from(villages)
        .where(and(
          eq(villages.snapshotId, latestSnapshot.id),
          eq(villages.x, targetX),
          eq(villages.y, targetY),
        ))
        .get();

      if (village) {
        targetVillageName = village.name;
        targetPlayerName = village.playerName;
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.insert(defenseCalls).values({
      id,
      type,
      status: 'active',
      targetX,
      targetY,
      targetVillageName,
      targetPlayerName,
      impactTime: impactTime || null,
      waveDelay: waveDelay || null,
      requestedInfDef: requestedInfDef || null,
      requestedCavDef: requestedCavDef || null,
      description: description || null,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    }).run();

    const created = db.select().from(defenseCalls).where(eq(defenseCalls.id, id)).get();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[api/defense] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
