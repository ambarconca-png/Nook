"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FolderKanban,
  FileText,
  HeartPulse,
  Inbox,
  LogOut,
  Menu,
  Moon,
  NotebookPen,
  Pencil,
  Plus,
  Repeat2,
  Search,
  Settings,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { SmokeBackground } from "@/components/smoke-background";
import { NookCard } from "@/components/nook-card";
import { TaskRow } from "@/components/task-row";
import { RoutineRow } from "@/components/routine-row";
import { InboxItemRow } from "@/components/inbox-item-row";
import { KnowledgeProjectBlockCard } from "@/components/knowledge-project-block";
import { TrackingWorkspace } from "@/components/tracking-workspace";
import type { DashboardData } from "@/lib/dashboard";
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

type PageId = "today" | "inbox" | "todos" | "routines" | "tracking" | "projects";

const navigation = [
  { id: "today" as PageId, label: "Heute", icon: CalendarDays },
  { id: "todos" as PageId, label: "To-dos", icon: CheckCircle2 },
  { id: "routines" as PageId, label: "Routinen", icon: Repeat2 },
  { id: "tracking" as PageId, label: "Tracking", icon: HeartPulse },
  { id: "projects" as PageId, label: "Projekte", icon: NotebookPen },
  { id: "inbox" as PageId, label: "Inbox", icon: Inbox },
];

const knowledgeProjectStatusLabels: Record<
  KnowledgeProject["status"],
  string
> = {
  idea: "Idee",
  active: "In Arbeit",
  paused: "Pausiert",
  complete: "Abgeschlossen",
};

const routinePeriodLabels = {
  day: "Tag",
  week: "Woche",
  month: "Monat",
};

const weekdayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

type RoutineDraft = {
  title: string;
  category: string;
  rhythm: Routine["rhythm"];
  period: Routine["period"];
  target: number;
  amount: string;
  unit: string;
  preferredWeekdays: number[];
  reminderTime: string;
  startDate: string;
  endDate: string;
  color: Routine["color"];
  symbol: Routine["symbol"];
};

function emptyRoutineDraft(): RoutineDraft {
  return {
    title: "",
    category: "Alltag",
    rhythm: "flexible",
    period: "week",
    target: 3,
    amount: "",
    unit: "Minuten",
    preferredWeekdays: [],
    reminderTime: "",
    startDate: new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Zurich",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()),
    endDate: "",
    color: "teal",
    symbol: "repeat",
  };
}

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
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureText, setCaptureText] = useState("");
  const [captureError, setCaptureError] = useState("");
  const [captureSaving, setCaptureSaving] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskAreaId, setEditTaskAreaId] = useState("");
  const [editTaskProjectId, setEditTaskProjectId] = useState("");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [editTaskPriority, setEditTaskPriority] =
    useState<Task["priority"]>("none");
  const [editTaskNotes, setEditTaskNotes] = useState("");
  const [editTaskRecurrence, setEditTaskRecurrence] =
    useState<Task["recurrence"]>("none");
  const [editTaskError, setEditTaskError] = useState("");
  const [editTaskSaving, setEditTaskSaving] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectTitle, setEditProjectTitle] = useState("");
  const [editProjectAreaId, setEditProjectAreaId] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editProjectEndDate, setEditProjectEndDate] = useState("");
  const [editProjectNotes, setEditProjectNotes] = useState("");
  const [editProjectError, setEditProjectError] = useState("");
  const [editProjectSaving, setEditProjectSaving] = useState(false);

  const [areas, setAreas] = useState(initialData.areas);
  const [projects, setProjects] = useState(initialData.projects);
  const [knowledgeProjects, setKnowledgeProjects] = useState(
    initialData.knowledgeProjects,
  );
  const [knowledgeProjectPages, setKnowledgeProjectPages] = useState(
    initialData.knowledgeProjectPages,
  );
  const [knowledgeProjectBlocks, setKnowledgeProjectBlocks] = useState(
    initialData.knowledgeProjectBlocks,
  );
  const [activeKnowledgeProjectId, setActiveKnowledgeProjectId] = useState("");
  const [activeKnowledgePageId, setActiveKnowledgePageId] = useState("");
  const [knowledgeProjectEditorOpen, setKnowledgeProjectEditorOpen] =
    useState(false);
  const [editingKnowledgeProjectId, setEditingKnowledgeProjectId] =
    useState("");
  const [knowledgeProjectTitle, setKnowledgeProjectTitle] = useState("");
  const [knowledgeProjectDescription, setKnowledgeProjectDescription] =
    useState("");
  const [knowledgeProjectStatus, setKnowledgeProjectStatus] =
    useState<KnowledgeProject["status"]>("idea");
  const [knowledgeProjectSaving, setKnowledgeProjectSaving] = useState(false);
  const [knowledgeProjectError, setKnowledgeProjectError] = useState("");
  const [knowledgePageTitle, setKnowledgePageTitle] = useState("");
  const [knowledgePageContent, setKnowledgePageContent] = useState("");
  const [knowledgePageSaving, setKnowledgePageSaving] = useState(false);
  const [tasks, setTasks] = useState(initialData.tasks);
  const [routines, setRoutines] = useState(initialData.routines);
  const [routineEditorOpen, setRoutineEditorOpen] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState("");
  const [routineDraft, setRoutineDraft] =
    useState<RoutineDraft>(emptyRoutineDraft);
  const [routineSaving, setRoutineSaving] = useState(false);
  const [routineError, setRoutineError] = useState("");
  const [inboxItems, setInboxItems] = useState(initialData.inboxItems);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("nook-theme");
    const useDark =
      storedTheme === "dark" ||
      (!storedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(useDark);
    document.documentElement.classList.toggle("dark", useDark);
  }, []);

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("nook-theme", next ? "dark" : "light");
  }

  const todayTasks = useMemo(
    () => tasks.filter((task) => task.dueToday),
    [tasks],
  );
  const activeKnowledgeProject = knowledgeProjects.find(
    (project) => project.id === activeKnowledgeProjectId,
  );
  const activeKnowledgePage = knowledgeProjectPages.find(
    (projectPage) => projectPage.id === activeKnowledgePageId,
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
    setEditTaskDueDate(task.dueDate ?? "");
    setEditTaskPriority(task.priority);
    setEditTaskNotes(task.notes);
    setEditTaskRecurrence(task.recurrence);
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
        dueDate: editTaskDueDate || undefined,
        priority: editTaskPriority,
        notes: editTaskNotes,
        recurrence: editTaskRecurrence,
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

  async function toggleRoutine(id: string) {
    try {
      const result = await dashboardAction<{
        completed: number;
        completedToday: boolean;
        date: string;
      }>({
        action: "toggle-routine-completion",
        id,
      });
      setRoutines((current) =>
        current.map((routine) =>
          routine.id === id
            ? {
                ...routine,
                completed: result.completed,
                completionDates: result.completedToday
                  ? [...routine.completionDates, result.date]
                  : routine.completionDates.filter(
                      (date) => date !== result.date,
                    ),
              }
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
      openTaskEditor({ ...result.task, projectId });
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

  function openRoutineEditor(routine?: Routine) {
    setEditingRoutineId(routine?.id ?? "");
    setRoutineDraft(
      routine
        ? {
            title: routine.title,
            category: routine.category,
            rhythm: routine.rhythm,
            period: routine.period,
            target: routine.target,
            amount: routine.amount?.toString() ?? "",
            unit: routine.unit,
            preferredWeekdays: routine.preferredWeekdays,
            reminderTime: routine.reminderTime ?? "",
            startDate: routine.startDate ?? emptyRoutineDraft().startDate,
            endDate: routine.endDate ?? "",
            color: routine.color,
            symbol: routine.symbol,
          }
        : emptyRoutineDraft(),
    );
    setRoutineError("");
    setRoutineEditorOpen(true);
  }

  async function saveRoutine() {
    if (!routineDraft.title.trim()) {
      setRoutineError("Bitte gib der Routine einen Namen.");
      return;
    }
    setRoutineSaving(true);
    setRoutineError("");
    try {
      const result = await dashboardAction<{ routine: Routine }>({
        action: editingRoutineId ? "update-routine" : "create-routine",
        id: editingRoutineId || undefined,
        ...routineDraft,
        amount: routineDraft.amount ? Number(routineDraft.amount) : undefined,
      });
      if (editingRoutineId) {
        setRoutines((current) =>
          current.map((routine) =>
            routine.id === editingRoutineId
              ? {
                  ...routine,
                  ...routineDraft,
                  amount: routineDraft.amount
                    ? Number(routineDraft.amount)
                    : undefined,
                }
              : routine,
          ),
        );
      } else {
        setRoutines((current) => [...current, result.routine]);
      }
      setRoutineEditorOpen(false);
    } catch (error) {
      setRoutineError(
        error instanceof Error
          ? error.message
          : "Routine konnte nicht gespeichert werden.",
      );
    } finally {
      setRoutineSaving(false);
    }
  }

  async function deleteRoutine(routine: Routine) {
    if (!window.confirm(`Möchtest du „${routine.title}“ wirklich löschen?`)) {
      return;
    }
    try {
      await dashboardAction({ action: "delete-routine", id: routine.id });
      setRoutines((current) =>
        current.filter((item) => item.id !== routine.id),
      );
      setRoutineEditorOpen(false);
    } catch (error) {
      setRoutineError(
        error instanceof Error
          ? error.message
          : "Routine konnte nicht gelöscht werden.",
      );
    }
  }

  async function addProject(areaId?: string) {
    if (!areaId) {
      window.alert(
        "Wissensprojekte werden in einem der nächsten nook-Schritte freigeschaltet.",
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
      openProjectEditor(result.project);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Projekt konnte nicht gespeichert werden.",
      );
    }
  }

  function openProjectEditor(project: Project) {
    setEditingProject(project);
    setEditProjectTitle(project.title);
    setEditProjectAreaId(project.areaId ?? "");
    setEditProjectDescription(project.description);
    setEditProjectEndDate(project.endDate ?? "");
    setEditProjectNotes(project.notes);
    setEditProjectError("");
  }

  async function saveProjectEdit() {
    if (!editingProject || !editProjectTitle.trim()) {
      setEditProjectError("Bitte gib dem Projekt einen Titel.");
      return;
    }

    setEditProjectSaving(true);
    setEditProjectError("");
    try {
      const result = await dashboardAction<{ project: Project }>({
        action: "update-task-project",
        id: editingProject.id,
        title: editProjectTitle,
        areaId: editProjectAreaId,
        description: editProjectDescription,
        endDate: editProjectEndDate || undefined,
        notes: editProjectNotes,
      });
      setProjects((current) =>
        current.map((project) =>
          project.id === editingProject.id ? result.project : project,
        ),
      );
      setTasks((current) =>
        current.map((task) =>
          task.projectId === editingProject.id
            ? { ...task, areaId: result.project.areaId ?? task.areaId }
            : task,
        ),
      );
      setEditingProject(null);
    } catch (error) {
      setEditProjectError(
        error instanceof Error
          ? error.message
          : "Projekt konnte nicht gespeichert werden.",
      );
    } finally {
      setEditProjectSaving(false);
    }
  }

  function openKnowledgeProjectEditor(project?: KnowledgeProject) {
    setEditingKnowledgeProjectId(project?.id ?? "");
    setKnowledgeProjectTitle(project?.title ?? "");
    setKnowledgeProjectDescription(project?.description ?? "");
    setKnowledgeProjectStatus(project?.status ?? "idea");
    setKnowledgeProjectError("");
    setKnowledgeProjectEditorOpen(true);
  }

  function openKnowledgeProject(project: KnowledgeProject) {
    const firstPage = knowledgeProjectPages.find(
      (page) => page.projectId === project.id,
    );
    setActiveKnowledgeProjectId(project.id);
    setActiveKnowledgePageId(firstPage?.id ?? "");
    setKnowledgePageTitle(firstPage?.title ?? "");
    setKnowledgePageContent(firstPage?.content ?? "");
  }

  function selectKnowledgePage(page: KnowledgeProjectPage) {
    setActiveKnowledgePageId(page.id);
    setKnowledgePageTitle(page.title);
    setKnowledgePageContent(page.content);
  }

  async function saveKnowledgeProject() {
    if (!knowledgeProjectTitle.trim()) {
      setKnowledgeProjectError("Bitte gib dem Projekt einen Titel.");
      return;
    }

    setKnowledgeProjectSaving(true);
    setKnowledgeProjectError("");
    try {
      if (editingKnowledgeProjectId) {
        const result = await dashboardAction<{ project: KnowledgeProject }>({
          action: "update-knowledge-project",
          id: editingKnowledgeProjectId,
          title: knowledgeProjectTitle,
          description: knowledgeProjectDescription,
          status: knowledgeProjectStatus,
        });
        setKnowledgeProjects((current) =>
          current.map((project) =>
            project.id === result.project.id ? result.project : project,
          ),
        );
      } else {
        const result = await dashboardAction<{
          project: KnowledgeProject;
          page: KnowledgeProjectPage;
        }>({
          action: "create-knowledge-project",
          title: knowledgeProjectTitle,
          description: knowledgeProjectDescription,
          status: knowledgeProjectStatus,
        });
        setKnowledgeProjects((current) => [result.project, ...current]);
        setKnowledgeProjectPages((current) => [...current, result.page]);
        setActiveKnowledgeProjectId(result.project.id);
        selectKnowledgePage(result.page);
      }
      setKnowledgeProjectEditorOpen(false);
    } catch (error) {
      setKnowledgeProjectError(
        error instanceof Error
          ? error.message
          : "Projekt konnte nicht gespeichert werden.",
      );
    } finally {
      setKnowledgeProjectSaving(false);
    }
  }

  async function deleteKnowledgeProject(project: KnowledgeProject) {
    if (
      !window.confirm(
        `Möchtest du „${project.title}“ mit allen Notizseiten wirklich löschen?`,
      )
    ) {
      return;
    }
    try {
      await dashboardAction({
        action: "delete-knowledge-project",
        id: project.id,
      });
      setKnowledgeProjects((current) =>
        current.filter((item) => item.id !== project.id),
      );
      setKnowledgeProjectPages((current) =>
        current.filter((page) => page.projectId !== project.id),
      );
      const projectPageIds = new Set(
        knowledgeProjectPages
          .filter((page) => page.projectId === project.id)
          .map((page) => page.id),
      );
      setKnowledgeProjectBlocks((current) =>
        current.filter((block) => !projectPageIds.has(block.pageId)),
      );
      setActiveKnowledgeProjectId("");
      setActiveKnowledgePageId("");
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Projekt konnte nicht gelöscht werden.",
      );
    }
  }

  async function addKnowledgePage(projectId: string) {
    const title = window.prompt("Wie heißt die neue Notizseite?");
    if (!title?.trim()) return;
    try {
      const result = await dashboardAction<{ page: KnowledgeProjectPage }>({
        action: "create-knowledge-project-page",
        projectId,
        title,
      });
      setKnowledgeProjectPages((current) => [...current, result.page]);
      selectKnowledgePage(result.page);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Notizseite konnte nicht erstellt werden.",
      );
    }
  }

  async function saveKnowledgePage() {
    if (!activeKnowledgePage || !knowledgePageTitle.trim()) return;
    setKnowledgePageSaving(true);
    try {
      const result = await dashboardAction<{ page: KnowledgeProjectPage }>({
        action: "update-knowledge-project-page",
        id: activeKnowledgePage.id,
        title: knowledgePageTitle,
        content: knowledgePageContent,
      });
      setKnowledgeProjectPages((current) =>
        current.map((page) =>
          page.id === result.page.id ? result.page : page,
        ),
      );
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Notizseite konnte nicht gespeichert werden.",
      );
    } finally {
      setKnowledgePageSaving(false);
    }
  }

  async function deleteKnowledgePage(page: KnowledgeProjectPage) {
    if (!window.confirm(`Möchtest du die Seite „${page.title}“ löschen?`)) {
      return;
    }
    try {
      await dashboardAction({
        action: "delete-knowledge-project-page",
        id: page.id,
      });
      const remainingPages = knowledgeProjectPages.filter(
        (item) => item.id !== page.id && item.projectId === page.projectId,
      );
      setKnowledgeProjectPages((current) =>
        current.filter((item) => item.id !== page.id),
      );
      setKnowledgeProjectBlocks((current) =>
        current.filter((block) => block.pageId !== page.id),
      );
      if (activeKnowledgePageId === page.id) {
        const nextPage = remainingPages[0];
        setActiveKnowledgePageId(nextPage?.id ?? "");
        setKnowledgePageTitle(nextPage?.title ?? "");
        setKnowledgePageContent(nextPage?.content ?? "");
      }
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Notizseite konnte nicht gelöscht werden.",
      );
    }
  }

  async function addKnowledgeProjectBlock(
    pageId: string,
    type: KnowledgeProjectBlock["type"],
  ) {
    try {
      const result = await dashboardAction<{
        block: KnowledgeProjectBlock;
      }>({
        action: "create-knowledge-project-block",
        pageId,
        type,
      });
      setKnowledgeProjectBlocks((current) => [...current, result.block]);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Inhalt konnte nicht hinzugefügt werden.",
      );
    }
  }

  async function updateKnowledgeProjectBlock(
    block: KnowledgeProjectBlock,
  ) {
    const result = await dashboardAction<{
      block: KnowledgeProjectBlock;
    }>({
      action: "update-knowledge-project-block",
      id: block.id,
      title: block.title,
      content: block.content,
    });
    setKnowledgeProjectBlocks((current) =>
      current.map((item) =>
        item.id === result.block.id ? result.block : item,
      ),
    );
  }

  async function deleteKnowledgeProjectBlock(
    block: KnowledgeProjectBlock,
  ) {
    if (!window.confirm(`Möchtest du „${block.title}“ wirklich löschen?`)) {
      return;
    }
    await dashboardAction({
      action: "delete-knowledge-project-block",
      id: block.id,
    });
    setKnowledgeProjectBlocks((current) =>
      current.filter((item) => item.id !== block.id),
    );
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
    <div
      data-module={page}
      className="min-h-screen bg-nook-background text-nook-ink transition-colors duration-300"
    >
      <SmokeBackground />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-black/5 bg-nook-card/72 p-5 backdrop-blur-3xl lg:flex lg:flex-col">
        <div className="px-3 pb-8 pt-2 text-[30px] font-medium tracking-[-0.055em]">
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
                  "flex min-h-11 w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm transition duration-200",
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

        <button className="mt-auto flex min-h-11 items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm text-nook-ink/70 hover:bg-black/[0.035]">
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

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-black/5 bg-nook-card/72 px-4 py-3 backdrop-blur-2xl lg:hidden">
        <div className="text-[28px] font-medium tracking-[-0.055em]">nook</div>
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
            onClick={toggleTheme}
            className="flex min-h-11 w-full items-center gap-3 rounded-[14px] px-3 py-3 text-sm hover:bg-black/[0.035]"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {darkMode ? "Heller Modus" : "Dunkler Modus"}
          </button>
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
        {[Search, Bell].map((Icon, index) => (
          <button
            key={index}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/60 text-nook-ink/70 shadow-sm backdrop-blur-xl transition hover:bg-white"
          >
            <Icon size={17} strokeWidth={1.8} />
          </button>
        ))}
        <button
          onClick={toggleTheme}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-white/60 text-nook-ink/70 shadow-sm backdrop-blur-xl transition hover:bg-white"
          aria-label={darkMode ? "Hellen Modus verwenden" : "Dunklen Modus verwenden"}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <main className="relative z-10 mx-auto max-w-[1120px] px-4 pb-28 pt-24 sm:px-6 lg:ml-60 lg:px-8 lg:pt-10 xl:px-12">
        {page === "today" && (
          <>
            <section className="mb-10 min-h-36 rounded-[24px] bg-gradient-to-br from-nook-teal/10 via-white/20 to-nook-violet/10 px-6 py-8 backdrop-blur-sm lg:px-8 lg:py-10">
              <h1 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.035em] lg:text-[32px]">
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
                    onClick={() => openRoutineEditor()}
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
                      onToggle={() => toggleRoutine(routine.id)}
                      onEdit={() => openRoutineEditor(routine)}
                    />
                  ))}
                  {routines.length === 0 && (
                    <button
                      onClick={() => openRoutineEditor()}
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
                action={
                  <button
                    onClick={() => setPage("tracking")}
                    className="text-sm text-nook-teal"
                  >
                    Öffnen
                  </button>
                }
              >
                <p className="py-7 text-sm leading-6 text-nook-muted">
                  Menstruation, Kopfschmerzen oder eigene Beobachtungen – ruhig,
                  privat und ohne Bewertung.
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
                        <div className="mb-2 flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{project.title}</h3>
                              <button
                                onClick={() => openProjectEditor(project)}
                                className="grid h-7 w-7 place-items-center rounded-full text-nook-muted transition hover:bg-black/5 hover:text-nook-ink"
                                aria-label={`${project.title} bearbeiten`}
                              >
                                <Pencil size={14} strokeWidth={1.8} />
                              </button>
                            </div>
                            {project.description && (
                              <p className="mt-1 max-w-2xl text-sm leading-6 text-nook-muted">
                                {project.description}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-nook-muted">
                              {
                                tasks.filter(
                                  (task) => task.projectId === project.id,
                                ).length
                              }{" "}
                              Aufgaben
                              {project.endDate
                                ? ` · bis ${new Intl.DateTimeFormat("de-CH").format(new Date(`${project.endDate}T12:00:00`))}`
                                : ""}
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
            onButton={() => openRoutineEditor()}
          >
            <div className="grid gap-5 md:grid-cols-2">
              {routines.map((routine) => (
                <NookCard
                  key={routine.id}
                  title={routine.title}
                  subtitle={`${routine.category} · ${routine.rhythm === "fixed" ? "Fester Rhythmus" : "Flexibles Ziel"}`}
                  action={
                    <button
                      onClick={() => openRoutineEditor(routine)}
                      className="text-sm text-nook-teal"
                    >
                      Bearbeiten
                    </button>
                  }
                >
                  <RoutineRow
                    routine={routine}
                    onToggle={() => toggleRoutine(routine.id)}
                    onEdit={() => openRoutineEditor(routine)}
                  />
                  <div className="mt-2 grid gap-3 border-t border-black/5 pt-4 sm:grid-cols-2">
                    <div className="rounded-[18px] bg-white/55 px-4 py-3">
                      <p className="text-xs text-nook-muted">Ziel</p>
                      <p className="mt-1 text-sm font-medium">
                        {routine.target}× pro{" "}
                        {routinePeriodLabels[
                          routine.period
                        ].toLowerCase()}
                        {routine.amount
                          ? ` · ${routine.amount} ${routine.unit}`
                          : ""}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-white/55 px-4 py-3">
                      <p className="text-xs text-nook-muted">
                        Rhythmus & Erinnerung
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {routine.preferredWeekdays.length
                          ? routine.preferredWeekdays
                              .map((day) => weekdayLabels[day - 1])
                              .join(", ")
                          : "Wochentage frei"}
                        {routine.reminderTime
                          ? ` · ${routine.reminderTime} Uhr`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <RoutineHistory routine={routine} />
                </NookCard>
              ))}
              {routines.length === 0 && (
                <NookCard title="Deine erste Routine">
                  <div className="py-6">
                    <p className="max-w-lg leading-7 text-nook-muted">
                      Wähle einen festen Rhythmus oder ein flexibles Ziel – so,
                      wie es wirklich in deinen Alltag passt.
                    </p>
                    <button
                      onClick={() => openRoutineEditor()}
                      className="mt-5 rounded-2xl bg-nook-teal/10 px-4 py-2.5 text-sm text-nook-teal"
                    >
                      + Routine anlegen
                    </button>
                  </div>
                </NookCard>
              )}
            </div>
          </PageHeading>
        )}

        {page === "tracking" && (
          <PageHeading
            title="Tracking"
            subtitle="Beobachten, ohne zu bewerten."
            buttonLabel="Eigener Tracker"
            onButton={() => {
              setPage("tracking");
              const button = document.querySelector<HTMLButtonElement>(
                '[data-create-tracker="true"]',
              );
              button?.click();
            }}
          >
            <TrackingWorkspace
              initialTrackers={initialData.trackingTrackers}
              initialEntries={initialData.trackingEntries}
            />
          </PageHeading>
        )}

        {page === "projects" && (
          <PageHeading
            title="Projekte"
            subtitle={
              activeKnowledgeProject
                ? "Ein Ort, an dem eine Idee wachsen darf."
                : "Ideen, erste Gedanken und Wissen im Werden."
            }
            buttonLabel="Projekt"
            onButton={() => openKnowledgeProjectEditor()}
          >
            {!activeKnowledgeProject ? (
              <div className="grid gap-5 md:grid-cols-2">
                {knowledgeProjects.map((project) => {
                  const pageCount = knowledgeProjectPages.filter(
                    (projectPage) => projectPage.projectId === project.id,
                  ).length;
                  return (
                    <button
                      key={project.id}
                      onClick={() => openKnowledgeProject(project)}
                      className="group rounded-[24px] border border-white/80 bg-white/72 p-6 text-left shadow-nook backdrop-blur-2xl transition duration-500 hover:-translate-y-0.5 hover:bg-white/80"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-nook-violet/10 text-nook-violet">
                          <FolderKanban size={19} strokeWidth={1.7} />
                        </div>
                        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-nook-muted">
                          {knowledgeProjectStatusLabels[project.status]}
                        </span>
                      </div>
                      <h2 className="mt-7 text-xl font-semibold tracking-[-0.03em]">
                        {project.title}
                      </h2>
                      <p className="mt-2 min-h-12 text-sm leading-6 text-nook-muted">
                        {project.description ||
                          "Noch ganz offen – hier darf die Idee erst einmal ankommen."}
                      </p>
                      <p className="mt-5 text-xs text-nook-muted">
                        {pageCount === 1
                          ? "1 Notizseite"
                          : `${pageCount} Notizseiten`}
                      </p>
                    </button>
                  );
                })}
                {knowledgeProjects.length === 0 && (
                  <NookCard title="Platz für deine Ideen">
                    <div className="max-w-xl py-6">
                      <p className="leading-7 text-nook-muted">
                        Ein Projekt muss noch keinen festen Plan haben. Sammle
                        erste Gedanken und lasse daraus in Ruhe etwas entstehen.
                      </p>
                      <button
                        onClick={() => openKnowledgeProjectEditor()}
                        className="mt-5 rounded-2xl bg-nook-violet/10 px-4 py-2.5 text-sm text-nook-violet"
                      >
                        + Erstes Projekt anlegen
                      </button>
                    </div>
                  </NookCard>
                )}
              </div>
            ) : (
              <div>
                <button
                  onClick={() => {
                    setActiveKnowledgeProjectId("");
                    setActiveKnowledgePageId("");
                  }}
                  className="mb-5 flex items-center gap-2 text-sm text-nook-muted transition hover:text-nook-ink"
                >
                  <ArrowLeft size={16} />
                  Alle Projekte
                </button>

                <section className="mb-5 rounded-[24px] border border-white/80 bg-white/72 p-6 shadow-nook backdrop-blur-2xl">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="rounded-full bg-nook-violet/10 px-3 py-1 text-xs text-nook-violet">
                        {
                          knowledgeProjectStatusLabels[
                            activeKnowledgeProject.status
                          ]
                        }
                      </span>
                      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
                        {activeKnowledgeProject.title}
                      </h2>
                      {activeKnowledgeProject.description && (
                        <p className="mt-3 max-w-3xl leading-7 text-nook-muted">
                          {activeKnowledgeProject.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        openKnowledgeProjectEditor(activeKnowledgeProject)
                      }
                      className="flex items-center gap-2 rounded-2xl bg-black/5 px-4 py-2.5 text-sm"
                    >
                      <Pencil size={15} />
                      Bearbeiten
                    </button>
                  </div>
                </section>

                <div className="grid items-start gap-5 lg:grid-cols-[240px_1fr]">
                  <aside className="rounded-[24px] border border-white/80 bg-white/72 p-3 shadow-nook backdrop-blur-2xl">
                    <div className="mb-2 flex items-center justify-between px-2 py-2">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-nook-muted">
                        Notizseiten
                      </p>
                      <button
                        onClick={() =>
                          addKnowledgePage(activeKnowledgeProject.id)
                        }
                        className="grid h-8 w-8 place-items-center rounded-full bg-nook-violet/10 text-nook-violet"
                        aria-label="Notizseite hinzufügen"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {knowledgeProjectPages
                        .filter(
                          (projectPage) =>
                            projectPage.projectId ===
                            activeKnowledgeProject.id,
                        )
                        .map((projectPage) => (
                          <button
                            key={projectPage.id}
                            onClick={() => selectKnowledgePage(projectPage)}
                            className={[
                              "flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm transition",
                              activeKnowledgePageId === projectPage.id
                                ? "bg-nook-violet/10 text-nook-violet"
                                : "hover:bg-black/[0.035]",
                            ].join(" ")}
                          >
                            <FileText size={15} strokeWidth={1.7} />
                            <span className="truncate">{projectPage.title}</span>
                          </button>
                        ))}
                    </div>
                  </aside>

                  <section className="rounded-[24px] border border-white/80 bg-white/72 p-5 shadow-nook backdrop-blur-2xl sm:p-6">
                    {activeKnowledgePage ? (
                      <>
                        <div className="flex items-center gap-3">
                          <input
                            value={knowledgePageTitle}
                            onChange={(event) =>
                              setKnowledgePageTitle(event.target.value)
                            }
                            className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tracking-[-0.03em] outline-none"
                            aria-label="Seitentitel"
                          />
                          <button
                            onClick={() =>
                              deleteKnowledgePage(activeKnowledgePage)
                            }
                            className="grid h-9 w-9 place-items-center rounded-full text-nook-muted transition hover:bg-rose-50 hover:text-rose-700"
                            aria-label="Notizseite löschen"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <textarea
                          value={knowledgePageContent}
                          onChange={(event) =>
                            setKnowledgePageContent(event.target.value)
                          }
                          className="mt-5 min-h-[360px] w-full resize-y bg-transparent text-[15px] leading-7 outline-none"
                          placeholder="Schreib einfach los …"
                        />
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={saveKnowledgePage}
                            disabled={knowledgePageSaving}
                            className="rounded-2xl bg-nook-violet px-4 py-2.5 text-sm text-white disabled:cursor-wait disabled:opacity-60"
                          >
                            {knowledgePageSaving
                              ? "Speichert …"
                              : "Seite speichern"}
                          </button>
                        </div>

                        <div className="my-6 border-t border-black/[0.06]" />

                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="font-medium">Weitere Inhalte</h3>
                            <p className="mt-1 text-xs text-nook-muted">
                              Strukturiere nur, was davon profitiert.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                addKnowledgeProjectBlock(
                                  activeKnowledgePage.id,
                                  "checklist",
                                )
                              }
                              className="rounded-2xl bg-nook-violet/10 px-3 py-2 text-xs text-nook-violet"
                            >
                              + Checkliste
                            </button>
                            <button
                              onClick={() =>
                                addKnowledgeProjectBlock(
                                  activeKnowledgePage.id,
                                  "link",
                                )
                              }
                              className="rounded-2xl bg-nook-violet/10 px-3 py-2 text-xs text-nook-violet"
                            >
                              + Link
                            </button>
                            <button
                              onClick={() =>
                                addKnowledgeProjectBlock(
                                  activeKnowledgePage.id,
                                  "table",
                                )
                              }
                              className="rounded-2xl bg-nook-violet/10 px-3 py-2 text-xs text-nook-violet"
                            >
                              + Tabelle
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {knowledgeProjectBlocks
                            .filter(
                              (block) =>
                                block.pageId === activeKnowledgePage.id,
                            )
                            .map((block) => (
                              <KnowledgeProjectBlockCard
                                key={block.id}
                                block={block}
                                onUpdate={updateKnowledgeProjectBlock}
                                onDelete={deleteKnowledgeProjectBlock}
                              />
                            ))}
                        </div>
                      </>
                    ) : (
                      <div className="py-20 text-center">
                        <FileText
                          size={24}
                          className="mx-auto text-nook-violet/65"
                        />
                        <p className="mt-4 font-medium">
                          Noch keine Notizseite.
                        </p>
                        <button
                          onClick={() =>
                            addKnowledgePage(activeKnowledgeProject.id)
                          }
                          className="mt-4 text-sm text-nook-violet"
                        >
                          + Seite hinzufügen
                        </button>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )}
          </PageHeading>
        )}
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[20px] border border-black/[0.08] bg-nook-card/88 p-2 shadow-nook backdrop-blur-2xl lg:hidden">
        {navigation
          .filter((item) => item.id !== "projects")
          .map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={[
                  "flex min-h-11 flex-col items-center justify-center gap-1 rounded-[14px] px-1 py-1.5 text-[11px]",
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
        className="fixed bottom-24 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-nook-teal text-white shadow-nook transition duration-200 hover:-translate-y-0.5 hover:brightness-95 lg:bottom-8 lg:right-8"
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

      {routineEditorOpen && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/25 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setRoutineEditorOpen(false);
          }}
        >
          <div className="my-4 w-full max-w-2xl rounded-[28px] bg-nook-card p-6 shadow-nook">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                  {editingRoutineId ? "Routine bearbeiten" : "Neue Routine"}
                </h2>
                <p className="mt-1 text-sm text-nook-muted">
                  Ein Rhythmus, der dich trägt – nicht antreibt.
                </p>
              </div>
              <button
                onClick={() => setRoutineEditorOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-black/5"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Name
                <input
                  autoFocus
                  value={routineDraft.title}
                  onChange={(event) =>
                    setRoutineDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal focus:ring-4 focus:ring-nook-teal/10"
                  placeholder="Zum Beispiel: Sport"
                />
              </label>
              <label className="block text-sm font-medium">
                Kategorie
                <input
                  value={routineDraft.category}
                  onChange={(event) =>
                    setRoutineDraft((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal"
                  placeholder="Gesundheit, Zuhause …"
                />
              </label>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium">Art der Routine</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: "flexible" as const,
                    title: "Flexibles Ziel",
                    text: "Die Einheiten passen frei in den Zeitraum.",
                  },
                  {
                    value: "fixed" as const,
                    title: "Fester Rhythmus",
                    text: "Bestimmte Wochentage geben den Takt vor.",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setRoutineDraft((current) => ({
                        ...current,
                        rhythm: option.value,
                      }))
                    }
                    className={[
                      "rounded-[18px] border p-4 text-left transition",
                      routineDraft.rhythm === option.value
                        ? "border-nook-teal bg-nook-teal/8"
                        : "border-black/10 bg-white/60",
                    ].join(" ")}
                  >
                    <span className="block text-sm font-medium">
                      {option.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-nook-muted">
                      {option.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-medium">
                Häufigkeit
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={routineDraft.target}
                  onChange={(event) =>
                    setRoutineDraft((current) => ({
                      ...current,
                      target: Math.max(1, Number(event.target.value)),
                    }))
                  }
                  className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal"
                />
              </label>
              <label className="block text-sm font-medium">
                Zeitraum
                <select
                  value={routineDraft.period}
                  onChange={(event) =>
                    setRoutineDraft((current) => ({
                      ...current,
                      period: event.target.value as Routine["period"],
                      target:
                        event.target.value === "day" ? 1 : current.target,
                    }))
                  }
                  className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal"
                >
                  <option value="day">pro Tag</option>
                  <option value="week">pro Woche</option>
                  <option value="month">pro Monat</option>
                </select>
              </label>
              <label className="block text-sm font-medium">
                Dauer oder Menge
                <div className="mt-2 flex">
                  <input
                    type="number"
                    min={1}
                    value={routineDraft.amount}
                    onChange={(event) =>
                      setRoutineDraft((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    className="min-w-0 flex-1 rounded-l-[18px] border border-r-0 border-black/10 bg-white px-3 py-3 outline-none focus:border-nook-teal"
                    placeholder="30"
                  />
                  <input
                    value={routineDraft.unit}
                    onChange={(event) =>
                      setRoutineDraft((current) => ({
                        ...current,
                        unit: event.target.value,
                      }))
                    }
                    className="w-24 rounded-r-[18px] border border-black/10 bg-white px-3 py-3 outline-none focus:border-nook-teal"
                    placeholder="Min."
                  />
                </div>
              </label>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium">Bevorzugte Wochentage</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {weekdayLabels.map((label, index) => {
                  const day = index + 1;
                  const selected =
                    routineDraft.preferredWeekdays.includes(day);
                  return (
                    <button
                      key={label}
                      onClick={() =>
                        setRoutineDraft((current) => ({
                          ...current,
                          preferredWeekdays: selected
                            ? current.preferredWeekdays.filter(
                                (currentDay) => currentDay !== day,
                              )
                            : [...current.preferredWeekdays, day].sort(),
                        }))
                      }
                      className={[
                        "grid h-10 w-10 place-items-center rounded-full text-xs transition",
                        selected
                          ? "bg-nook-teal text-white"
                          : "border border-black/10 bg-white/70 text-nook-muted",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-medium">
                Erinnerung
                <input
                  type="time"
                  value={routineDraft.reminderTime}
                  onChange={(event) =>
                    setRoutineDraft((current) => ({
                      ...current,
                      reminderTime: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal"
                />
              </label>
              <label className="block text-sm font-medium">
                Startdatum
                <input
                  type="date"
                  value={routineDraft.startDate}
                  onChange={(event) =>
                    setRoutineDraft((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal"
                />
              </label>
              <label className="block text-sm font-medium">
                Enddatum (optional)
                <input
                  type="date"
                  value={routineDraft.endDate}
                  onChange={(event) =>
                    setRoutineDraft((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Farbe</p>
                <div className="mt-3 flex gap-3">
                  {(["teal", "green", "rose", "violet", "blue"] as const).map(
                    (color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setRoutineDraft((current) => ({ ...current, color }))
                        }
                        className={[
                          "h-8 w-8 rounded-full border-2",
                          color === "teal"
                            ? "bg-nook-teal"
                            : color === "green"
                              ? "bg-emerald-500"
                              : color === "rose"
                                ? "bg-rose-400"
                                : color === "violet"
                                  ? "bg-violet-400"
                                  : "bg-blue-400",
                          routineDraft.color === color
                            ? "border-nook-ink"
                            : "border-white",
                        ].join(" ")}
                        aria-label={`Farbe ${color}`}
                      />
                    ),
                  )}
                </div>
              </div>
              <label className="block text-sm font-medium">
                Symbol
                <select
                  value={routineDraft.symbol}
                  onChange={(event) =>
                    setRoutineDraft((current) => ({
                      ...current,
                      symbol: event.target.value as Routine["symbol"],
                    }))
                  }
                  className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal"
                >
                  <option value="repeat">Rhythmus</option>
                  <option value="activity">Bewegung</option>
                  <option value="book">Lesen</option>
                  <option value="heart">Gesundheit</option>
                  <option value="leaf">Natur</option>
                </select>
              </label>
            </div>

            {routineError && (
              <p className="mt-4 text-sm text-rose-700">{routineError}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              {editingRoutineId ? (
                <button
                  onClick={() => {
                    const routine = routines.find(
                      (item) => item.id === editingRoutineId,
                    );
                    if (routine) deleteRoutine(routine);
                  }}
                  className="rounded-2xl px-3 py-2.5 text-sm text-rose-700 transition hover:bg-rose-50"
                >
                  Routine löschen
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setRoutineEditorOpen(false)}
                  className="rounded-2xl bg-black/5 px-4 py-2.5 text-sm"
                >
                  Abbrechen
                </button>
                <button
                  onClick={saveRoutine}
                  disabled={routineSaving}
                  className="rounded-2xl bg-nook-teal px-4 py-2.5 text-sm text-white disabled:cursor-wait disabled:opacity-60"
                >
                  {routineSaving ? "Speichert …" : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {knowledgeProjectEditorOpen && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/25 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setKnowledgeProjectEditorOpen(false);
            }
          }}
        >
          <div className="my-4 w-full max-w-xl rounded-[28px] bg-nook-card p-6 shadow-nook">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                  {editingKnowledgeProjectId
                    ? "Projekt bearbeiten"
                    : "Neues Projekt"}
                </h2>
                <p className="mt-1 text-sm text-nook-muted">
                  Eine Idee darf hier erst einmal offen bleiben.
                </p>
              </div>
              <button
                onClick={() => setKnowledgeProjectEditorOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-black/5"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </div>

            <label className="block text-sm font-medium">
              Titel
              <input
                autoFocus
                value={knowledgeProjectTitle}
                onChange={(event) =>
                  setKnowledgeProjectTitle(event.target.value)
                }
                className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-violet focus:ring-4 focus:ring-nook-violet/10"
                placeholder="Zum Beispiel: Idee für ein Kochbuch"
              />
            </label>

            <label className="mt-4 block text-sm font-medium">
              Beschreibung
              <textarea
                value={knowledgeProjectDescription}
                onChange={(event) =>
                  setKnowledgeProjectDescription(event.target.value)
                }
                className="mt-2 min-h-28 w-full resize-y rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-violet focus:ring-4 focus:ring-nook-violet/10"
                placeholder="Worum könnte es gehen?"
              />
            </label>

            <label className="mt-4 block text-sm font-medium">
              Status
              <select
                value={knowledgeProjectStatus}
                onChange={(event) =>
                  setKnowledgeProjectStatus(
                    event.target.value as KnowledgeProject["status"],
                  )
                }
                className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-violet"
              >
                <option value="idea">Idee</option>
                <option value="active">In Arbeit</option>
                <option value="paused">Pausiert</option>
                <option value="complete">Abgeschlossen</option>
              </select>
            </label>

            {knowledgeProjectError && (
              <p className="mt-3 text-sm text-rose-700">
                {knowledgeProjectError}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              {editingKnowledgeProjectId && activeKnowledgeProject ? (
                <button
                  onClick={() => {
                    setKnowledgeProjectEditorOpen(false);
                    deleteKnowledgeProject(activeKnowledgeProject);
                  }}
                  className="rounded-2xl px-3 py-2.5 text-sm text-rose-700 transition hover:bg-rose-50"
                >
                  Projekt löschen
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setKnowledgeProjectEditorOpen(false)}
                  className="rounded-2xl bg-black/5 px-4 py-2.5 text-sm"
                >
                  Abbrechen
                </button>
                <button
                  onClick={saveKnowledgeProject}
                  disabled={knowledgeProjectSaving}
                  className="rounded-2xl bg-nook-violet px-4 py-2.5 text-sm text-white disabled:cursor-wait disabled:opacity-60"
                >
                  {knowledgeProjectSaving ? "Speichert …" : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/25 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setEditingTask(null);
          }}
        >
          <div className="my-4 w-full max-w-lg rounded-[28px] bg-nook-card p-6 shadow-nook">
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

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Fälligkeitsdatum
                <input
                  type="date"
                  value={editTaskDueDate}
                  onChange={(event) => setEditTaskDueDate(event.target.value)}
                  className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal"
                />
              </label>

              <label className="block text-sm font-medium">
                Priorität
                <select
                  value={editTaskPriority}
                  onChange={(event) =>
                    setEditTaskPriority(event.target.value as Task["priority"])
                  }
                  className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal"
                >
                  <option value="none">Keine</option>
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm font-medium">
              Wiederholung
              <select
                value={editTaskRecurrence}
                onChange={(event) =>
                  setEditTaskRecurrence(
                    event.target.value as Task["recurrence"],
                  )
                }
                className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal"
              >
                <option value="none">Keine Wiederholung</option>
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich</option>
                <option value="monthly">Monatlich</option>
              </select>
            </label>

            <label className="mt-4 block text-sm font-medium">
              Notizen
              <textarea
                value={editTaskNotes}
                onChange={(event) => setEditTaskNotes(event.target.value)}
                className="mt-2 min-h-24 w-full resize-y rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-nook-teal focus:ring-4 focus:ring-nook-teal/10"
                placeholder="Details, Gedanken oder hilfreiche Hinweise …"
              />
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

      {editingProject && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/25 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setEditingProject(null);
          }}
        >
          <div className="my-4 w-full max-w-xl rounded-[28px] bg-nook-card p-6 shadow-nook">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                  Projekt bearbeiten
                </h2>
                <p className="mt-1 text-sm text-nook-muted">
                  Ein ruhiger Ort für Ziel, Aufgaben und Gedanken.
                </p>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="grid h-9 w-9 place-items-center rounded-full bg-black/5"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </div>

            <label className="block text-sm font-medium">
              Titel
              <input
                autoFocus
                value={editProjectTitle}
                onChange={(event) => setEditProjectTitle(event.target.value)}
                className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal focus:ring-4 focus:ring-nook-teal/10"
              />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Bereich
                <select
                  value={editProjectAreaId}
                  onChange={(event) => setEditProjectAreaId(event.target.value)}
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
                Enddatum
                <input
                  type="date"
                  value={editProjectEndDate}
                  onChange={(event) => setEditProjectEndDate(event.target.value)}
                  className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal"
                />
              </label>
            </div>

            <label className="mt-4 block text-sm font-medium">
              Beschreibung
              <textarea
                value={editProjectDescription}
                onChange={(event) =>
                  setEditProjectDescription(event.target.value)
                }
                className="mt-2 min-h-24 w-full resize-y rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal focus:ring-4 focus:ring-nook-teal/10"
                placeholder="Worum geht es in diesem Projekt?"
              />
            </label>

            <label className="mt-4 block text-sm font-medium">
              Notizen
              <textarea
                value={editProjectNotes}
                onChange={(event) => setEditProjectNotes(event.target.value)}
                className="mt-2 min-h-28 w-full resize-y rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-teal focus:ring-4 focus:ring-nook-teal/10"
                placeholder="Gedanken, Entscheidungen oder wichtige Details …"
              />
            </label>

            <p className="mt-4 rounded-[18px] bg-white/60 px-4 py-3 text-sm text-nook-muted">
              {
                tasks.filter((task) => task.projectId === editingProject.id)
                  .length
              }{" "}
              zugehörige To-dos bleiben direkt im Projekt sichtbar.
            </p>

            {editProjectError && (
              <p className="mt-3 text-sm text-rose-700">{editProjectError}</p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setEditingProject(null)}
                className="rounded-2xl bg-black/5 px-4 py-2.5 text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={saveProjectEdit}
                disabled={editProjectSaving}
                className="rounded-2xl bg-nook-teal px-4 py-2.5 text-sm text-white disabled:cursor-wait disabled:opacity-60"
              >
                {editProjectSaving ? "Speichert …" : "Speichern"}
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
      <section className="mb-10 flex items-start justify-between gap-4 pt-5 lg:pt-0">
        <div>
          <h1 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.035em] lg:text-[32px]">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-nook-muted">{subtitle}</p>
        </div>
        <button
          onClick={onButton}
          className="flex min-h-11 items-center gap-2 rounded-[14px] bg-nook-teal px-4 py-2.5 text-sm font-medium text-white shadow-nook transition duration-200 hover:brightness-95"
        >
          <Plus size={17} />
          {buttonLabel}
        </button>
      </section>
      {children}
    </>
  );
}

function RoutineHistory({ routine }: { routine: Routine }) {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - 6 + index);
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Zurich",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
    return {
      key,
      label: new Intl.DateTimeFormat("de-CH", { weekday: "short" })
        .format(date)
        .slice(0, 2),
      done: routine.completionDates.includes(key),
    };
  });
  const months = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 4 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: new Intl.DateTimeFormat("de-CH", { month: "short" }).format(date),
      count: routine.completionDates.filter((day) => day.startsWith(key)).length,
    };
  });
  const max = Math.max(1, ...months.map((month) => month.count));

  return (
    <div className="mt-4 border-t border-black/5 pt-4">
      <div className="mb-5 flex justify-between gap-2">
        {days.map((day) => (
          <div key={day.key} className="flex flex-col items-center gap-2">
            <span
              className={[
                "grid h-7 w-7 place-items-center rounded-full border",
                day.done
                  ? "border-nook-teal bg-nook-teal text-white"
                  : "border-black/10 bg-white/55",
              ].join(" ")}
            >
              {day.done && <CheckCircle2 size={13} />}
            </span>
            <span className="text-[10px] text-nook-muted">{day.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-3">
        {months.map((month) => (
          <div key={month.key} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-16 w-full items-end rounded-xl bg-white/45 px-1">
              <div
                className="w-full rounded-lg bg-nook-teal/45 transition-all duration-700"
                style={{
                  height: `${Math.max(8, (month.count / max) * 100)}%`,
                }}
                title={`${month.count} Einheiten`}
              />
            </div>
            <span className="text-[10px] text-nook-muted">{month.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-nook-muted">
        Dein Verlauf zeigt Regelmäßigkeit, nicht Perfektion.
      </p>
    </div>
  );
}
