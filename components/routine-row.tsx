import { Check } from "lucide-react";
import type { Routine } from "@/lib/types";

export function RoutineRow({
  routine,
  onIncrement,
}: {
  routine: Routine;
  onIncrement: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{routine.title}</p>
        <p className="mt-1 text-xs text-nook-muted">
          {routine.completed} von {routine.target} diese Woche
        </p>
      </div>

      <button
        onClick={onIncrement}
        className="flex items-center gap-1.5"
        aria-label={`${routine.title} fortschreiben`}
      >
        {Array.from({ length: routine.target }).map((_, index) => {
          const completed = index < routine.completed;
          return (
            <span
              key={index}
              className={[
                "grid h-5 w-5 place-items-center rounded-full border",
                completed
                  ? "border-nook-teal bg-nook-teal text-white"
                  : "border-black/20 bg-white",
              ].join(" ")}
            >
              {completed && <Check size={11} strokeWidth={2.5} />}
            </span>
          );
        })}
      </button>
    </div>
  );
}
