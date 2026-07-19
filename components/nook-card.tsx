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
    <section className="group rounded-[22px] border border-white/80 bg-nook-card/76 p-5 shadow-nook backdrop-blur-2xl transition duration-200 hover:-translate-y-0.5 hover:bg-nook-card/88">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-nook-teal/10 text-nook-teal">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.02em]">
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
