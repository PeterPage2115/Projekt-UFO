import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, systemLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, displayName, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Nazwa użytkownika i hasło są wymagane" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Hasło musi mieć minimum 6 znaków" },
        { status: 400 },
      );
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: "Nazwa użytkownika: 3-30 znaków" },
        { status: 400 },
      );
    }

    // Check if username exists
    const existing = db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (existing) {
      return NextResponse.json(
        { error: "Ta nazwa użytkownika jest już zajęta" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    db.insert(users)
      .values({
        id: uuidv4(),
        username,
        displayName: displayName || username,
        passwordHash,
        role: "member",
        createdAt: now,
      })
      .run();

    // Log registration
    db.insert(systemLogs)
      .values({
        level: "info",
        category: "auth",
        message: `Nowy użytkownik zarejestrowany: ${username}`,
        createdAt: now,
      })
      .run();

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 },
    );
  }
}
