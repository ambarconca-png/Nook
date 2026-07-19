import "server-only";

import { and, asc, desc, eq, gte } from "drizzle-orm";
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
import type {
  Area,
  InboxItem,
  KnowledgeProject,
  KnowledgeProjectBlock,
  KnowledgeProjectPage,
  Project,
  Routine,
  Task,
} from "@/lib/types";

const TIME_ZONE = "Europe/Zurich";

export function localDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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

function periodBounds(period: Routine["period"], today: string) {
  if (period === "day") return { start: today, end: today };
  const date = new Date(`${today}T12:00:00Z`);
  if (period === "month") {
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

export type DashboardData = {
  areas: Area[];
  projects: Project[];
  knowledgeProjects: KnowledgeProject[];
  knowledgeProjectPages: KnowledgeProjectPage[];
  knowledgeProjectBlocks: KnowledgeProjectBlock[];
  tasks: Task[];
  routines: Routine[];
  inboxItems: InboxItem[];
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const db = getDb();
  const today = localDate();

  const [
    areaRows,
    projectRows,
    knowledgeProjectRows,
    knowledgeProjectPageRows,
    knowledgeProjectBlockRows,
    taskRows,
    inboxRows,
    routineRows,
    routineCompletionRows,
  ] =
    await Promise.all([
    db
      .select({ id: areas.id, name: areas.name })
      .from(areas)
      .where(eq(areas.userId, userId))
      .orderBy(asc(areas.createdAt)),
      db
        .select({
          id: taskProjects.id,
          title: taskProjects.title,
          areaId: taskProjects.areaId,
          description: taskProjects.description,
          endDate: taskProjects.endDate,
          notes: taskProjects.notes,
        })
        .from(taskProjects)
        .where(eq(taskProjects.userId, userId))
        .orderBy(asc(taskProjects.createdAt)),
      db
        .select({
          id: knowledgeProjects.id,
          title: knowledgeProjects.title,
          description: knowledgeProjects.description,
          status: knowledgeProjects.status,
        })
        .from(knowledgeProjects)
        .where(eq(knowledgeProjects.userId, userId))
        .orderBy(desc(knowledgeProjects.updatedAt)),
      db
        .select({
          id: knowledgeProjectPages.id,
          projectId: knowledgeProjectPages.projectId,
          title: knowledgeProjectPages.title,
          content: knowledgeProjectPages.content,
          position: knowledgeProjectPages.position,
        })
        .from(knowledgeProjectPages)
        .where(eq(knowledgeProjectPages.userId, userId))
        .orderBy(
          asc(knowledgeProjectPages.position),
          asc(knowledgeProjectPages.createdAt),
        ),
      db
        .select({
          id: knowledgeProjectBlocks.id,
          pageId: knowledgeProjectBlocks.pageId,
          type: knowledgeProjectBlocks.type,
          title: knowledgeProjectBlocks.title,
          content: knowledgeProjectBlocks.content,
          position: knowledgeProjectBlocks.position,
        })
        .from(knowledgeProjectBlocks)
        .where(eq(knowledgeProjectBlocks.userId, userId))
        .orderBy(
          asc(knowledgeProjectBlocks.position),
          asc(knowledgeProjectBlocks.createdAt),
        ),
      db
        .select({
          id: tasks.id,
          title: tasks.title,
          areaId: tasks.areaId,
          projectId: tasks.projectId,
          dueDate: tasks.dueDate,
          priority: tasks.priority,
          notes: tasks.notes,
          recurrence: tasks.recurrence,
          completedAt: tasks.completedAt,
        })
        .from(tasks)
        .where(eq(tasks.userId, userId))
        .orderBy(asc(tasks.createdAt)),
    db
      .select({
        id: inboxItems.id,
        text: inboxItems.content,
        createdAt: inboxItems.createdAt,
      })
      .from(inboxItems)
      .where(
        and(eq(inboxItems.userId, userId), eq(inboxItems.status, "inbox")),
      )
      .orderBy(desc(inboxItems.createdAt))
      .limit(20),
      db
        .select({
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
        })
        .from(routines)
        .where(and(eq(routines.userId, userId), eq(routines.active, true)))
        .orderBy(asc(routines.createdAt)),
      db
        .select({
          routineId: routineCompletions.routineId,
          completedOn: routineCompletions.completedOn,
        })
        .from(routineCompletions)
        .where(
          and(
            eq(routineCompletions.userId, userId),
            gte(
              routineCompletions.completedOn,
              new Date(
                Date.UTC(
                  Number(today.slice(0, 4)),
                  Number(today.slice(5, 7)) - 7,
                  1,
                ),
              )
                .toISOString()
                .slice(0, 10),
            ),
          ),
        ),
    ]);

  return {
    areas: areaRows,
    projects: projectRows.map((project) => ({
      ...project,
      endDate: project.endDate ?? undefined,
    })),
    knowledgeProjects: knowledgeProjectRows.map((project) => ({
      ...project,
      status: ["active", "paused", "complete"].includes(project.status)
        ? (project.status as KnowledgeProject["status"])
        : "idea",
    })),
    knowledgeProjectPages: knowledgeProjectPageRows,
    knowledgeProjectBlocks: knowledgeProjectBlockRows
      .filter((block) => ["checklist", "link", "table"].includes(block.type))
      .map((block) => ({
        ...block,
        type: block.type as KnowledgeProjectBlock["type"],
      })),
    tasks: taskRows.map((task) => ({
      id: task.id,
      title: task.title,
      areaId: task.areaId ?? "",
      projectId: task.projectId ?? undefined,
      dueDate: task.dueDate ?? undefined,
      dueToday: task.dueDate === today,
      priority: ["low", "medium", "high"].includes(task.priority)
        ? (task.priority as Task["priority"])
        : "none",
      notes: task.notes,
      recurrence: ["daily", "weekly", "monthly"].includes(task.recurrence)
        ? (task.recurrence as Task["recurrence"])
        : "none",
      done: Boolean(task.completedAt),
    })),
    routines: routineRows.map((routine) => {
      const period = ["day", "month"].includes(routine.period)
        ? (routine.period as Routine["period"])
        : "week";
      const completionDates = routineCompletionRows
        .filter((completion) => completion.routineId === routine.id)
        .map((completion) => completion.completedOn);
      const bounds = periodBounds(period, today);
      return {
        id: routine.id,
        title: routine.title,
        category: routine.category,
        rhythm: routine.rhythm === "fixed" ? "fixed" : "flexible",
        period,
        target: routine.target,
        completed: completionDates.filter(
          (date) => date >= bounds.start && date <= bounds.end,
        ).length,
        amount: routine.amount ?? undefined,
        unit: routine.unit,
        preferredWeekdays: (() => {
          try {
            const days = JSON.parse(routine.preferredWeekdays);
            return Array.isArray(days)
              ? days.filter(
                  (day): day is number =>
                    Number.isInteger(day) && day >= 1 && day <= 7,
                )
              : [];
          } catch {
            return [];
          }
        })(),
        reminderTime: routine.reminderTime ?? undefined,
        startDate: routine.startDate ?? undefined,
        endDate: routine.endDate ?? undefined,
        color: ["green", "rose", "violet", "blue"].includes(routine.color)
          ? (routine.color as Routine["color"])
          : "teal",
        symbol: ["activity", "book", "heart", "leaf"].includes(routine.symbol)
          ? (routine.symbol as Routine["symbol"])
          : "repeat",
        completionDates,
      };
    }),
    inboxItems: inboxRows.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}
