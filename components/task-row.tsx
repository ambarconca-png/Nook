import { Check, Pencil, Trash2 } from "lucide-react";
import type { Area, Project, Task } from "@/lib/types";

export function TaskRow({
  task,
  area,
  project,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  area?: Area;
  project?: Project;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
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

      <div className="min-w-0 flex-1">
        <p
          className={[
            "text-sm",
            task.done ? "text-nook-muted line-through" : "text-nook-ink",
          ].join(" ")}
        >
          {task.title}
        </p>
        {(area || project) && (
          <p className="mt-1 truncate text-xs text-nook-muted">
            {area?.name}
            {project ? ` · ${project.title}` : ""}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
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
  );
}
