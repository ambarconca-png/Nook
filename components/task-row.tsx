import { Check } from "lucide-react";
import type { Area, Project, Task } from "@/lib/types";

export function TaskRow({
  task,
  area,
  project,
  onToggle,
}: {
  task: Task;
  area?: Area;
  project?: Project;
  onToggle: () => void;
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

      <div className="min-w-0">
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
    </div>
  );
}
