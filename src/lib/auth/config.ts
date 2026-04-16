import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users, systemLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';
import { v4 as uuid } from 'uuid';

export type UserRole = 'admin' | 'leader' | 'officer' | 'member';

declare module 'next-auth' {
  interface User {
    role: UserRole;
    username: string;
  }
  interface Session {
    user: {
      id: string;
      role: UserRole;
      username: string;
      displayName?: string | null;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role: UserRole;
    username: string;
    displayName?: string | null;
  }
}

async function ensureAdminExists() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) return;

  const existing = db.select().from(users).where(eq(users.username, adminUsername)).get();
  if (existing) return;

  const passwordHash = await hash(adminPassword, 12);
  db.insert(users).values({
    id: uuid(),
    username: adminUsername,
    displayName: 'Admin',
    passwordHash,
    role: 'admin',
    createdAt: new Date().toISOString(),
  }).run();
}

// Run on startup
ensureAdminExists().catch(console.error);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const username = credentials?.username as string;
        const password = credentials?.password as string;

        if (!username || !password) return null;

        const user = db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .get();

        if (!user) return null;

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) return null;

        // Update last login
        db.update(users)
          .set({ lastLoginAt: new Date().toISOString() })
          .where(eq(users.id, user.id))
          .run();

        // Log login
        db.insert(systemLogs).values({
          level: 'info',
          category: 'auth',
          message: `User ${user.username} logged in`,
          userId: user.id,
          createdAt: new Date().toISOString(),
        }).run();

        return {
          id: user.id,
          role: user.role as UserRole,
          username: user.username,
          name: user.displayName || user.username,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: UserRole }).role;
        token.username = (user as { username: string }).username;
        token.displayName = user.name ?? null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role;
      session.user.username = token.username;
      session.user.displayName = token.displayName ?? null;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});
