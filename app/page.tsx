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
import type { Area, InboxItem, Project, Routine, Task, TrackingEntry } from "@/lib/types";

type PageId = "today" | "inbox" | "todos" | "routines" | "tracking" | "projects";

const navigation = [
  { id: "today" as PageId, label: "Heute", icon: Home },
  { id: "inbox" as PageId, label: "Inbox", icon: Inbox },
  { id: "todos" as PageId, label: "To-dos", icon: CheckCircle2 },
  { id: "routines" as PageId, label: "Routinen", icon: Repeat2 },
  { id: "tracking" as PageId, label: "Tracking", icon: HeartPulse },
  { id: "projects" as PageId, label: "Projekte", icon: FolderKanban },
];

const initialAreas: Area[] = [
  { id: "arbeit", name: "Arbeit" },
  { id: "privat", name: "Privat" },
  { id: "gesundheit", name: "Gesundheit" },
];

const initialProjects: Project[] = [
  {
    id: "website",
    title: "Website-Relaunch",
    areaId: "arbeit",
    note: "Texte, Feedback und offene Fragen für den Relaunch.",
  },
];

const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Präsentation fertigstellen",
    areaId: "arbeit",
    projectId: "website",
    dueToday: true,
    done: false,
  },
  {
    id: "task-2",
    title: "Einkauf erledigen",
    areaId: "privat",
    dueToday: true,
    done: false,
  },
  {
    id: "task-3",
    title: "Arzttermin vereinbaren",
    areaId: "gesundheit",
    dueToday: false,
    done: false,
  },
  {
    id: "task-4",
    title: "Spesenabrechnung einreichen",
    areaId: "arbeit",
    dueToday: false,
    done: false,
  },
];

const initialRoutines: Routine[] = [
  { id: "routine-1", title: "Sport", target: 3, completed: 2 },
  { id: "routine-2", title: "Lesen", target: 7, completed: 4 },
  { id: "routine-3", title: "Pflanzen", target: 1, completed: 0 },
];

const initialInbox: InboxItem[] = [
  { id: "inbox-1", text: "Idee für Sommerferien" },
  { id: "inbox-2", text: "Rezept für Curry suchen" },
];

const initialTracking: TrackingEntry[] = [
  { id: "track-1", type: "Zyklus", note: "Zyklustag 18" },
  { id: "track-2", type: "Tagesform", note: "Ruhiger Tag" },
];

function getGreeting(hour: number) {
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

export default function HomePage() {
  const [page, setPage] = useState<PageId>("today");
  const [menuOpen, setMenuOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureText, setCaptureText] = useState("");

  const [areas, setAreas] = useState(initialAreas);
  const [projects, setProjects] = useState(initialProjects);
  const [tasks, setTasks] = useState(initialTasks);
  const [routines, setRoutines] = useState(initialRoutines);
  const [inboxItems, setInboxItems] = useState(initialInbox);
  const [trackingEntries, setTrackingEntries] = useState(initialTracking);

  const todayTasks = useMemo(
    () => tasks.filter((task) => task.dueToday),
    [tasks],
  );

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    );
  }

  function incrementRoutine(id: string) {
    setRoutines((current) =>
      current.map((routine) =>
        routine.id === id
          ? {
              ...routine,
              completed: Math.min(routine.target, routine.completed + 1),
            }
          : routine,
      ),
    );
  }

  function saveCapture() {
    const text = captureText.trim();
    if (!text) return;

    setInboxItems((current) => [
      { id: crypto.randomUUID(), text },
      ...current,
    ]);
    setCaptureText("");
    setCaptureOpen(false);
    setPage("inbox");
  }

  function addArea() {
    const name = window.prompt("Wie heißt der neue Bereich?");
    if (!name?.trim()) return;
    setAreas((current) => [
      ...current,
      { id: crypto.randomUUID(), name: name.trim() },
    ]);
  }

  function addTask(areaId: string, projectId?: string) {
    const title = window.prompt("Wie heißt die Aufgabe?");
    if (!title?.trim()) return;
    setTasks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        areaId,
        projectId,
        dueToday: false,
        done: false,
      },
    ]);
  }

  function addProject(areaId?: string) {
    const title = window.prompt("Wie heißt das Projekt?");
    if (!title?.trim()) return;
    setProjects((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        areaId,
        note: "Noch keine Notiz.",
      },
    ]);
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
        <button className="mt-3 flex items-center gap-3 rounded-2xl border border-black/5 bg-white/55 p-2 text-left text-sm">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-200 via-sky-500 to-slate-800 text-xs font-semibold text-white">
            A
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">Ambar</span>
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
                {greeting}, Ambar.
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
                    onClick={() => addTask(areas[0]?.id ?? "")}
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
                    />
                  ))}
                </div>
              </NookCard>

              <NookCard
                title="Routinen"
                subtitle="Diese Woche"
                icon={<Repeat2 size={19} />}
              >
                <div className="space-y-1">
                  {routines.map((routine) => (
                    <RoutineRow
                      key={routine.id}
                      routine={routine}
                      onIncrement={() => incrementRoutine(routine.id)}
                    />
                  ))}
                </div>
              </NookCard>

              <NookCard
                title="Tracking"
                subtitle="Heute erfassen"
                icon={<HeartPulse size={19} />}
              >
                <div className="divide-y divide-black/5">
                  <div className="py-3">
                    <p className="font-medium">Zyklus · Tag 18</p>
                    <p className="mt-1 text-sm text-nook-muted">
                      Nächste Menstruation voraussichtlich in 10–13 Tagen
                    </p>
                  </div>
                  <div className="py-3">
                    <p className="font-medium">Kopfschmerzen</p>
                    <p className="mt-1 text-sm text-nook-muted">
                      Heute noch nicht erfasst
                    </p>
                  </div>
                </div>
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
            <NookCard title="Noch nicht einsortiert">
              <div className="divide-y divide-black/5">
                {inboxItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <span>{item.text}</span>
                    <button
                      onClick={() =>
                        setInboxItems((current) =>
                          current.filter((entry) => entry.id !== item.id),
                        )
                      }
                      className="text-sm text-nook-muted hover:text-nook-ink"
                    >
                      Löschen
                    </button>
                  </div>
                ))}
              </div>
            </NookCard>
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
                      <div className="flex gap-3">
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
                          />
                        ))}
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
                            <p className="mt-1 text-sm text-nook-muted">
                              {project.note}
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
                              />
                            ))}
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
            onButton={() => {
              const title = window.prompt("Wie heißt die Routine?");
              if (!title?.trim()) return;
              setRoutines((current) => [
                ...current,
                {
                  id: crypto.randomUUID(),
                  title: title.trim(),
                  target: 3,
                  completed: 0,
                },
              ]);
            }}
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
            onButton={() => {
              const note = window.prompt("Was möchtest du erfassen?");
              if (!note?.trim()) return;
              setTrackingEntries((current) => [
                {
                  id: crypto.randomUUID(),
                  type: "Tagesform",
                  note: note.trim(),
                },
                ...current,
              ]);
            }}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <NookCard title="Zyklus" subtitle="Schätzungen klar gekennzeichnet">
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium">Aktueller Zyklus</p>
                    <p className="mt-1 text-nook-muted">Tag 18</p>
                  </div>
                  <div>
                    <p className="font-medium">
                      Voraussichtliche nächste Menstruation
                    </p>
                    <p className="mt-1 text-nook-muted">
                      in 10–13 Tagen · Schätzung
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Geschätzter Eisprung</p>
                    <p className="mt-1 text-nook-muted">
                      ungefähr vor 4 Tagen · Schätzung
                    </p>
                  </div>
                </div>
              </NookCard>

              <NookCard title="Letzte Einträge">
                <div className="divide-y divide-black/5">
                  {trackingEntries.map((entry) => (
                    <div key={entry.id} className="py-3">
                      <p className="font-medium">{entry.type}</p>
                      <p className="mt-1 text-sm text-nook-muted">
                        {entry.note}
                      </p>
                    </div>
                  ))}
                </div>
              </NookCard>
            </div>
          </PageHeading>
        )}

        {page === "projects" && (
          <PageHeading
            title="Projekte"
            subtitle="Notizen, Wissen und Materialien."
            buttonLabel="Projekt"
            onButton={() => addProject()}
          >
            <div className="grid gap-5 md:grid-cols-2">
              {projects
                .filter((project) => !project.areaId)
                .map((project) => (
                  <NookCard
                    key={project.id}
                    title={project.title}
                    subtitle="Notizprojekt"
                  >
                    <p className="leading-7 text-nook-muted">{project.note}</p>
                  </NookCard>
                ))}

              <NookCard title="Ernährungsplan" subtitle="Notizprojekt">
                <p className="leading-7 text-nook-muted">
                  Rezepte, Wochenplanung und Einkaufsideen.
                </p>
              </NookCard>
              <NookCard
                title="Sicherheitskonzept Hausfest"
                subtitle="Notizprojekt"
              >
                <p className="leading-7 text-nook-muted">
                  Risiken, Zuständigkeiten und Notfallkontakte.
                </p>
              </NookCard>
            </div>
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

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setCaptureOpen(false)}
                className="rounded-2xl bg-black/5 px-4 py-2.5 text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={saveCapture}
                className="rounded-2xl bg-nook-teal px-4 py-2.5 text-sm text-white"
              >
                Speichern
              </button>
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
