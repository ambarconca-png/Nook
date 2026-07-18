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
    <section className="group rounded-[22px] border border-white/80 bg-white/78 p-5 shadow-nook backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:bg-white/86 hover:shadow-[0_24px_70px_rgba(67,47,42,0.12)]">
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
