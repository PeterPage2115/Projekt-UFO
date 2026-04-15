import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { canManageUsers, isAdmin } from "@/lib/auth/guards";
import type { UserRole } from "@/lib/auth/config";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !canManageUsers(session.user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const allUsers = db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        role: users.role,
        travianUid: users.travianUid,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .all();

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !canManageUsers(session.user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = body as { userId: string; role: UserRole };

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId i role są wymagane" },
        { status: 400 },
      );
    }

    const validRoles: UserRole[] = ["admin", "leader", "officer", "member"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Nieprawidłowa rola" }, { status: 400 });
    }

    // Leaders can only set officer/member
    if (!isAdmin(session.user.role) && (role === "admin" || role === "leader")) {
      return NextResponse.json(
        { error: "Nie masz uprawnień do przypisania tej roli" },
        { status: 403 },
      );
    }

    const { eq } = await import("drizzle-orm");
    const target = db.select().from(users).where(eq(users.id, userId)).get();
    if (!target) {
      return NextResponse.json(
        { error: "Użytkownik nie znaleziony" },
        { status: 404 },
      );
    }

    // Leaders cannot change admin/leader users
    if (
      !isAdmin(session.user.role) &&
      (target.role === "admin" || target.role === "leader")
    ) {
      return NextResponse.json(
        { error: "Nie możesz zmienić roli tego użytkownika" },
        { status: 403 },
      );
    }

    db.update(users).set({ role }).where(eq(users.id, userId)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 },
    );
  }
}
