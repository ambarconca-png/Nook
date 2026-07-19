import { NextResponse } from "next/server";
import { and, count, eq, gte, lte } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import {
  areas,
  inboxItems,
  knowledgeProjectBlocks,
  knowledgeProjectPages,
  knowledgeProjects,
  routineCompletions,
  routines,
  taskProjects,
  tasks,
  trackingEntries,
  trackingTrackers,
} from "@/lib/db/schema";
import { localDate } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanDate(value: unknown) {
  const date = cleanText(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function cleanPriority(value: unknown) {
  const priority = cleanText(value, 10);
  return ["low", "medium", "high"].includes(priority) ? priority : "none";
}

function cleanRecurrence(value: unknown) {
  const recurrence = cleanText(value, 10);
  return ["daily", "weekly", "monthly"].includes(recurrence)
    ? recurrence
    : "none";
}

function cleanProjectStatus(value: unknown) {
  const status = cleanText(value, 12);
  return ["idea", "active", "paused", "complete"].includes(status)
    ? status
    : "idea";
}

function cleanProjectBlockType(value: unknown) {
  const type = cleanText(value, 12);
  return ["checklist", "link", "table"].includes(type) ? type : "";
}

function cleanProjectBlockContent(value: unknown) {
  if (typeof value !== "string") return "{}";
  const content = value.slice(0, 50000);
  try {
    JSON.parse(content);
    return content;
  } catch {
    return "{}";
  }
}

function cleanRoutinePeriod(value: unknown) {
  const period = cleanText(value, 8);
  return ["day", "month"].includes(period) ? period : "week";
}

function cleanRoutineRhythm(value: unknown) {
  return cleanText(value, 10) === "fixed" ? "fixed" : "flexible";
}

function cleanRoutineChoice(
  value: unknown,
  allowed: string[],
  fallback: string,
) {
  const choice = cleanText(value, 20);
  return allowed.includes(choice) ? choice : fallback;
}

function routinePeriodBounds(period: string) {
  const today = localDate();
  if (period === "day") return { start: today, end: today };
  if (period === "month") {
    const date = new Date(`${today}T12:00:00Z`);
    return {
      start: `${today.slice(0, 7)}-01`,
      end: new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
      )
        .toISOString()
        .slice(0, 10),
    };
  }
  return currentWeekBounds();
}

function cleanWeekdays(value: unknown) {
  if (!Array.isArray(value)) return "[]";
  return JSON.stringify(
    value.filter(
      (day): day is number =>
        typeof day === "number" &&
        Number.isInteger(day) &&
        day >= 1 &&
        day <= 7,
    ),
  );
}

function cleanDateTime(value: unknown) {
  if (typeof value !== "string" || value.length > 40) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function cleanTrackingData(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "{}";
  return JSON.stringify(value).slice(0, 50000);
}

function cleanTrackingFields(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 12)
    .map((rawField, index) => {
      if (!rawField || typeof rawField !== "object") return null;
      const field = rawField as Record<string, unknown>;
      const label = cleanText(field.label, 80);
      const type = cleanRoutineChoice(
        field.type,
        ["boolean", "scale", "number", "duration", "multiselect", "text"],
        "text",
      );
      const id =
        cleanText(field.id, 50).replace(/[^a-zA-Z0-9_-]/g, "") ||
        `field_${index + 1}`;
      const unit = cleanText(field.unit, 40) || undefined;
      const options = Array.isArray(field.options)
        ? field.options
            .filter((option): option is string => typeof option === "string")
            .map((option) => option.trim().slice(0, 80))
            .filter(Boolean)
            .slice(0, 20)
        : [];
      return label ? { id, label, type, unit, options } : null;
    })
    .filter(Boolean);
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
              dueDate: localDate(),
              priority: "none",
              notes: "",
              recurrence: "none",
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
          routine: {
            ...routine,
            category: "Alltag",
            rhythm: "flexible",
            period: "week",
            amount: undefined,
            unit: "Einheit",
            preferredWeekdays: [],
            reminderTime: undefined,
            startDate: undefined,
            endDate: undefined,
            color: "teal",
            symbol: "repeat",
            completed: 0,
            completionDates: [],
          },
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

    if (action === "create-knowledge-project") {
      const title = cleanText(body.title, 180);
      const description = cleanText(body.description, 4000);
      const status = cleanProjectStatus(body.status);
      if (!title) {
        return NextResponse.json(
          { error: "Bitte gib dem Projekt einen Titel." },
          { status: 400 },
        );
      }

      const result = await db.transaction(async (tx) => {
        const [project] = await tx
          .insert(knowledgeProjects)
          .values({ userId: user.id, title, description, status })
          .returning({
            id: knowledgeProjects.id,
            title: knowledgeProjects.title,
            description: knowledgeProjects.description,
            status: knowledgeProjects.status,
          });
        const [page] = await tx
          .insert(knowledgeProjectPages)
          .values({
            projectId: project.id,
            userId: user.id,
            title: "Erste Gedanken",
          })
          .returning({
            id: knowledgeProjectPages.id,
            projectId: knowledgeProjectPages.projectId,
            title: knowledgeProjectPages.title,
            content: knowledgeProjectPages.content,
            position: knowledgeProjectPages.position,
          });
        return { project, page };
      });

      return NextResponse.json(result);
    }

    if (action === "update-knowledge-project") {
      const id = cleanText(body.id, 50);
      const title = cleanText(body.title, 180);
      const description = cleanText(body.description, 4000);
      const status = cleanProjectStatus(body.status);
      if (!title) {
        return NextResponse.json(
          { error: "Bitte gib dem Projekt einen Titel." },
          { status: 400 },
        );
      }

      const [project] = await db
        .update(knowledgeProjects)
        .set({ title, description, status, updatedAt: new Date() })
        .where(
          and(eq(knowledgeProjects.id, id), eq(knowledgeProjects.userId, user.id)),
        )
        .returning({
          id: knowledgeProjects.id,
          title: knowledgeProjects.title,
          description: knowledgeProjects.description,
          status: knowledgeProjects.status,
        });
      if (!project) {
        return NextResponse.json(
          { error: "Projekt nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ project });
    }

    if (action === "delete-knowledge-project") {
      const id = cleanText(body.id, 50);
      const [project] = await db
        .delete(knowledgeProjects)
        .where(
          and(eq(knowledgeProjects.id, id), eq(knowledgeProjects.userId, user.id)),
        )
        .returning({ id: knowledgeProjects.id });
      if (!project) {
        return NextResponse.json(
          { error: "Projekt nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ id: project.id });
    }

    if (action === "create-knowledge-project-page") {
      const projectId = cleanText(body.projectId, 50);
      const title = cleanText(body.title, 180);
      if (!title) {
        return NextResponse.json(
          { error: "Bitte gib der Seite einen Titel." },
          { status: 400 },
        );
      }

      const [ownedProject] = await db
        .select({ id: knowledgeProjects.id })
        .from(knowledgeProjects)
        .where(
          and(
            eq(knowledgeProjects.id, projectId),
            eq(knowledgeProjects.userId, user.id),
          ),
        )
        .limit(1);
      if (!ownedProject) {
        return NextResponse.json(
          { error: "Projekt nicht gefunden." },
          { status: 404 },
        );
      }

      const [page] = await db
        .insert(knowledgeProjectPages)
        .values({ projectId, userId: user.id, title })
        .returning({
          id: knowledgeProjectPages.id,
          projectId: knowledgeProjectPages.projectId,
          title: knowledgeProjectPages.title,
          content: knowledgeProjectPages.content,
          position: knowledgeProjectPages.position,
        });
      return NextResponse.json({ page });
    }

    if (action === "update-knowledge-project-page") {
      const id = cleanText(body.id, 50);
      const title = cleanText(body.title, 180);
      const content = cleanText(body.content, 50000);
      if (!title) {
        return NextResponse.json(
          { error: "Bitte gib der Seite einen Titel." },
          { status: 400 },
        );
      }

      const [page] = await db
        .update(knowledgeProjectPages)
        .set({ title, content, updatedAt: new Date() })
        .where(
          and(
            eq(knowledgeProjectPages.id, id),
            eq(knowledgeProjectPages.userId, user.id),
          ),
        )
        .returning({
          id: knowledgeProjectPages.id,
          projectId: knowledgeProjectPages.projectId,
          title: knowledgeProjectPages.title,
          content: knowledgeProjectPages.content,
          position: knowledgeProjectPages.position,
        });
      if (!page) {
        return NextResponse.json(
          { error: "Notizseite nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ page });
    }

    if (action === "delete-knowledge-project-page") {
      const id = cleanText(body.id, 50);
      const [page] = await db
        .delete(knowledgeProjectPages)
        .where(
          and(
            eq(knowledgeProjectPages.id, id),
            eq(knowledgeProjectPages.userId, user.id),
          ),
        )
        .returning({ id: knowledgeProjectPages.id });
      if (!page) {
        return NextResponse.json(
          { error: "Notizseite nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ id: page.id });
    }

    if (action === "create-knowledge-project-block") {
      const pageId = cleanText(body.pageId, 50);
      const type = cleanProjectBlockType(body.type);
      if (!type) {
        return NextResponse.json(
          { error: "Dieser Inhaltsblock ist nicht verfügbar." },
          { status: 400 },
        );
      }

      const [ownedPage] = await db
        .select({ id: knowledgeProjectPages.id })
        .from(knowledgeProjectPages)
        .where(
          and(
            eq(knowledgeProjectPages.id, pageId),
            eq(knowledgeProjectPages.userId, user.id),
          ),
        )
        .limit(1);
      if (!ownedPage) {
        return NextResponse.json(
          { error: "Notizseite nicht gefunden." },
          { status: 404 },
        );
      }

      const defaults = {
        checklist: {
          title: "Checkliste",
          content: JSON.stringify({ items: [{ text: "", done: false }] }),
        },
        link: {
          title: "Link",
          content: JSON.stringify({ url: "", description: "" }),
        },
        table: {
          title: "Tabelle",
          content: JSON.stringify({
            columns: ["Spalte 1", "Spalte 2"],
            rows: [["", ""]],
          }),
        },
      } as const;
      const preset = defaults[type as keyof typeof defaults];

      const [block] = await db
        .insert(knowledgeProjectBlocks)
        .values({
          pageId,
          userId: user.id,
          type,
          title: preset.title,
          content: preset.content,
        })
        .returning({
          id: knowledgeProjectBlocks.id,
          pageId: knowledgeProjectBlocks.pageId,
          type: knowledgeProjectBlocks.type,
          title: knowledgeProjectBlocks.title,
          content: knowledgeProjectBlocks.content,
          position: knowledgeProjectBlocks.position,
        });
      return NextResponse.json({ block });
    }

    if (action === "update-knowledge-project-block") {
      const id = cleanText(body.id, 50);
      const title = cleanText(body.title, 180);
      const content = cleanProjectBlockContent(body.content);
      const [block] = await db
        .update(knowledgeProjectBlocks)
        .set({ title, content, updatedAt: new Date() })
        .where(
          and(
            eq(knowledgeProjectBlocks.id, id),
            eq(knowledgeProjectBlocks.userId, user.id),
          ),
        )
        .returning({
          id: knowledgeProjectBlocks.id,
          pageId: knowledgeProjectBlocks.pageId,
          type: knowledgeProjectBlocks.type,
          title: knowledgeProjectBlocks.title,
          content: knowledgeProjectBlocks.content,
          position: knowledgeProjectBlocks.position,
        });
      if (!block) {
        return NextResponse.json(
          { error: "Inhalt nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ block });
    }

    if (action === "delete-knowledge-project-block") {
      const id = cleanText(body.id, 50);
      const [block] = await db
        .delete(knowledgeProjectBlocks)
        .where(
          and(
            eq(knowledgeProjectBlocks.id, id),
            eq(knowledgeProjectBlocks.userId, user.id),
          ),
        )
        .returning({ id: knowledgeProjectBlocks.id });
      if (!block) {
        return NextResponse.json(
          { error: "Inhalt nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ id: block.id });
    }

    if (action === "create-task") {
      const title = cleanText(body.title, 240);
      let areaId = cleanText(body.areaId, 50) || null;
      let projectId = cleanText(body.projectId, 50) || null;
      const dueToday = body.dueToday === true;
      const dueDate = cleanDate(body.dueDate) ?? (dueToday ? localDate() : null);
      const priority = cleanPriority(body.priority);
      const notes = cleanText(body.notes, 5000);
      const recurrence = cleanRecurrence(body.recurrence);
      if (!title) {
        return NextResponse.json(
          { error: "Bitte gib eine Aufgabe ein." },
          { status: 400 },
        );
      }

      if (projectId) {
        const [ownedProject] = await db
          .select({
            id: taskProjects.id,
            areaId: taskProjects.areaId,
          })
          .from(taskProjects)
          .where(
            and(
              eq(taskProjects.id, projectId),
              eq(taskProjects.userId, user.id),
            ),
          )
          .limit(1);

        if (ownedProject) {
          areaId = ownedProject.areaId;
        } else {
          projectId = null;
        }
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
          projectId,
          title,
          dueDate,
          priority,
          notes,
          recurrence,
        })
        .returning({
          id: tasks.id,
          title: tasks.title,
          areaId: tasks.areaId,
          projectId: tasks.projectId,
          dueDate: tasks.dueDate,
          priority: tasks.priority,
          notes: tasks.notes,
          recurrence: tasks.recurrence,
        });

      return NextResponse.json({
        task: {
          id: task.id,
          title: task.title,
          areaId: task.areaId ?? "",
          projectId: task.projectId ?? undefined,
          dueDate: task.dueDate ?? undefined,
          dueToday: task.dueDate === localDate(),
          priority: task.priority,
          notes: task.notes,
          recurrence: task.recurrence,
          done: false,
        },
      });
    }

    if (action === "create-task-project") {
      const title = cleanText(body.title, 160);
      const areaId = cleanText(body.areaId, 50);
      const description = cleanText(body.description, 3000);
      const endDate = cleanDate(body.endDate);
      const notes = cleanText(body.notes, 10000);
      if (!title || !areaId) {
        return NextResponse.json(
          { error: "Projektname und Bereich werden benötigt." },
          { status: 400 },
        );
      }

      const [ownedArea] = await db
        .select({ id: areas.id })
        .from(areas)
        .where(and(eq(areas.id, areaId), eq(areas.userId, user.id)))
        .limit(1);
      if (!ownedArea) {
        return NextResponse.json(
          { error: "Bereich nicht gefunden." },
          { status: 404 },
        );
      }

      const [project] = await db
        .insert(taskProjects)
        .values({ userId: user.id, areaId, title, description, endDate, notes })
        .returning({
          id: taskProjects.id,
          title: taskProjects.title,
          areaId: taskProjects.areaId,
          description: taskProjects.description,
          endDate: taskProjects.endDate,
          notes: taskProjects.notes,
        });

      return NextResponse.json({
        project: { ...project, endDate: project.endDate ?? undefined },
      });
    }

    if (action === "update-task-project") {
      const id = cleanText(body.id, 50);
      const title = cleanText(body.title, 160);
      const areaId = cleanText(body.areaId, 50);
      const description = cleanText(body.description, 3000);
      const endDate = cleanDate(body.endDate);
      const notes = cleanText(body.notes, 10000);

      if (!title || !areaId) {
        return NextResponse.json(
          { error: "Projektname und Bereich werden benötigt." },
          { status: 400 },
        );
      }

      const [ownedArea] = await db
        .select({ id: areas.id })
        .from(areas)
        .where(and(eq(areas.id, areaId), eq(areas.userId, user.id)))
        .limit(1);
      if (!ownedArea) {
        return NextResponse.json(
          { error: "Bereich nicht gefunden." },
          { status: 404 },
        );
      }

      const [project] = await db
        .update(taskProjects)
        .set({ title, areaId, description, endDate, notes })
        .where(
          and(eq(taskProjects.id, id), eq(taskProjects.userId, user.id)),
        )
        .returning({
          id: taskProjects.id,
          title: taskProjects.title,
          areaId: taskProjects.areaId,
          description: taskProjects.description,
          endDate: taskProjects.endDate,
          notes: taskProjects.notes,
        });

      if (!project) {
        return NextResponse.json(
          { error: "Projekt nicht gefunden." },
          { status: 404 },
        );
      }

      await db
        .update(tasks)
        .set({ areaId })
        .where(
          and(eq(tasks.projectId, project.id), eq(tasks.userId, user.id)),
        );

      return NextResponse.json({
        project: { ...project, endDate: project.endDate ?? undefined },
      });
    }

    if (action === "update-task") {
      const id = cleanText(body.id, 50);
      const title = cleanText(body.title, 240);
      let areaId = cleanText(body.areaId, 50);
      let projectId = cleanText(body.projectId, 50) || null;
      const dueDate = cleanDate(body.dueDate);
      const priority = cleanPriority(body.priority);
      const notes = cleanText(body.notes, 5000);
      const recurrence = cleanRecurrence(body.recurrence);

      if (!title) {
        return NextResponse.json(
          { error: "Bitte gib eine Aufgabe ein." },
          { status: 400 },
        );
      }

      const [existingTask] = await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
        .limit(1);
      if (!existingTask) {
        return NextResponse.json(
          { error: "Aufgabe nicht gefunden." },
          { status: 404 },
        );
      }

      if (projectId) {
        const [ownedProject] = await db
          .select({
            id: taskProjects.id,
            areaId: taskProjects.areaId,
          })
          .from(taskProjects)
          .where(
            and(
              eq(taskProjects.id, projectId),
              eq(taskProjects.userId, user.id),
            ),
          )
          .limit(1);
        if (!ownedProject) {
          return NextResponse.json(
            { error: "Projekt nicht gefunden." },
            { status: 404 },
          );
        }
        areaId = ownedProject.areaId;
      } else {
        const [ownedArea] = await db
          .select({ id: areas.id })
          .from(areas)
          .where(and(eq(areas.id, areaId), eq(areas.userId, user.id)))
          .limit(1);
        if (!ownedArea) {
          return NextResponse.json(
            { error: "Bereich nicht gefunden." },
            { status: 404 },
          );
        }
      }

      const [task] = await db
        .update(tasks)
        .set({
          title,
          areaId,
          projectId,
          dueDate,
          priority,
          notes,
          recurrence,
        })
        .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
        .returning({
          id: tasks.id,
          title: tasks.title,
          areaId: tasks.areaId,
          projectId: tasks.projectId,
          dueDate: tasks.dueDate,
          priority: tasks.priority,
          notes: tasks.notes,
          recurrence: tasks.recurrence,
          completedAt: tasks.completedAt,
        });

      return NextResponse.json({
        task: {
          id: task.id,
          title: task.title,
          areaId: task.areaId ?? "",
          projectId: task.projectId ?? undefined,
          dueDate: task.dueDate ?? undefined,
          dueToday: task.dueDate === localDate(),
          priority: task.priority,
          notes: task.notes,
          recurrence: task.recurrence,
          done: Boolean(task.completedAt),
        },
      });
    }

    if (action === "delete-task") {
      const id = cleanText(body.id, 50);
      const [task] = await db
        .delete(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
        .returning({ id: tasks.id });

      if (!task) {
        return NextResponse.json(
          { error: "Aufgabe nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ id: task.id });
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

    if (action === "create-custom-tracker") {
      const name = cleanText(body.name, 120);
      const inputType = cleanRoutineChoice(
        body.inputType,
        ["boolean", "scale", "number", "duration", "multiselect", "text"],
        "text",
      );
      const unit = cleanText(body.unit, 40) || null;
      const color = cleanRoutineChoice(
        body.color,
        ["rose", "peach", "violet", "blue", "teal"],
        "violet",
      );
      const options = Array.isArray(body.options)
        ? body.options
            .filter((option): option is string => typeof option === "string")
            .map((option) => option.trim().slice(0, 80))
            .filter(Boolean)
            .slice(0, 20)
        : [];
      const fields = cleanTrackingFields(body.fields);
      if (!name) {
        return NextResponse.json(
          { error: "Bitte gib dem Tracker einen Namen." },
          { status: 400 },
        );
      }
      if (fields.length === 0) {
        return NextResponse.json(
          { error: "Füge mindestens ein Feld hinzu." },
          { status: 400 },
        );
      }

      const [tracker] = await db
        .insert(trackingTrackers)
        .values({
          userId: user.id,
          type: "custom",
          name,
          inputType,
          unit,
          options: JSON.stringify(options),
          fields: JSON.stringify(fields),
          color,
        })
        .onConflictDoNothing()
        .returning({
          id: trackingTrackers.id,
          type: trackingTrackers.type,
          name: trackingTrackers.name,
          inputType: trackingTrackers.inputType,
          unit: trackingTrackers.unit,
          color: trackingTrackers.color,
          fields: trackingTrackers.fields,
        });
      if (!tracker) {
        return NextResponse.json(
          { error: "Dieser Tracker existiert bereits." },
          { status: 409 },
        );
      }
      return NextResponse.json({
        tracker: {
          ...tracker,
          unit: tracker.unit ?? undefined,
          options,
          fields,
        },
      });
    }

    if (action === "delete-custom-tracker") {
      const id = cleanText(body.id, 50);
      const [tracker] = await db
        .delete(trackingTrackers)
        .where(
          and(
            eq(trackingTrackers.id, id),
            eq(trackingTrackers.userId, user.id),
            eq(trackingTrackers.type, "custom"),
          ),
        )
        .returning({ id: trackingTrackers.id });
      if (!tracker) {
        return NextResponse.json(
          { error: "Tracker nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ id: tracker.id });
    }

    if (action === "create-tracking-entry") {
      let trackerId = cleanText(body.trackerId, 50);
      const trackerType = cleanRoutineChoice(
        body.trackerType,
        ["menstruation", "headache", "custom"],
        "custom",
      );
      const startedAt = cleanDateTime(body.startedAt);
      const endedAt = cleanDateTime(body.endedAt);
      const data = cleanTrackingData(body.data);
      const notes = cleanText(body.notes, 10000);
      if (!startedAt) {
        return NextResponse.json(
          { error: "Bitte gib einen gültigen Beginn an." },
          { status: 400 },
        );
      }
      if (endedAt && endedAt < startedAt) {
        return NextResponse.json(
          { error: "Das Ende kann nicht vor dem Beginn liegen." },
          { status: 400 },
        );
      }

      let tracker;
      if (trackerId) {
        [tracker] = await db
          .select({
            id: trackingTrackers.id,
            type: trackingTrackers.type,
            name: trackingTrackers.name,
            inputType: trackingTrackers.inputType,
            unit: trackingTrackers.unit,
            options: trackingTrackers.options,
            fields: trackingTrackers.fields,
            color: trackingTrackers.color,
          })
          .from(trackingTrackers)
          .where(
            and(
              eq(trackingTrackers.id, trackerId),
              eq(trackingTrackers.userId, user.id),
            ),
          )
          .limit(1);
      } else if (trackerType === "menstruation" || trackerType === "headache") {
        const name =
          trackerType === "menstruation"
            ? "Menstruation"
            : "Kopfschmerzen & Migräne";
        [tracker] = await db
          .insert(trackingTrackers)
          .values({
            userId: user.id,
            type: trackerType,
            name,
            color: trackerType === "menstruation" ? "rose" : "violet",
          })
          .onConflictDoUpdate({
            target: [
              trackingTrackers.userId,
              trackingTrackers.type,
              trackingTrackers.name,
            ],
            set: { name },
          })
          .returning({
            id: trackingTrackers.id,
            type: trackingTrackers.type,
            name: trackingTrackers.name,
            inputType: trackingTrackers.inputType,
            unit: trackingTrackers.unit,
            options: trackingTrackers.options,
            fields: trackingTrackers.fields,
            color: trackingTrackers.color,
          });
        trackerId = tracker.id;
      }

      if (!tracker) {
        return NextResponse.json(
          { error: "Tracker nicht gefunden." },
          { status: 404 },
        );
      }

      const [entry] = await db
        .insert(trackingEntries)
        .values({
          trackerId: tracker.id,
          userId: user.id,
          startedAt,
          endedAt,
          data,
          notes,
        })
        .returning({
          id: trackingEntries.id,
          trackerId: trackingEntries.trackerId,
          startedAt: trackingEntries.startedAt,
          endedAt: trackingEntries.endedAt,
          notes: trackingEntries.notes,
        });
      return NextResponse.json({
        tracker: {
          ...tracker,
          inputType: tracker.inputType ?? undefined,
          unit: tracker.unit ?? undefined,
          options: (() => {
            try {
              return JSON.parse(tracker.options);
            } catch {
              return [];
            }
          })(),
          fields: (() => {
            try {
              return JSON.parse(tracker.fields);
            } catch {
              return [];
            }
          })(),
        },
        entry: {
          ...entry,
          startedAt: entry.startedAt.toISOString(),
          endedAt: entry.endedAt?.toISOString(),
          data: JSON.parse(data),
        },
      });
    }

    if (action === "delete-tracking-entry") {
      const id = cleanText(body.id, 50);
      const [entry] = await db
        .delete(trackingEntries)
        .where(
          and(
            eq(trackingEntries.id, id),
            eq(trackingEntries.userId, user.id),
          ),
        )
        .returning({ id: trackingEntries.id });
      if (!entry) {
        return NextResponse.json(
          { error: "Eintrag nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ id: entry.id });
    }

    if (action === "create-routine") {
      const title = cleanText(body.title, 120);
      const requestedTarget =
        typeof body.target === "number" ? Math.round(body.target) : 3;
      let target = Math.min(31, Math.max(1, requestedTarget));
      const category = cleanText(body.category, 80) || "Alltag";
      const rhythm = cleanRoutineRhythm(body.rhythm);
      const period = cleanRoutinePeriod(body.period);
      if (period === "day") target = 1;
      const requestedAmount =
        typeof body.amount === "number" ? Math.round(body.amount) : 0;
      const amount =
        requestedAmount > 0 ? Math.min(10000, requestedAmount) : null;
      const unit = cleanText(body.unit, 40) || "Einheit";
      const preferredWeekdays = cleanWeekdays(body.preferredWeekdays);
      const reminderTime = /^\d{2}:\d{2}$/.test(cleanText(body.reminderTime, 5))
        ? cleanText(body.reminderTime, 5)
        : null;
      const startDate = cleanDate(body.startDate) ?? localDate();
      const endDate = cleanDate(body.endDate);
      const color = cleanRoutineChoice(
        body.color,
        ["teal", "green", "rose", "violet", "blue"],
        "teal",
      );
      const symbol = cleanRoutineChoice(
        body.symbol,
        ["repeat", "activity", "book", "heart", "leaf"],
        "repeat",
      );
      if (!title) {
        return NextResponse.json(
          { error: "Bitte gib eine Routine ein." },
          { status: 400 },
        );
      }

      const [routine] = await db
        .insert(routines)
        .values({
          userId: user.id,
          title,
          weeklyTarget: target,
          category,
          rhythm,
          period,
          amount,
          unit,
          preferredWeekdays,
          reminderTime,
          startDate,
          endDate,
          color,
          symbol,
        })
        .returning({
          id: routines.id,
          title: routines.title,
          category: routines.category,
          rhythm: routines.rhythm,
          period: routines.period,
          target: routines.weeklyTarget,
          amount: routines.amount,
          unit: routines.unit,
          preferredWeekdays: routines.preferredWeekdays,
          reminderTime: routines.reminderTime,
          startDate: routines.startDate,
          endDate: routines.endDate,
          color: routines.color,
          symbol: routines.symbol,
        });
      return NextResponse.json({
        routine: {
          ...routine,
          preferredWeekdays: JSON.parse(routine.preferredWeekdays),
          reminderTime: routine.reminderTime ?? undefined,
          startDate: routine.startDate ?? undefined,
          endDate: routine.endDate ?? undefined,
          amount: routine.amount ?? undefined,
          completed: 0,
          completionDates: [],
        },
      });
    }

    if (action === "update-routine") {
      const id = cleanText(body.id, 50);
      const title = cleanText(body.title, 120);
      const requestedTarget =
        typeof body.target === "number" ? Math.round(body.target) : 3;
      let target = Math.min(31, Math.max(1, requestedTarget));
      const category = cleanText(body.category, 80) || "Alltag";
      const rhythm = cleanRoutineRhythm(body.rhythm);
      const period = cleanRoutinePeriod(body.period);
      if (period === "day") target = 1;
      const requestedAmount =
        typeof body.amount === "number" ? Math.round(body.amount) : 0;
      const amount =
        requestedAmount > 0 ? Math.min(10000, requestedAmount) : null;
      const unit = cleanText(body.unit, 40) || "Einheit";
      const preferredWeekdays = cleanWeekdays(body.preferredWeekdays);
      const reminderTime = /^\d{2}:\d{2}$/.test(cleanText(body.reminderTime, 5))
        ? cleanText(body.reminderTime, 5)
        : null;
      const startDate = cleanDate(body.startDate) ?? localDate();
      const endDate = cleanDate(body.endDate);
      const color = cleanRoutineChoice(
        body.color,
        ["teal", "green", "rose", "violet", "blue"],
        "teal",
      );
      const symbol = cleanRoutineChoice(
        body.symbol,
        ["repeat", "activity", "book", "heart", "leaf"],
        "repeat",
      );

      if (!title) {
        return NextResponse.json(
          { error: "Bitte gib der Routine einen Namen." },
          { status: 400 },
        );
      }

      const [routine] = await db
        .update(routines)
        .set({
          title,
          weeklyTarget: target,
          category,
          rhythm,
          period,
          amount,
          unit,
          preferredWeekdays,
          reminderTime,
          startDate,
          endDate,
          color,
          symbol,
        })
        .where(and(eq(routines.id, id), eq(routines.userId, user.id)))
        .returning({ id: routines.id });
      if (!routine) {
        return NextResponse.json(
          { error: "Routine nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ id });
    }

    if (action === "delete-routine") {
      const id = cleanText(body.id, 50);
      const [routine] = await db
        .delete(routines)
        .where(and(eq(routines.id, id), eq(routines.userId, user.id)))
        .returning({ id: routines.id });
      if (!routine) {
        return NextResponse.json(
          { error: "Routine nicht gefunden." },
          { status: 404 },
        );
      }
      return NextResponse.json({ id });
    }

    if (action === "toggle-routine-completion") {
      const id = cleanText(body.id, 50);
      const [routine] = await db
        .select({ id: routines.id, period: routines.period })
        .from(routines)
        .where(and(eq(routines.id, id), eq(routines.userId, user.id)))
        .limit(1);
      if (!routine) {
        return NextResponse.json(
          { error: "Routine nicht gefunden." },
          { status: 404 },
        );
      }

      const today = localDate();
      const [todayCompletion] = await db
        .select({ id: routineCompletions.id })
        .from(routineCompletions)
        .where(
          and(
            eq(routineCompletions.routineId, id),
            eq(routineCompletions.userId, user.id),
            eq(routineCompletions.completedOn, today),
          ),
        )
        .limit(1);
      if (todayCompletion) {
        await db
          .delete(routineCompletions)
          .where(eq(routineCompletions.id, todayCompletion.id));
      } else {
        await db.insert(routineCompletions).values({
          routineId: id,
          userId: user.id,
          completedOn: today,
        });
      }

      const bounds = routinePeriodBounds(routine.period);
      const [{ value: completed }] = await db
        .select({ value: count() })
        .from(routineCompletions)
        .where(
          and(
            eq(routineCompletions.routineId, id),
            gte(routineCompletions.completedOn, bounds.start),
            lte(routineCompletions.completedOn, bounds.end),
          ),
        );
      return NextResponse.json({
        id,
        completed,
        completedToday: !todayCompletion,
        date: today,
      });
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
