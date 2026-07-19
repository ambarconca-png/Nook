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
