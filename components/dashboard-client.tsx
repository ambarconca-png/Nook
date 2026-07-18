"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FolderKanban,
  HeartPulse,
  Home,
  Inbox,
  LogOut,
  Menu,
  Plus,
  Repeat2,
  Search,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { SmokeBackground } from "@/components/smoke-background";
import { NookCard } from "@/components/nook-card";
import { TaskRow } from "@/components/task-row";
import { RoutineRow } from "@/components/routine-row";
import { InboxItemRow } from "@/components/inbox-item-row";
import type { DashboardData } from "@/lib/dashboard";
import type { Area, InboxItem, Project, Routine, Task } from "@/lib/types";

type PageId = "today" | "inbox" | "todos" | "routines" | "tracking" | "projects";

const navigation = [
  { id: "today" as PageId, label: "Heute", icon: Home },
  { id: "inbox" as PageId, label: "Inbox", icon: Inbox },
  { id: "todos" as PageId, label: "To-dos", icon: CheckCircle2 },
  { id: "routines" as PageId, label: "Routinen", icon: Repeat2 },
  { id: "tracking" as PageId, label: "Tracking", icon: HeartPulse },
  { id: "projects" as PageId, label: "Projekte", icon: FolderKanban },
];

function getGreeting(hour: number) {
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

export function DashboardClient({
  displayName,
  initialData,
}: {
  displayName: string;
  initialData: DashboardData;
}) {
  const [page, setPage] = useState<PageId>("today");
  const [menuOpen, setMenuOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureText, setCaptureText] = useState("");
  const [captureError, setCaptureError] = useState("");
  const [captureSaving, setCaptureSaving] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskAreaId, setEditTaskAreaId] = useState("");
  const [editTaskProjectId, setEditTaskProjectId] = useState("");
  const [editTaskDueToday, setEditTaskDueToday] = useState(false);
  const [editTaskError, setEditTaskError] = useState("");
  const [editTaskSaving, setEditTaskSaving] = useState(false);

  const [areas, setAreas] = useState(initialData.areas);
  const [projects, setProjects] = useState(initialData.projects);
  const [tasks, setTasks] = useState(initialData.tasks);
  const [routines, setRoutines] = useState(initialData.routines);
  const [inboxItems, setInboxItems] = useState(initialData.inboxItems);

  const todayTasks = useMemo(
    () => tasks.filter((task) => task.dueToday),
    [tasks],
  );

  async function dashboardAction<T>(body: Record<string, unknown>) {
    const response = await fetch("/api/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as T & { error?: string };

    if (response.status === 401) {
      window.location.href = "/login";
      throw new Error("Nicht angemeldet.");
    }
    if (!response.ok) {
      throw new Error(result.error ?? "Änderung konnte nicht gespeichert werden.");
    }
    return result;
  }

  async function toggleTask(id: string) {
    const currentTask = tasks.find((task) => task.id === id);
    if (!currentTask) return;
    const done = !currentTask.done;

    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, done } : task,
      ),
    );
    try {
      await dashboardAction({ action: "toggle-task", id, done });
    } catch {
      setTasks((current) =>
        current.map((task) =>
          task.id === id ? { ...task, done: currentTask.done } : task,
        ),
      );
    }
  }

  function openTaskEditor(task: Task) {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskAreaId(task.areaId);
    setEditTaskProjectId(task.projectId ?? "");
    setEditTaskDueToday(task.dueToday);
    setEditTaskError("");
  }

  async function saveTaskEdit() {
    if (!editingTask || !editTaskTitle.trim()) {
      setEditTaskError("Bitte gib eine Aufgabe ein.");
      return;
    }

    setEditTaskSaving(true);
    setEditTaskError("");
    try {
      const result = await dashboardAction<{ task: Task }>({
        action: "update-task",
        id: editingTask.id,
        title: editTaskTitle,
        areaId: editTaskAreaId,
        projectId: editTaskProjectId || undefined,
        dueToday: editTaskDueToday,
      });
      setTasks((current) =>
        current.map((task) =>
          task.id === editingTask.id ? result.task : task,
        ),
      );
      setEditingTask(null);
    } catch (error) {
      setEditTaskError(
        error instanceof Error
          ? error.message
          : "Aufgabe konnte nicht gespeichert werden.",
      );
    } finally {
      setEditTaskSaving(false);
    }
  }

  async function deleteTask(task: Task) {
    if (
      !window.confirm(
        `Möchtest du „${task.title}“ wirklich löschen?`,
      )
    ) {
      return;
    }

    try {
      await dashboardAction({ action: "delete-task", id: task.id });
      setTasks((current) => current.filter((item) => item.id !== task.id));
      if (editingTask?.id === task.id) setEditingTask(null);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Aufgabe konnte nicht gelöscht werden.",
      );
    }
  }

  async function incrementRoutine(id: string) {
    try {
      const result = await dashboardAction<{ completed: number }>({
        action: "increment-routine",
        id,
      });
      setRoutines((current) =>
        current.map((routine) =>
          routine.id === id
            ? { ...routine, completed: result.completed }
            : routine,
        ),
      );
    } catch {
      // Die bestehende Anzeige bleibt erhalten.
    }
  }

  async function saveCapture() {
    const text = captureText.trim();
    if (!text) return;

    setCaptureSaving(true);
    setCaptureError("");
    try {
      const result = await dashboardAction<{ item: InboxItem }>({
        action: "capture",
        text,
      });
      setInboxItems((current) => [result.item, ...current]);
      setCaptureText("");
      setCaptureOpen(false);
      setPage("inbox");
    } catch (error) {
      setCaptureError(
        error instanceof Error ? error.message : "Eintrag konnte nicht gespeichert werden.",
      );
    } finally {
      setCaptureSaving(false);
    }
  }

  async function updateInboxItem(id: string, text: string) {
    const result = await dashboardAction<{
      item: { id: string; text: string };
    }>({ action: "update-inbox", id, text });
    setInboxItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, text: result.item.text } : item,
      ),
    );
  }

  async function deleteInboxItem(id: string) {
    await dashboardAction({ action: "delete-inbox", id });
    setInboxItems((current) => current.filter((item) => item.id !== id));
  }

  async function organizeInboxItem(
    id: string,
    destination: "todo" | "routine",
  ) {
    const result = await dashboardAction<{
      task?: Task;
      routine?: Routine;
      area?: Area;
    }>({ action: "organize-inbox", id, destination });

    setInboxItems((current) => current.filter((item) => item.id !== id));

    if (result.task) {
      setTasks((current) => [...current, result.task as Task]);
      if (
        result.area &&
        !areas.some((area) => area.id === result.area?.id)
      ) {
        setAreas((current) => [...current, result.area as Area]);
      }
    }

    if (result.routine) {
      setRoutines((current) => [...current, result.routine as Routine]);
    }
  }

  async function addArea() {
    const name = window.prompt("Wie heißt der neue Bereich?");
    if (!name?.trim()) return;
    try {
      const result = await dashboardAction<{ area: { id: string; name: string } }>({
        action: "create-area",
        name,
      });
      setAreas((current) => [...current, result.area]);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Bereich konnte nicht gespeichert werden.");
    }
  }

  async function addTask(
    areaId: string,
    projectId?: string,
    dueToday = false,
  ) {
    const title = window.prompt("Wie heißt die Aufgabe?");
    if (!title?.trim()) return;
    try {
      const result = await dashboardAction<{ task: Task }>({
        action: "create-task",
        title,
        areaId,
        projectId,
        dueToday,
      });
      setTasks((current) => [
        ...current,
        { ...result.task, projectId },
      ]);
      if (!areas.some((area) => area.id === result.task.areaId)) {
        setAreas((current) => [
          ...current,
          { id: result.task.areaId, name: "Alltag" },
        ]);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Aufgabe konnte nicht gespeichert werden.");
    }
  }

  async function addRoutine() {
    const title = window.prompt("Wie heißt die Routine?");
    if (!title?.trim()) return;
    try {
      const result = await dashboardAction<{ routine: Routine }>({
        action: "create-routine",
        title,
        target: 3,
      });
      setRoutines((current) => [...current, result.routine]);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Routine konnte nicht gespeichert werden.");
    }
  }

  async function addProject(areaId?: string) {
    if (!areaId) {
      window.alert(
        "Wissensprojekte werden in einem der nächsten Nook-Schritte freigeschaltet.",
      );
      return;
    }

    const title = window.prompt("Wie heißt das To-do-Projekt?");
    if (!title?.trim()) return;
    try {
      const result = await dashboardAction<{ project: Project }>({
        action: "create-task-project",
        areaId,
        title,
      });
      setProjects((current) => [...current, result.project]);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Projekt konnte nicht gespeichert werden.",
      );
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const now = new Date();
  const greetingDate = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  const greeting = getGreeting(now.getHours());

  return (
    <div className="min-h-screen bg-nook-background text-nook-ink">
      <SmokeBackground />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-52 border-r border-black/5 bg-white/58 p-4 backdrop-blur-3xl lg:flex lg:flex-col">
        <div className="px-3 pb-7 pt-2 font-serif text-[32px] tracking-[-0.08em]">
          nook
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={[
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition",
                  active
                    ? "bg-nook-teal/10 text-nook-teal"
                    : "text-nook-ink/75 hover:bg-black/[0.035]",
                ].join(" ")}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.id === "inbox" && (
                  <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-xs">
                    {inboxItems.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <button className="mt-auto flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-nook-ink/70 hover:bg-black/[0.035]">
          <Settings size={19} strokeWidth={1.8} />
          Einstellungen
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-nook-ink/70 hover:bg-black/[0.035]"
        >
          <LogOut size={19} strokeWidth={1.8} />
          Abmelden
        </button>
        <button className="mt-3 flex items-center gap-3 rounded-2xl border border-black/5 bg-white/55 p-2 text-left text-sm">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-200 via-sky-500 to-slate-800 text-xs font-semibold text-white">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{displayName}</span>
            <span className="block text-[11px] text-nook-muted">Mein nook</span>
          </span>
          <ChevronDown size={14} className="text-nook-muted" />
        </button>
      </aside>

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/65 px-4 py-3 backdrop-blur-2xl lg:hidden">
        <div className="font-serif text-3xl tracking-[-0.08em]">nook</div>
        <button
          onClick={() => setMenuOpen((current) => !current)}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/80 shadow-sm"
          aria-label="Navigation öffnen"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-x-4 top-16 z-40 rounded-[24px] bg-white/95 p-3 shadow-nook backdrop-blur-xl lg:hidden">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm hover:bg-black/[0.035]"
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
          <div className="my-2 border-t border-black/5" />
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-nook-ink/70 hover:bg-black/[0.035]"
          >
            <LogOut size={18} />
            Abmelden
          </button>
        </div>
      )}

      <div className="fixed right-7 top-6 z-20 hidden items-center gap-2 lg:flex">
        {[Search, Bell, Sun].map((Icon, index) => (
          <button
            key={index}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/60 text-nook-ink/70 shadow-sm backdrop-blur-xl transition hover:bg-white"
          >
            <Icon size={17} strokeWidth={1.8} />
          </button>
        ))}
      </div>

      <main className="relative z-10 mx-auto max-w-[1180px] px-4 pb-28 pt-24 lg:ml-52 lg:px-8 lg:pt-9 xl:px-10">
        {page === "today" && (
          <>
            <section className="mb-7 min-h-36 pt-8 lg:pt-5">
              <h1 className="text-4xl font-semibold tracking-[-0.045em] lg:text-[42px]">
                {greeting}, {displayName}.
              </h1>
              <p className="mt-2 text-sm text-nook-muted">{greetingDate}</p>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <NookCard
                title="Heute"
                subtitle={`${todayTasks.filter((task) => !task.done).length} Aufgaben offen`}
                icon={<ClipboardCheck size={19} />}
                action={
                  <button
                    onClick={() =>
                      addTask(areas[0]?.id ?? "", undefined, true)
                    }
                    className="text-sm text-nook-teal"
                  >
                    + Aufgabe
                  </button>
                }
              >
                <div className="divide-y divide-black/5">
                  {todayTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      area={areas.find((area) => area.id === task.areaId)}
                      project={projects.find(
                        (project) => project.id === task.projectId,
                      )}
                      onToggle={() => toggleTask(task.id)}
                      onEdit={() => openTaskEditor(task)}
                      onDelete={() => deleteTask(task)}
                    />
                  ))}
                  {todayTasks.length === 0 && (
                    <p className="py-7 text-sm leading-6 text-nook-muted">
                      Heute ist noch ganz frei. Füge nur hinzu, was wirklich
                      heute zählt.
                    </p>
                  )}
                </div>
              </NookCard>

              <NookCard
                title="Routinen"
                subtitle="Diese Woche"
                icon={<Repeat2 size={19} />}
                action={
                  <button
                    onClick={addRoutine}
                    className="text-sm text-nook-teal"
                  >
                    + Routine
                  </button>
                }
              >
                <div className="space-y-1">
                  {routines.map((routine) => (
                    <RoutineRow
                      key={routine.id}
                      routine={routine}
                      onIncrement={() => incrementRoutine(routine.id)}
                    />
                  ))}
                  {routines.length === 0 && (
                    <button
                      onClick={addRoutine}
                      className="w-full py-7 text-left text-sm leading-6 text-nook-muted"
                    >
                      Noch keine Routinen. Beginne mit etwas, das dir guttut.
                    </button>
                  )}
                </div>
              </NookCard>

              <NookCard
                title="Tracking"
                subtitle="Heute erfassen"
                icon={<HeartPulse size={19} />}
              >
                <p className="py-7 text-sm leading-6 text-nook-muted">
                  Hier entsteht dein persönliches Tracking – ruhig, privat und
                  ohne Bewertung.
                </p>
              </NookCard>

              <NookCard
                title="Inbox"
                subtitle={`${inboxItems.length} Einträge`}
                icon={<Inbox size={19} />}
                action={
                  <button
                    onClick={() => setPage("inbox")}
                    className="text-sm text-nook-teal"
                  >
                    Öffnen
                  </button>
                }
              >
                <div className="divide-y divide-black/5">
                  {inboxItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="py-3 text-sm">
                      {item.text}
                    </div>
                  ))}
                  {inboxItems.length === 0 && (
                    <p className="py-7 text-sm leading-6 text-nook-muted">
                      Noch nichts gesammelt. Gedanken dürfen hier erst einmal
                      einfach ankommen.
                    </p>
                  )}
                </div>
              </NookCard>
            </div>
          </>
        )}

        {page === "inbox" && (
          <PageHeading
            title="Inbox"
            subtitle="Erfassen zuerst, sortieren später."
            buttonLabel="Neu erfassen"
            onButton={() => setCaptureOpen(true)}
          >
            <div className="grid items-start gap-5 lg:grid-cols-[0.72fr_1.28fr]">
              <NookCard title="Alles darf erst einmal ankommen">
                <p className="leading-7 text-nook-muted">
                  Ein Gedanke muss noch keine Aufgabe sein. Sammle ihn hier und
                  entscheide später in Ruhe, wo er hingehört.
                </p>
                <button
                  onClick={() => setCaptureOpen(true)}
                  className="mt-6 flex items-center gap-2 rounded-2xl bg-nook-teal/10 px-4 py-2.5 text-sm text-nook-teal transition hover:bg-nook-teal/15"
                >
                  <Plus size={16} />
                  Etwas festhalten
                </button>
              </NookCard>

              <section className="rounded-[24px] border border-white/80 bg-white/72 p-4 shadow-nook backdrop-blur-2xl sm:p-5">
                <div className="mb-4 flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-lg font-semibold tracking-[-0.025em]">
                      Noch nicht einsortiert
                    </h2>
                    <p className="mt-1 text-xs text-nook-muted">
                      {inboxItems.length === 1
                        ? "1 Gedanke"
                        : `${inboxItems.length} Gedanken`}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {inboxItems.map((item) => (
                    <InboxItemRow
                      key={item.id}
                      item={item}
                      onUpdate={updateInboxItem}
                      onDelete={deleteInboxItem}
                      onOrganize={organizeInboxItem}
                    />
                  ))}

                  {inboxItems.length === 0 && (
                    <div className="rounded-[20px] border border-dashed border-black/10 px-5 py-12 text-center">
                      <Inbox
                        size={24}
                        strokeWidth={1.5}
                        className="mx-auto text-nook-teal/70"
                      />
                      <p className="mt-4 font-medium">Deine Inbox ist ruhig.</p>
                      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-nook-muted">
                        Neue Gedanken erscheinen hier und warten, bis du Zeit
                        für sie hast.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </PageHeading>
        )}

        {page === "todos" && (
          <PageHeading
            title="To-dos"
            subtitle="Direkte Aufgaben oder Aufgaben innerhalb eines Projekts."
            buttonLabel="Bereich"
            onButton={addArea}
          >
            <div className="grid gap-5">
              {areas.length === 0 && (
                <NookCard title="Dein erster Bereich">
                  <div className="max-w-xl py-6">
                    <p className="leading-7 text-nook-muted">
                      Bereiche geben Aufgaben einen ruhigen Platz – zum Beispiel
                      Alltag, Arbeit oder Zuhause.
                    </p>
                    <button
                      onClick={addArea}
                      className="mt-5 rounded-2xl bg-nook-teal/10 px-4 py-2.5 text-sm text-nook-teal"
                    >
                      + Bereich anlegen
                    </button>
                  </div>
                </NookCard>
              )}

              {areas.map((area) => {
                const directTasks = tasks.filter(
                  (task) => task.areaId === area.id && !task.projectId,
                );
                const areaProjects = projects.filter(
                  (project) => project.areaId === area.id,
                );

                return (
                  <NookCard
                    key={area.id}
                    title={area.name}
                    subtitle={`${directTasks.filter((task) => !task.done).length} direkte Aufgaben`}
                    action={
                      <div className="flex flex-wrap justify-end gap-3">
                        <button
                          onClick={() => addTask(area.id)}
                          className="text-sm text-nook-teal"
                        >
                          + Aufgabe
                        </button>
                        <button
                          onClick={() => addProject(area.id)}
                          className="text-sm text-nook-violet"
                        >
                          + Projekt
                        </button>
                      </div>
                    }
                  >
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-nook-muted">
                        Direkte To-dos
                      </p>
                      <div className="divide-y divide-black/5">
                        {directTasks.map((task) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            area={area}
                            onToggle={() => toggleTask(task.id)}
                            onEdit={() => openTaskEditor(task)}
                            onDelete={() => deleteTask(task)}
                          />
                        ))}
                        {directTasks.length === 0 && (
                          <p className="py-4 text-sm text-nook-muted">
                            Noch keine direkten Aufgaben.
                          </p>
                        )}
                      </div>
                    </div>

                    {areaProjects.map((project) => (
                      <div
                        key={project.id}
                        className="mt-5 border-t border-black/5 pt-5"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{project.title}</h3>
                            <p className="mt-1 text-xs text-nook-muted">
                              {
                                tasks.filter(
                                  (task) => task.projectId === project.id,
                                ).length
                              }{" "}
                              Aufgaben
                            </p>
                          </div>
                          <button
                            onClick={() => addTask(area.id, project.id)}
                            className="text-sm text-nook-teal"
                          >
                            + Aufgabe
                          </button>
                        </div>
                        <div className="divide-y divide-black/5">
                          {tasks
                            .filter((task) => task.projectId === project.id)
                            .map((task) => (
                              <TaskRow
                                key={task.id}
                                task={task}
                                area={area}
                                project={project}
                                onToggle={() => toggleTask(task.id)}
                                onEdit={() => openTaskEditor(task)}
                                onDelete={() => deleteTask(task)}
                              />
                            ))}
                          {tasks.filter(
                            (task) => task.projectId === project.id,
                          ).length === 0 && (
                            <p className="py-4 text-sm text-nook-muted">
                              Dieses Projekt ist noch ganz offen.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </NookCard>
                );
              })}
            </div>
          </PageHeading>
        )}

        {page === "routines" && (
          <PageHeading
            title="Routinen"
            subtitle="Fortschritt ohne Streak-Druck."
            buttonLabel="Routine"
            onButton={addRoutine}
          >
            <div className="grid gap-5 md:grid-cols-2">
              {routines.map((routine) => (
                <NookCard
                  key={routine.id}
                  title={routine.title}
                  subtitle={`${routine.completed} von ${routine.target} diese Woche`}
                  action={
                    <button
                      onClick={() => incrementRoutine(routine.id)}
                      className="text-sm text-nook-teal"
                    >
                      + Einheit
                    </button>
                  }
                >
                  <RoutineRow
                    routine={routine}
                    onIncrement={() => incrementRoutine(routine.id)}
                  />
                </NookCard>
              ))}
            </div>
          </PageHeading>
        )}

        {page === "tracking" && (
          <PageHeading
            title="Tracking"
            subtitle="Zyklus, Migräne und Tagesform."
            buttonLabel="Eintrag"
            onButton={() =>
              window.alert(
                "Persönliches Tracking wird in einem eigenen, sorgfältigen Schritt umgesetzt.",
              )
            }
          >
            <NookCard title="Dein Tracking entsteht behutsam">
              <div className="max-w-xl py-6">
                <p className="leading-7 text-nook-muted">
                  Zyklus und Kopfschmerzen sind sensible Daten. Deshalb bauen
                  wir diesen Bereich als eigenen nächsten Schritt – mit klaren
                  Schätzungen, privaten Notizen und ohne Wertung.
                </p>
              </div>
            </NookCard>
          </PageHeading>
        )}

        {page === "projects" && (
          <PageHeading
            title="Projekte"
            subtitle="Notizen, Wissen und Materialien."
            buttonLabel="Projekt"
            onButton={() => addProject()}
          >
            <NookCard title="Platz für Wissen, das bleiben darf">
              <p className="max-w-xl py-6 leading-7 text-nook-muted">
                Wissensprojekte mit Notizen, Checklisten, Dateien, Bildern und
                Links folgen als eigener Nook-Baustein.
              </p>
            </NookCard>
          </PageHeading>
        )}
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[22px] border border-white/80 bg-white/82 p-2 shadow-nook backdrop-blur-2xl lg:hidden">
        {navigation
          .filter((item) => item.id !== "inbox")
          .map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={[
                  "flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px]",
                  active ? "bg-nook-teal/10 text-nook-teal" : "text-nook-muted",
                ].join(" ")}
              >
                <Icon size={18} strokeWidth={1.8} />
                {item.label}
              </button>
            );
          })}
      </nav>

      <button
        onClick={() => setCaptureOpen(true)}
        className="fixed bottom-24 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-nook-teal text-white shadow-[0_16px_36px_rgba(46,151,139,0.35)] lg:bottom-8 lg:right-8"
        aria-label="Schnell erfassen"
      >
        <Plus size={27} />
      </button>

      {captureOpen && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/25 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setCaptureOpen(false);
          }}
        >
          <div className="w-full max-w-xl rounded-[28px] bg-nook-card p-6 shadow-nook">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                  Schnell erfassen
                </h2>
                <p className="mt-1 text-sm text-nook-muted">
                  Was möchtest du festhalten?
                </p>
              </div>
              <button
                onClick={() => setCaptureOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-black/5"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              autoFocus
              value={captureText}
              onChange={(event) => setCaptureText(event.target.value)}
              className="min-h-40 w-full resize-none rounded-[20px] border border-black/10 bg-white p-4 outline-none transition focus:border-nook-teal focus:ring-4 focus:ring-nook-teal/10"
              placeholder="Gedanke, Aufgabe oder Idee …"
            />

            {captureError && (
              <p className="mt-3 text-sm text-rose-700">{captureError}</p>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setCaptureOpen(false)}
                className="rounded-2xl bg-black/5 px-4 py-2.5 text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={saveCapture}
                disabled={captureSaving}
                className="rounded-2xl bg-nook-teal px-4 py-2.5 text-sm text-white disabled:cursor-wait disabled:opacity-60"
              >
                {captureSaving ? "Speichert …" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/25 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setEditingTask(null);
          }}
        >
          <div className="w-full max-w-lg rounded-[28px] bg-nook-card p-6 shadow-nook">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                  Aufgabe bearbeiten
                </h2>
                <p className="mt-1 text-sm text-nook-muted">
                  Passe an, was sich verändert hat.
                </p>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="grid h-9 w-9 place-items-center rounded-full bg-black/5"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </div>

            <label className="block text-sm font-medium">
              Aufgabe
              <input
                autoFocus
                value={editTaskTitle}
                onChange={(event) => setEditTaskTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveTaskEdit();
                }}
                className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-nook-teal focus:ring-4 focus:ring-nook-teal/10"
              />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Bereich
                <select
                  value={editTaskAreaId}
                  onChange={(event) => {
                    setEditTaskAreaId(event.target.value);
                    setEditTaskProjectId("");
                  }}
                  className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal"
                >
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Projekt
                <select
                  value={editTaskProjectId}
                  onChange={(event) => setEditTaskProjectId(event.target.value)}
                  className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal"
                >
                  <option value="">Ohne Projekt</option>
                  {projects
                    .filter((project) => project.areaId === editTaskAreaId)
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-[18px] bg-white/65 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={editTaskDueToday}
                onChange={(event) => setEditTaskDueToday(event.target.checked)}
                className="h-4 w-4 accent-nook-teal"
              />
              Auf „Heute“ anzeigen
            </label>

            {editTaskError && (
              <p className="mt-3 text-sm text-rose-700">{editTaskError}</p>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => deleteTask(editingTask)}
                className="rounded-2xl px-3 py-2.5 text-sm text-rose-700 transition hover:bg-rose-50"
              >
                Aufgabe löschen
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingTask(null)}
                  className="rounded-2xl bg-black/5 px-4 py-2.5 text-sm"
                >
                  Abbrechen
                </button>
                <button
                  onClick={saveTaskEdit}
                  disabled={editTaskSaving}
                  className="rounded-2xl bg-nook-teal px-4 py-2.5 text-sm text-white disabled:cursor-wait disabled:opacity-60"
                >
                  {editTaskSaving ? "Speichert …" : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageHeading({
  title,
  subtitle,
  buttonLabel,
  onButton,
  children,
}: {
  title: string;
  subtitle: string;
  buttonLabel: string;
  onButton: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="mb-8 flex items-start justify-between gap-4 pt-5 lg:pt-0">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.045em]">{title}</h1>
          <p className="mt-2 text-nook-muted">{subtitle}</p>
        </div>
        <button
          onClick={onButton}
          className="flex items-center gap-2 rounded-2xl bg-nook-teal px-4 py-2.5 text-sm text-white shadow-sm"
        >
          <Plus size={17} />
          {buttonLabel}
        </button>
      </section>
      {children}
    </>
  );
}
