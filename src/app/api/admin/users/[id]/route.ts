import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, systemLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/guards";
import bcrypt from "bcryptjs";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
    const { action, travianUid } = body as {
      action?: string;
      travianUid?: number;
    };

    const target = db.select().from(users).where(eq(users.id, id)).get();
    if (!target) {
      return NextResponse.json(
        { error: "Użytkownik nie znaleziony" },
        { status: 404 },
      );
    }

    if (action === "reset_password") {
      const tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      db.update(users).set({ passwordHash }).where(eq(users.id, id)).run();

      db.insert(systemLogs)
        .values({
          level: "warn",
          category: "auth",
          message: `Admin zresetował hasło użytkownika ${target.username}`,
          userId: session.user.id,
          createdAt: new Date().toISOString(),
        })
        .run();

      return NextResponse.json({ success: true, tempPassword });
    }

    if (travianUid !== undefined) {
      db.update(users)
        .set({ travianUid: travianUid || null })
        .where(eq(users.id, id))
        .run();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Brak akcji" }, { status: 400 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Nie możesz usunąć samego siebie" },
        { status: 400 },
      );
    }

    const target = db.select().from(users).where(eq(users.id, id)).get();
    if (!target) {
      return NextResponse.json(
        { error: "Użytkownik nie znaleziony" },
        { status: 404 },
      );
    }

    db.delete(users).where(eq(users.id, id)).run();

    db.insert(systemLogs)
      .values({
        level: "warn",
        category: "auth",
        message: `Admin usunął użytkownika ${target.username}`,
        userId: session.user.id,
        createdAt: new Date().toISOString(),
      })
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 },
    );
  }
}
