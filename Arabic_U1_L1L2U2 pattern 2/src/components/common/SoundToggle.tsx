import { Icon } from "./Icon";

interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
  withLabel?: boolean;
  tone?: "light" | "default";
}

export function SoundToggle({ enabled, onToggle, withLabel = false, tone = "default" }: SoundToggleProps) {
  const label = enabled ? "إيقاف المؤثرات الصوتية" : "تشغيل المؤثرات الصوتية";

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={enabled}
        aria-label={label}
        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition ${
          enabled
            ? "border-[#e3c3ce] bg-[#fdf1f4] text-[#8c3f5c]"
            : "border-[#e8ded9] bg-white/70 text-[#95838a]"
        }`}
      >
        <Icon name={enabled ? "sound" : "mute"} size={16} />
        <span>المؤثرات الصوتية: {enabled ? "مفعّلة" : "مغلقة"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      className={`btn-icon relative ${
        tone === "light" ? "border-white/40 bg-white/20 text-white hover:bg-white/30" : ""
      }`}
    >
      <Icon name={enabled ? "sound" : "mute"} size={18} />
    </button>
  );
}
