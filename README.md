# nook

Nook ist eine persönliche Web-App für Alltag, Inbox, To-dos, Routinen, Tracking und Notizprojekte.

## Live

https://nook.al-daellen.ch

## Stack

- **Next.js 15** + **React 19** + **TypeScript** + **Tailwind CSS 3**
- **Postgres 16** + **Drizzle ORM** — Datenbank läuft im Docker-Container auf Alains VPS
- **Docker** + **GitHub Actions** für Auto-Deploy
- Reverse-Proxy: **Caddy** (zentral im `ambardaellen-app`-Stack auf demselben VPS)
- responsives Desktop- und Mobile-Layout, deutsches Interface, kleingeschriebenes `nook`-Branding, psychedelischer Rauch als Designakzent

## So arbeitest du daran (ohne Terminal)

1. Öffne das Repo auf github.com und drücke die Punkttaste `.` — das öffnet VS Code im Browser (github.dev).
2. Änderungen mit ChatGPT / Codex machen, in github.dev einfügen (oder Codex direkt ins Repo committen lassen).
3. Links auf das Source-Control-Symbol klicken → Commit-Message → Sync-Button.
4. ~2 Min später ist die Änderung live auf https://nook.al-daellen.ch.

## Persistenz (Datenbank benutzen)

Die aktuelle UI (`app/page.tsx`) speichert alles nur im Browser-State. Um wirklich zu persistieren:

1. `lib/db/schema.ts` editieren — Tabellen mit `pgTable(...)` definieren
2. `npm run db:generate` → erzeugt SQL-Migration in `drizzle/`
3. In deinem Code: `import { getDb } from "@/lib/db/client"` → Drizzle-Queries
4. Committen & pushen → Migration läuft automatisch beim Deploy

## Lokal entwickeln (optional)

Voraussetzung: Node 22, lokaler Postgres.

```bash
npm install
# .env.local mit DATABASE_URL setzen
npm run dev
```
