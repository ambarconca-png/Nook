"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import type { Area, Project, Task } from "@/lib/types";

export function TaskRow({
  task,
  area,
  project,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSaveNotes,
}: {
  task: Task;
  area?: Area;
  project?: Project;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onSaveNotes?: (notes: string) => Promise<void>;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [notes, setNotes] = useState(task.notes);
  const [notesSaving, setNotesSaving] = useState(false);
  const details = [
    area?.name,
    project?.title,
    task.dueDate
      ? `fällig ${new Intl.DateTimeFormat("de-CH").format(
          new Date(`${task.dueDate}T12:00:00`),
        )}`
      : "",
    task.priority === "high"
      ? "hohe Priorität"
      : task.priority === "medium"
        ? "mittlere Priorität"
        : task.priority === "low"
          ? "niedrige Priorität"
          : "",
  ].filter(Boolean);

  return (
    <div className="py-3">
      <div className="flex items-center gap-3">
      <button
        onClick={onToggle}
        className={[
          "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition",
          task.done
            ? "border-nook-teal bg-nook-teal text-white"
            : "border-black/20 bg-white",
        ].join(" ")}
        aria-label={task.done ? "Als offen markieren" : "Als erledigt markieren"}
      >
        {task.done && <Check size={13} strokeWidth={2.4} />}
      </button>

      <button
        onClick={() => setNoteOpen((current) => !current)}
        className="min-w-0 flex-1 text-left"
        aria-expanded={noteOpen}
        aria-label={`${task.title}: Notiz ${noteOpen ? "ausblenden" : "anzeigen"}`}
      >
        <p
          className={[
            "text-sm",
            task.done ? "text-nook-muted line-through" : "text-nook-ink",
          ].join(" ")}
        >
          {task.title}
        </p>
        {details.length > 0 && (
          <p className="mt-1 truncate text-xs text-nook-muted">
            {details.join(" · ")}
          </p>
        )}
      </button>

      <div className="flex shrink-0 items-center gap-1">
        {onMoveUp && (
          <button
            onClick={onMoveUp}
            className="grid h-8 w-8 place-items-center rounded-full text-nook-muted transition hover:bg-black/5 hover:text-nook-ink"
            aria-label={`${task.title} nach oben verschieben`}
          >
            <ChevronUp size={14} />
          </button>
        )}
        {onMoveDown && (
          <button
            onClick={onMoveDown}
            className="grid h-8 w-8 place-items-center rounded-full text-nook-muted transition hover:bg-black/5 hover:text-nook-ink"
            aria-label={`${task.title} nach unten verschieben`}
          >
            <ChevronDown size={14} />
          </button>
        )}
        <button
          onClick={onEdit}
          className="grid h-8 w-8 place-items-center rounded-full text-nook-muted transition hover:bg-black/5 hover:text-nook-ink"
          aria-label={`${task.title} bearbeiten`}
        >
          <Pencil size={15} strokeWidth={1.8} />
        </button>
        <button
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-full text-nook-muted transition hover:bg-rose-50 hover:text-rose-700"
          aria-label={`${task.title} löschen`}
        >
          <Trash2 size={15} strokeWidth={1.8} />
        </button>
      </div>
      </div>
      {noteOpen && (
        <div className="ml-8 mt-3 rounded-2xl bg-white/45 px-4 py-3 dark:bg-white/5">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-24 w-full resize-y whitespace-pre-wrap bg-transparent text-sm leading-6 text-nook-muted outline-none"
            placeholder="Notiz hinzufügen …"
            aria-label={`Notiz zu ${task.title}`}
          />
          {onSaveNotes && notes !== task.notes && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={async () => {
                  setNotesSaving(true);
                  try {
                    await onSaveNotes(notes);
                  } finally {
                    setNotesSaving(false);
                  }
                }}
                disabled={notesSaving}
                className="rounded-xl bg-nook-teal px-3 py-2 text-xs text-white disabled:opacity-60"
              >
                {notesSaving ? "Speichert …" : "Notiz speichern"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
