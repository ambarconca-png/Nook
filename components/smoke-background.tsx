export function SmokeBackground() {
  return (
    <div
      aria-hidden="true"
      className="smoke-canvas pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="smoke smoke-slate" />
      <div className="smoke smoke-amber" />
      <div className="smoke smoke-rose" />
      <div className="smoke smoke-violet" />
      <div className="smoke smoke-mint" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-nook-background via-nook-background/80 to-transparent" />
    </div>
  );
}
