/** Decorative fixed background: blueprint grid + soft aurora glows. */
export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="blueprint absolute inset-0" />
      <div className="animate-drift absolute -top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-cyan-500/12 blur-[130px]" />
      <div className="animate-float absolute -left-40 top-1/3 h-[420px] w-[420px] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="animate-drift absolute -right-48 bottom-0 h-[460px] w-[460px] rounded-full bg-violet-500/10 blur-[130px]" />
    </div>
  );
}
