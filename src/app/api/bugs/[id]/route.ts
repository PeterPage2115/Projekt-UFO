import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bugReports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/guards";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body as {
      status?: string;
      adminNotes?: string;
    };

    const existing = db
      .select()
      .from(bugReports)
      .where(eq(bugReports.id, id))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Zgłoszenie nie znalezione" },
        { status: 404 },
      );
    }

    const validStatuses = ["new", "in_progress", "resolved", "closed", "wont_fix"];
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (status && validStatuses.includes(status)) {
      updates.status = status;
      if (status === "resolved" || status === "closed") {
        updates.resolvedBy = session.user.id;
      }
    }

    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes;
    }

    db.update(bugReports).set(updates).where(eq(bugReports.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating bug report:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 },
    );
  }
}
