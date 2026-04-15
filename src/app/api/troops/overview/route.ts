import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { canViewTroops } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { troopReports, users } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { TRIBES } from '@/lib/game/tribes';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canViewTroops(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden — officers+ only' }, { status: 403 });
    }

    // Fetch all reports with user info
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
        displayName: users.displayName,
        username: users.username,
        travianUid: users.travianUid,
      })
      .from(troopReports)
      .leftJoin(users, eq(troopReports.userId, users.id))
      .orderBy(desc(troopReports.offValue))
      .all();

    // Totals
    let totalOff = 0;
    let totalInfDef = 0;
    let totalCavDef = 0;

    // Per-user aggregation
    const userMap = new Map<
      string,
      {
        userId: string;
        displayName: string;
        totalOff: number;
        totalInfDef: number;
        totalCavDef: number;
        reportCount: number;
      }
    >();

    // Per-tribe aggregation (infer tribe from troops JSON unit names)
    const tribeMap = new Map<
      number,
      {
        tribeId: number;
        tribeName: string;
        players: Set<string>;
        totalOff: number;
        totalInfDef: number;
        totalCavDef: number;
      }
    >();

    for (const r of reports) {
      const off = r.offValue ?? 0;
      const infDef = r.defInfValue ?? 0;
      const cavDef = r.defCavValue ?? 0;
      totalOff += off;
      totalInfDef += infDef;
      totalCavDef += cavDef;

      // Per-user
      const uKey = r.userId;
      if (!userMap.has(uKey)) {
        userMap.set(uKey, {
          userId: r.userId,
          displayName: r.displayName || r.username || 'Unknown',
          totalOff: 0,
          totalInfDef: 0,
          totalCavDef: 0,
          reportCount: 0,
        });
      }
      const u = userMap.get(uKey)!;
      u.totalOff += off;
      u.totalInfDef += infDef;
      u.totalCavDef += cavDef;
      u.reportCount += 1;

      // Per-tribe — infer tribe from unit names in troops JSON
      const troopsObj: Record<string, number> = r.troops ? JSON.parse(r.troops) : {};
      const unitNames = Object.keys(troopsObj);
      if (unitNames.length > 0) {
        const detectedTribeId = detectTribe(unitNames);
        if (detectedTribeId) {
          if (!tribeMap.has(detectedTribeId)) {
            const tribe = TRIBES[detectedTribeId];
            tribeMap.set(detectedTribeId, {
              tribeId: detectedTribeId,
              tribeName: tribe?.namePl || tribe?.nameEn || `Tribe ${detectedTribeId}`,
              players: new Set(),
              totalOff: 0,
              totalInfDef: 0,
              totalCavDef: 0,
            });
          }
          const t = tribeMap.get(detectedTribeId)!;
          t.players.add(r.userId);
          t.totalOff += off;
          t.totalInfDef += infDef;
          t.totalCavDef += cavDef;
        }
      }
    }

    // Top 5 hammers
    const topHammers = reports
      .filter((r) => r.offValue && r.offValue > 0)
      .sort((a, b) => (b.offValue ?? 0) - (a.offValue ?? 0))
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        userId: r.userId,
        displayName: r.displayName || r.username || 'Unknown',
        villageName: r.villageName,
        villageX: r.villageX,
        villageY: r.villageY,
        offValue: r.offValue,
        troopType: r.troopType,
      }));

    const perUser = Array.from(userMap.values()).sort((a, b) => b.totalOff - a.totalOff);
    const perTribe = Array.from(tribeMap.values()).map((t) => ({
      tribeId: t.tribeId,
      tribeName: t.tribeName,
      playerCount: t.players.size,
      totalOff: t.totalOff,
      totalInfDef: t.totalInfDef,
      totalCavDef: t.totalCavDef,
    }));

    return NextResponse.json({
      totalOff,
      totalInfDef,
      totalCavDef,
      reportCount: reports.length,
      perUser,
      perTribe,
      topHammers,
    });
  } catch (error) {
    console.error('[api/troops/overview] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 });
  }
}

/** Detect tribe ID from unit names */
function detectTribe(unitNames: string[]): number | null {
  for (const [tidStr, tribe] of Object.entries(TRIBES)) {
    const tribeUnitNames = tribe.units.flatMap((u) =>
      [u.name, u.namePl].filter(Boolean),
    );
    const match = unitNames.some((name) => tribeUnitNames.includes(name));
    if (match) return parseInt(tidStr, 10);
  }
  return null;
}
