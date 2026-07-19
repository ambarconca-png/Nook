export function SmokeBackground() {
  return (
    <div
      aria-hidden="true"
      className="smoke-canvas pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="ink-cloud" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-nook-background via-nook-background/60 to-transparent" />
    </div>
  );
}
