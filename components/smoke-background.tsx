export function SmokeBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="smoke smoke-slate" />
      <div className="smoke smoke-amber" />
      <div className="smoke smoke-rose" />
      <div className="smoke smoke-violet" />
      <div className="smoke smoke-mint" />
      <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#f7f3f0] via-[#f7f3f0]/70 to-transparent" />
    </div>
  );
}
