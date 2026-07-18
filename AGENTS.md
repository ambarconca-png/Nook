<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Stack (IMPORTANT — abweichend vom Original-Prompt)

Diese App wird **NICHT** auf Supabase + Vercel deployt, sondern:

- **Datenbank**: Postgres 16 im Docker-Container auf einem eigenen VPS
- **ORM**: **Drizzle** (nicht Supabase SDK) — Schema in `lib/db/schema.ts`
- **Auth**: noch nicht implementiert. Wenn Auth gebraucht wird, mit
  eigenen Sessions + bcrypt bauen (siehe daellengarnier/ambardaellen-app
  als Referenz). KEIN Supabase Auth.
- **Deploy**: Push nach `main` → GitHub Actions baut Docker-Image → SSH-Deploy
  zum VPS. Domain: https://nook.al-daellen.ch

## Wenn du Persistenz hinzufügst

1. Tabelle in `lib/db/schema.ts` definieren (drizzle-orm Syntax)
2. `npm run db:generate` → erzeugt SQL-Migration in `drizzle/`
3. In der App: `import { getDb } from "@/lib/db/client"` → Drizzle-Queries
4. Committen & pushen → Migration läuft beim Deploy automatisch
