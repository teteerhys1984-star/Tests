export default function MuteButton({
  muted,
  onToggle,
  tone = "paper",
}: {
  muted: boolean;
  onToggle: () => void;
  tone?: "paper" | "ink";
}) {
  const label = muted ? "Sound is off — turn it on" : "Sound is on — turn it off";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={muted}
      title={label}
      aria-label={label}
      className={`cut-sm inline-flex items-center gap-2 px-3 py-2 font-display text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
        tone === "ink" ? "bg-paper text-ink" : "bg-white text-ink"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M4 9h3l5-4v14l-5-4H4V9z" />
        {muted ? (
          <path
            d="M16 9l5 6M21 9l-5 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <path
            d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
      <span className="hidden sm:inline">{muted ? "Unmute" : "Mute"}</span>
    </button>
  );
}
