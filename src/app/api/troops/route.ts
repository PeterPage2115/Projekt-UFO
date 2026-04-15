import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { canViewTroops } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { troopReports, users } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { TRIBES } from '@/lib/game/tribes';
import { calculateAttackValue, calculateDefenseValue } from '@/lib/game/tribes';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const villageX = url.searchParams.get('villageX');
    const villageY = url.searchParams.get('villageY');
    const troopType = url.searchParams.get('troopType');

    const isOfficer = canViewTroops(session.user.role);

    const conditions = [];

    // Members can only see their own reports
    if (!isOfficer) {
      conditions.push(eq(troopReports.userId, session.user.id));
    } else if (userId) {
      conditions.push(eq(troopReports.userId, userId));
    }

    if (villageX) conditions.push(eq(troopReports.villageX, parseInt(villageX, 10)));
    if (villageY) conditions.push(eq(troopReports.villageY, parseInt(villageY, 10)));
    if (troopType) conditions.push(eq(troopReports.troopType, troopType as 'off' | 'def' | 'scout' | 'siege'));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const reports = db
      .select({
        id: troopReports.id,
        userId: troopReports.userId,
        villageX: troopReports.villageX,
        villageY: troopReports.villageY,
        villageName: troopReports.villageName,
        troopType: troopReports.troopType,
        troops: troopReports.troops,
        offValue: troopReports.offValue,
        defInfValue: troopReports.defInfValue,
        defCavValue: troopReports.defCavValue,
        reportedAt: troopReports.reportedAt,
        notes: troopReports.notes,
        displayName: users.displayName,
        username: users.username,
      })
      .from(troopReports)
      .leftJoin(users, eq(troopReports.userId, users.id))
      .where(whereClause)
      .orderBy(desc(troopReports.reportedAt))
      .all();

    return NextResponse.json({ data: reports });
  } catch (error) {
    console.error('[api/troops] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch troop reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { villageX, villageY, villageName, troopType, troops, tribeId, notes } = body;

    if (villageX == null || villageY == null || !troopType || !troops || !tribeId) {
      return NextResponse.json(
        { error: 'Missing required fields: villageX, villageY, troopType, troops, tribeId' },
        { status: 400 },
      );
    }

    const validTypes = ['off', 'def', 'scout', 'siege'];
    if (!validTypes.includes(troopType)) {
      return NextResponse.json({ error: 'Invalid troopType' }, { status: 400 });
    }

    const tribe = TRIBES[tribeId];
    if (!tribe) {
      return NextResponse.json({ error: 'Invalid tribeId' }, { status: 400 });
    }

    // Calculate combat values
    const troopsObj: Record<string, number> = troops;
    const offValue = calculateAttackValue(tribeId, troopsObj);
    const { infDef: defInfValue, cavDef: defCavValue } = calculateDefenseValue(tribeId, troopsObj);

    const troopsJson = JSON.stringify(troopsObj);
    const now = new Date().toISOString();

    // Check if report already exists for this user + village coords
    const existing = db
      .select({ id: troopReports.id })
      .from(troopReports)
      .where(
        and(
          eq(troopReports.userId, session.user.id),
          eq(troopReports.villageX, villageX),
          eq(troopReports.villageY, villageY),
        ),
      )
      .get();

    if (existing) {
      // Update existing report
      db.update(troopReports)
        .set({
          villageName: villageName || null,
          troopType,
          troops: troopsJson,
          offValue,
          defInfValue,
          defCavValue,
          reportedAt: now,
          notes: notes || null,
        })
        .where(eq(troopReports.id, existing.id))
        .run();

      return NextResponse.json({ id: existing.id, updated: true });
    } else {
      // Create new report
      const id = crypto.randomUUID();
      db.insert(troopReports)
        .values({
          id,
          userId: session.user.id,
          villageX,
          villageY,
          villageName: villageName || null,
          troopType,
          troops: troopsJson,
          offValue,
          defInfValue,
          defCavValue,
          reportedAt: now,
          notes: notes || null,
        })
        .run();

      return NextResponse.json({ id, updated: false }, { status: 201 });
    }
  } catch (error) {
    console.error('[api/troops] POST error:', error);
    return NextResponse.json({ error: 'Failed to save troop report' }, { status: 500 });
  }
}
