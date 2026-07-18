export function SmokeBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[420px] overflow-hidden"
    >
      <div className="absolute left-[8%] top-[-40px] h-44 w-[38rem] rotate-6 rounded-[50%] bg-gradient-to-r from-violet-700/25 via-fuchsia-500/25 to-rose-400/25 blur-[55px]" />
      <div className="absolute left-[40%] top-8 h-40 w-[34rem] -rotate-3 rounded-[50%] bg-gradient-to-r from-orange-300/25 via-rose-500/20 to-violet-500/25 blur-[58px]" />
      <div className="absolute right-[-8%] top-24 h-52 w-[35rem] rotate-6 rounded-[50%] bg-gradient-to-r from-slate-700/20 via-teal-500/25 to-cyan-300/20 blur-[58px]" />
      <div className="absolute right-[5%] top-52 h-40 w-[26rem] -rotate-12 rounded-[50%] bg-gradient-to-r from-fuchsia-500/20 via-violet-600/25 to-indigo-400/20 blur-[58px]" />
    </div>
  );
}
