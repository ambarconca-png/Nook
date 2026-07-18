# Codex: Start here

This repository already contains a functional UI prototype for **nook**, a personal home app (todos, inbox, routines, tracking, notes).

## Stack (WICHTIG — abweichend vom ursprünglichen Plan)

Diese App läuft **NICHT** auf Supabase + Vercel, sondern:

- **Datenbank**: Postgres 16 im Docker-Container auf Alains VPS
- **ORM**: **Drizzle** (Schema in `lib/db/schema.ts`)
- **Auth**: noch nicht implementiert. Wenn nötig: eigenes Session-System mit bcrypt bauen (kein Supabase Auth).
- **Deploy**: Push auf `main` → GitHub Actions baut Docker-Image → SSH zum VPS → Auto-Deploy
- **Live-URL**: https://nook.al-daellen.ch

## Deine ersten Aufgaben

1. UI läuft schon (siehe `app/page.tsx`) — sie speichert Daten aktuell nur im Browser-State.
2. Um Daten wirklich zu persistieren:
   - Tabelle(n) in `lib/db/schema.ts` definieren (drizzle-orm Syntax)
   - `npm run db:generate` → erzeugt SQL-Migration in `drizzle/`
   - In der App: `import { getDb } from "@/lib/db/client"` → Drizzle-Queries
   - Committen & pushen → Migration läuft beim Deploy automatisch
3. Deutsches Interface + Design-Identität beibehalten.

## Product rules

- This is a personal home, not a generic productivity tool.
- Capture first, organize later.
- Dashboard only shows today's relevant information.
- Areas may contain direct todos and optional projects.
- No streak pressure for routines.
- Cycle predictions must be labeled as estimates.
- No classic emoji icons.
- Brand name is always lowercase: nook.
