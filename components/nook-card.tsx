export function NookCard({
  title,
  subtitle,
  icon,
  action,
  accent = "teal",
  onOpen,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  accent?: "teal" | "blue" | "green" | "pink" | "orange" | "violet";
  onOpen?: () => void;
  children: React.ReactNode;
}) {
  const accents = {
    teal: {
      border: "border-white/80",
      icon: "bg-nook-teal/10 text-nook-teal",
      title: "text-nook-ink",
    },
    blue: {
      border: "border-slate-300/70",
      icon: "bg-slate-200/80 text-slate-700",
      title: "text-slate-700 dark:text-slate-300",
    },
    green: {
      border: "border-emerald-200/70",
      icon: "bg-emerald-100/80 text-emerald-700",
      title: "text-emerald-800 dark:text-emerald-300",
    },
    pink: {
      border: "border-pink-200/70",
      icon: "bg-pink-100/80 text-pink-700",
      title: "text-pink-800 dark:text-pink-300",
    },
    orange: {
      border: "border-orange-200/70",
      icon: "bg-orange-100/80 text-orange-700",
      title: "text-orange-800 dark:text-orange-300",
    },
    violet: {
      border: "border-violet-200/70",
      icon: "bg-violet-100/80 text-violet-700",
      title: "text-violet-800 dark:text-violet-300",
    },
  }[accent];

  return (
    <section
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={onOpen ? `${title} öffnen` : undefined}
      onClick={(event) => {
        if (
          onOpen &&
          !(event.target as HTMLElement).closest(
            "button, input, textarea, select, a",
          )
        ) {
          onOpen();
        }
      }}
      onKeyDown={(event) => {
        if (
          onOpen &&
          event.target === event.currentTarget &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          onOpen();
        }
      }}
      className={[
        "group rounded-[22px] border bg-nook-card/76 p-5 text-left shadow-nook backdrop-blur-2xl transition duration-200 hover:-translate-y-0.5 hover:bg-nook-card/88",
        accents.border,
        onOpen ? "cursor-pointer focus-visible:outline-none" : "",
      ].join(" ")}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className={`grid h-10 w-10 place-items-center rounded-[14px] ${accents.icon}`}
            >
              {icon}
            </div>
          )}
          <div>
            <h2
              className={`text-[17px] font-semibold tracking-[-0.02em] ${accents.title}`}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-nook-muted">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
