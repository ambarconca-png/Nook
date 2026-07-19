import {
  Activity,
  BookOpen,
  Check,
  Heart,
  Leaf,
  Repeat2,
} from "lucide-react";
import type { Routine } from "@/lib/types";

const periodLabels = {
  day: "heute",
  week: "diese Woche",
  month: "diesen Monat",
};

const colorClasses = {
  teal: "bg-nook-teal/10 text-nook-teal",
  green: "bg-emerald-100 text-emerald-700",
  rose: "bg-rose-100 text-rose-700",
  violet: "bg-nook-violet/10 text-nook-violet",
  blue: "bg-blue-100 text-blue-700",
};

const symbols = {
  repeat: Repeat2,
  activity: Activity,
  book: BookOpen,
  heart: Heart,
  leaf: Leaf,
};

export function RoutineRow({
  routine,
  onToggle,
  onEdit,
}: {
  routine: Routine;
  onToggle: () => void;
  onEdit?: () => void;
}) {
  const Icon = symbols[routine.symbol];
  const remaining = Math.max(0, routine.target - routine.completed);
  const completedToday = routine.completionDates.includes(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Zurich",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()),
  );

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <button
        onClick={onEdit}
        disabled={!onEdit}
        className="flex min-w-0 items-center gap-3 text-left disabled:cursor-default"
      >
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${colorClasses[routine.color]}`}
        >
          <Icon size={17} strokeWidth={1.8} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {routine.title}
          </span>
          <span className="mt-1 block text-xs text-nook-muted">
            {routine.completed} von {routine.target} {periodLabels[routine.period]}
            {remaining > 0
              ? ` · noch ${remaining} ${remaining === 1 ? "Einheit" : "Einheiten"}`
              : " · Ziel erreicht"}
          </span>
        </span>
      </button>

      <button
        onClick={onToggle}
        className={[
          "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition",
          completedToday
            ? "border-nook-teal bg-nook-teal text-white"
            : "border-black/15 bg-white/75 text-nook-muted hover:border-nook-teal hover:text-nook-teal",
        ].join(" ")}
        aria-label={
          completedToday
            ? `${routine.title} heute zurücknehmen`
            : `${routine.title} heute erledigen`
        }
      >
        <Check size={16} strokeWidth={2.2} />
      </button>
    </div>
  );
}
