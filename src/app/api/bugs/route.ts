import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bugReports, users } from "@/lib/db/schema";
import { desc, eq, and, type SQL } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const conditions: SQL[] = [];

    if (status) {
      conditions.push(
        eq(
          bugReports.status,
          status as "new" | "in_progress" | "resolved" | "closed" | "wont_fix",
        ),
      );
    }
    if (priority) {
      conditions.push(
        eq(
          bugReports.priority,
          priority as "low" | "medium" | "high" | "critical",
        ),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const reports = db
      .select({
        id: bugReports.id,
        title: bugReports.title,
        description: bugReports.description,
        steps: bugReports.steps,
        priority: bugReports.priority,
        status: bugReports.status,
        page: bugReports.page,
        reportedBy: bugReports.reportedBy,
        resolvedBy: bugReports.resolvedBy,
        adminNotes: bugReports.adminNotes,
        createdAt: bugReports.createdAt,
        updatedAt: bugReports.updatedAt,
        reporterName: users.username,
      })
      .from(bugReports)
      .leftJoin(users, eq(bugReports.reportedBy, users.id))
      .where(where)
      .orderBy(desc(bugReports.createdAt))
      .all();

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching bug reports:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, steps, priority, page } = body as {
      title: string;
      description?: string;
      steps?: string;
      priority?: string;
      page?: string;
    };

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Tytuł jest wymagany" },
        { status: 400 },
      );
    }

    const validPriorities = ["low", "medium", "high", "critical"];
    const finalPriority = validPriorities.includes(priority || "")
      ? (priority as "low" | "medium" | "high" | "critical")
      : "medium";

    const now = new Date().toISOString();

    db.insert(bugReports)
      .values({
        id: uuid(),
        title: title.trim(),
        description: description?.trim() || null,
        steps: steps?.trim() || null,
        priority: finalPriority,
        status: "new",
        page: page?.trim() || null,
        reportedBy: session.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating bug report:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 },
    );
  }
}
