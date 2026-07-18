export function NookCard({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-nook border border-white/70 bg-white/82 p-5 shadow-nook backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="grid h-9 w-9 place-items-center rounded-full bg-nook-teal/10 text-nook-teal">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.025em]">
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
