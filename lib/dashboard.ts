import "server-only";

import { and, asc, count, desc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  areas,
  inboxItems,
  routineCompletions,
  routines,
  tasks,
} from "@/lib/db/schema";
import type { Area, InboxItem, Routine, Task } from "@/lib/types";

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

export type DashboardData = {
  areas: Area[];
  tasks: Task[];
  routines: Routine[];
  inboxItems: InboxItem[];
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const db = getDb();
  const today = localDate();
  const week = currentWeekBounds();

  const [areaRows, taskRows, inboxRows, routineRows] = await Promise.all([
    db
      .select({ id: areas.id, name: areas.name })
      .from(areas)
      .where(eq(areas.userId, userId))
      .orderBy(asc(areas.createdAt)),
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        areaId: tasks.areaId,
        completedAt: tasks.completedAt,
      })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.dueDate, today)))
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
        target: routines.weeklyTarget,
        completed: count(routineCompletions.id),
      })
      .from(routines)
      .leftJoin(
        routineCompletions,
        and(
          eq(routineCompletions.routineId, routines.id),
          gte(routineCompletions.completedOn, week.start),
          lte(routineCompletions.completedOn, week.end),
        ),
      )
      .where(and(eq(routines.userId, userId), eq(routines.active, true)))
      .groupBy(routines.id)
      .orderBy(asc(routines.createdAt)),
  ]);

  return {
    areas: areaRows,
    tasks: taskRows.map((task) => ({
      id: task.id,
      title: task.title,
      areaId: task.areaId ?? "",
      dueToday: true,
      done: Boolean(task.completedAt),
    })),
    routines: routineRows,
    inboxItems: inboxRows.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}
