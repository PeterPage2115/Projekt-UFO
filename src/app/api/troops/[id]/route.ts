import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { canViewTroops } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { troopReports } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const report = db
      .select({ id: troopReports.id, userId: troopReports.userId })
      .from(troopReports)
      .where(eq(troopReports.id, id))
      .get();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const isOfficer = canViewTroops(session.user.role);
    if (!isOfficer && report.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.delete(troopReports).where(eq(troopReports.id, id)).run();

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('[api/troops/[id]] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
