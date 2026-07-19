export function SmokeBackground() {
  return (
    <div
      aria-hidden="true"
      className="smoke-canvas pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="ink-cloud" />
      <div className="ink-cloud ink-cloud-secondary" />
      <div className="absolute inset-0 bg-nook-background/10" />
    </div>
  );
}
