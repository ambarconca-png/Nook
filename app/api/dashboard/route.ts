import { NextResponse } from "next/server";
import { and, count, eq, gte, lte } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import {
  areas,
  inboxItems,
  routineCompletions,
  routines,
  tasks,
} from "@/lib/db/schema";
import { localDate } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function currentWeekBounds() {
  const today = localDate();
  const date = new Date(`${today}T12:00:00Z`);
  const day = date.getUTCDay() || 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get("host")) {
        return NextResponse.json(
          { error: "Ungültige Anfrage." },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Ungültige Anfrage." },
        { status: 403 },
      );
    }
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = cleanText(body.action, 40);
    const db = getDb();

    if (action === "capture") {
      const text = cleanText(body.text, 1000);
      if (!text) {
        return NextResponse.json(
          { error: "Bitte gib einen Gedanken ein." },
          { status: 400 },
        );
      }

      const [item] = await db
        .insert(inboxItems)
        .values({ userId: user.id, content: text })
        .returning({
          id: inboxItems.id,
          text: inboxItems.content,
          createdAt: inboxItems.createdAt,
        });
      return NextResponse.json({
        item: { ...item, createdAt: item.createdAt.toISOString() },
      });
    }

    if (action === "update-inbox") {
      const id = cleanText(body.id, 50);
      const text = cleanText(body.text, 1000);
      if (!text) {
        return NextResponse.json(
          { error: "Ein leerer Gedanke kann gelöscht werden." },
          { status: 400 },
        );
      }

      const [item] = await db
        .update(inboxItems)
        .set({ content: text })
        .where(
          and(
            eq(inboxItems.id, id),
            eq(inboxItems.userId, user.id),
            eq(inboxItems.status, "inbox"),
          ),
        )
        .returning({ id: inboxItems.id, text: inboxItems.content });

      if (!item) {
        return NextResponse.json(
          { error: "Inbox-Eintrag nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ item });
    }

    if (action === "delete-inbox") {
      const id = cleanText(body.id, 50);
      const [item] = await db
        .delete(inboxItems)
        .where(
          and(eq(inboxItems.id, id), eq(inboxItems.userId, user.id)),
        )
        .returning({ id: inboxItems.id });

      if (!item) {
        return NextResponse.json(
          { error: "Inbox-Eintrag nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ id });
    }

    if (action === "organize-inbox") {
      const id = cleanText(body.id, 50);
      const destination = cleanText(body.destination, 20);
      if (destination !== "todo" && destination !== "routine") {
        return NextResponse.json(
          { error: "Dieses Ziel ist noch nicht verfügbar." },
          { status: 400 },
        );
      }

      const result = await db.transaction(async (tx) => {
        const [item] = await tx
          .select({ id: inboxItems.id, text: inboxItems.content })
          .from(inboxItems)
          .where(
            and(
              eq(inboxItems.id, id),
              eq(inboxItems.userId, user.id),
              eq(inboxItems.status, "inbox"),
            ),
          )
          .limit(1);

        if (!item) return null;

        if (destination === "todo") {
          let [area] = await tx
            .select({ id: areas.id, name: areas.name })
            .from(areas)
            .where(and(eq(areas.userId, user.id), eq(areas.name, "Alltag")))
            .limit(1);

          if (!area) {
            [area] = await tx
              .insert(areas)
              .values({ userId: user.id, name: "Alltag" })
              .returning({ id: areas.id, name: areas.name });
          }

          const [task] = await tx
            .insert(tasks)
            .values({
              userId: user.id,
              areaId: area.id,
              title: item.text,
              dueDate: localDate(),
            })
            .returning({
              id: tasks.id,
              title: tasks.title,
              areaId: tasks.areaId,
            });

          await tx
            .update(inboxItems)
            .set({ status: "todo" })
            .where(eq(inboxItems.id, id));

          return {
            destination,
            area,
            task: {
              id: task.id,
              title: task.title,
              areaId: task.areaId ?? "",
              dueToday: true,
              done: false,
            },
          };
        }

        const [routine] = await tx
          .insert(routines)
          .values({ userId: user.id, title: item.text, weeklyTarget: 3 })
          .returning({
            id: routines.id,
            title: routines.title,
            target: routines.weeklyTarget,
          });

        await tx
          .update(inboxItems)
          .set({ status: "routine" })
          .where(eq(inboxItems.id, id));

        return {
          destination,
          routine: { ...routine, completed: 0 },
        };
      });

      if (!result) {
        return NextResponse.json(
          { error: "Inbox-Eintrag nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ id, ...result });
    }

    if (action === "create-area") {
      const name = cleanText(body.name, 80);
      if (!name) {
        return NextResponse.json(
          { error: "Bitte gib einen Namen ein." },
          { status: 400 },
        );
      }

      const [area] = await db
        .insert(areas)
        .values({ userId: user.id, name })
        .onConflictDoNothing()
        .returning({ id: areas.id, name: areas.name });

      if (!area) {
        return NextResponse.json(
          { error: "Dieser Bereich existiert bereits." },
          { status: 409 },
        );
      }
      return NextResponse.json({ area });
    }

    if (action === "create-task") {
      const title = cleanText(body.title, 240);
      let areaId = cleanText(body.areaId, 50) || null;
      if (!title) {
        return NextResponse.json(
          { error: "Bitte gib eine Aufgabe ein." },
          { status: 400 },
        );
      }

      if (areaId) {
        const [ownedArea] = await db
          .select({ id: areas.id })
          .from(areas)
          .where(and(eq(areas.id, areaId), eq(areas.userId, user.id)))
          .limit(1);
        if (!ownedArea) areaId = null;
      }

      if (!areaId) {
        const [existingArea] = await db
          .select({ id: areas.id })
          .from(areas)
          .where(and(eq(areas.userId, user.id), eq(areas.name, "Alltag")))
          .limit(1);

        if (existingArea) {
          areaId = existingArea.id;
        } else {
          const [createdArea] = await db
            .insert(areas)
            .values({ userId: user.id, name: "Alltag" })
            .returning({ id: areas.id });
          areaId = createdArea.id;
        }
      }

      const [task] = await db
        .insert(tasks)
        .values({
          userId: user.id,
          areaId,
          title,
          dueDate: localDate(),
        })
        .returning({ id: tasks.id, title: tasks.title, areaId: tasks.areaId });

      return NextResponse.json({
        task: {
          id: task.id,
          title: task.title,
          areaId: task.areaId ?? "",
          dueToday: true,
          done: false,
        },
      });
    }

    if (action === "toggle-task") {
      const id = cleanText(body.id, 50);
      const done = body.done === true;
      const [task] = await db
        .update(tasks)
        .set({ completedAt: done ? new Date() : null })
        .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
        .returning({ id: tasks.id });

      if (!task) {
        return NextResponse.json(
          { error: "Aufgabe nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ id, done });
    }

    if (action === "create-routine") {
      const title = cleanText(body.title, 120);
      const requestedTarget =
        typeof body.target === "number" ? Math.round(body.target) : 3;
      const target = Math.min(14, Math.max(1, requestedTarget));
      if (!title) {
        return NextResponse.json(
          { error: "Bitte gib eine Routine ein." },
          { status: 400 },
        );
      }

      const [routine] = await db
        .insert(routines)
        .values({ userId: user.id, title, weeklyTarget: target })
        .returning({
          id: routines.id,
          title: routines.title,
          target: routines.weeklyTarget,
        });
      return NextResponse.json({ routine: { ...routine, completed: 0 } });
    }

    if (action === "increment-routine") {
      const id = cleanText(body.id, 50);
      const [routine] = await db
        .select({ id: routines.id })
        .from(routines)
        .where(and(eq(routines.id, id), eq(routines.userId, user.id)))
        .limit(1);

      if (!routine) {
        return NextResponse.json(
          { error: "Routine nicht gefunden." },
          { status: 404 },
        );
      }

      await db
        .insert(routineCompletions)
        .values({
          routineId: id,
          userId: user.id,
          completedOn: localDate(),
        })
        .onConflictDoNothing();

      const week = currentWeekBounds();
      const [{ value: completed }] = await db
        .select({ value: count() })
        .from(routineCompletions)
        .where(
          and(
            eq(routineCompletions.routineId, id),
            gte(routineCompletions.completedOn, week.start),
            lte(routineCompletions.completedOn, week.end),
          ),
        );
      return NextResponse.json({ id, completed });
    }

    return NextResponse.json({ error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    console.error("[dashboard]", error);
    return NextResponse.json(
      { error: "Änderung konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}
