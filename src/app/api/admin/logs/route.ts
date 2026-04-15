import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemLogs } from "@/lib/db/schema";
import { desc, eq, and, gte, lte, type SQL } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/guards";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const category = searchParams.get("category");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions: SQL[] = [];

    if (level) {
      conditions.push(eq(systemLogs.level, level as "info" | "warn" | "error"));
    }
    if (category) {
      conditions.push(
        eq(
          systemLogs.category,
          category as "auth" | "map_sql" | "operation" | "defense" | "system",
        ),
      );
    }
    if (dateFrom) {
      conditions.push(gte(systemLogs.createdAt, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(systemLogs.createdAt, dateTo));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const logs = db
      .select()
      .from(systemLogs)
      .where(where)
      .orderBy(desc(systemLogs.id))
      .limit(limit)
      .offset(offset)
      .all();

    const countResult = db
      .select({ id: systemLogs.id })
      .from(systemLogs)
      .where(where)
      .all();

    return NextResponse.json({
      logs,
      total: countResult.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 },
    );
  }
}
