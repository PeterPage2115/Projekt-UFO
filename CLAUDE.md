# Projekt UFO 🛸

Centrum Dowodzenia Sojuszu UFOLODZY — Travian RoF x3

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- SQLite (better-sqlite3 + Drizzle ORM)
- NextAuth v5 (4 roles: admin/leader/officer/member)
- next-intl (PL/EN)
- Docker → GHCR → Unraid

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npx drizzle-kit push` — push DB schema
- `npx drizzle-kit studio` — DB browser

## Structure
- `src/lib/db/schema.ts` — Drizzle schema (13 tables)
- `src/lib/auth/` — NextAuth config + role guards
- `src/lib/game/` — tribes, calculators, constants
- `src/components/layout/` — Sidebar, Navbar
- `messages/` — i18n PL/EN

## Environment
Copy `.env.example` to `.env.local` and fill in secrets.
