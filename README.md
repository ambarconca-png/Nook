# nook

Nook ist eine persönliche Web-App für Alltag, Inbox, To-dos, Routinen, Tracking und Notizprojekte.

## Was bereits enthalten ist

- echtes Next.js-Projekt
- TypeScript
- Tailwind CSS
- responsives Desktop- und Mobile-Layout
- deutsches Interface
- kleingeschriebenes `nook`-Branding
- psychedelischer Rauch als Designakzent
- Dashboard
- Inbox
- To-dos
- Bereiche mit direkten To-dos
- optionale Projekte innerhalb von Bereichen
- Routinen
- Tracking
- Notizprojekte
- vorbereitete Supabase-Dateien
- vorbereitete Vercel-Konfiguration über Next.js

Die aktuelle Version speichert Änderungen nur während der laufenden Browsersitzung. Codex soll als nächsten Schritt Supabase-Login und dauerhafte Datenspeicherung anbinden.

## Lokal starten

1. Node.js installieren: https://nodejs.org
2. Dieses Projekt entpacken.
3. Den Projektordner in einem Terminal öffnen.
4. Folgende Befehle ausführen:

```bash
npm install
npm run dev
```

5. Im Browser öffnen:

```text
http://localhost:3000
```

## Für Codex

Repository in Codex öffnen und diesen Prompt verwenden:

```text
Read the README and inspect the existing Nook Next.js codebase.

First run the app and fix all TypeScript, build, lint, or runtime errors.
Preserve the current German UI and design direction.

Then implement:
1. Supabase email magic-link authentication.
2. Persistent database storage for areas, projects, tasks, inbox items, routines, and tracking entries.
3. Row Level Security using the supplied supabase/schema.sql.
4. Loading, empty, and error states.
5. Vercel deployment readiness.

Do not replace the design with a generic dashboard.
Keep lowercase nook branding, no emoji icons, soft rounded cards, large whitespace, and psychedelic smoke accents.
```

## Supabase später verbinden

1. In Supabase ein neues Projekt erstellen.
2. `supabase/schema.sql` im Supabase SQL Editor ausführen.
3. `.env.example` zu `.env.local` kopieren.
4. URL und anon key aus Supabase eintragen.

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## GitHub

Du kannst den gesamten entpackten Ordner in ein leeres GitHub-Repository hochladen. Anschließend kann Codex direkt daran weiterarbeiten.
