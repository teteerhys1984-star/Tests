import { Logo } from "../common/Logo";
import { Icon } from "../common/Icon";
import { SoundToggle } from "../common/SoundToggle";
import { toArabicDigits } from "../../utils/arabic";

interface ExamHeaderProps {
  elapsedDisplay: string;
  answered: number;
  totalSubparts: number;
  studentName: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function ExamHeader({
  elapsedDisplay,
  answered,
  totalSubparts,
  studentName,
  soundEnabled,
  onToggleSound,
}: ExamHeaderProps) {
  const progress = totalSubparts === 0 ? 0 : Math.round((answered / totalSubparts) * 100);

  return (
    <header className="glass-bar sticky top-0 z-40">
      <div className="page-container flex flex-wrap items-center justify-between gap-2 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Logo compact />
          <span className="hidden h-8 w-px bg-[#ecdcd9] sm:block" />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[11px] font-bold text-[#8a6b76]">اختبار اللغة العربية — الصف الخامس</p>
            <p className="truncate text-[11px] text-[#aa979c]">الطالبة: {studentName}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className="flex items-center gap-1.5 rounded-full border border-[#e8d3d8] bg-white/85 px-2.5 py-1.5 sm:px-3"
            role="timer"
            aria-label={`الوقت المنقضي ${elapsedDisplay}`}
            title="الوقت المنقضي"
          >
            <Icon name="timer" size={15} className="text-[#a15470]" />
            <span className="hidden text-[10px] font-semibold text-[#9b7d86] sm:inline">الوقت المنقضي</span>
            <time
              className="font-mono text-[13px] font-bold tabular-nums tracking-wider text-[#6d3b4f]"
              dir="ltr"
            >
              {elapsedDisplay}
            </time>
          </div>

          <div className="hidden items-center gap-1.5 rounded-full border border-[#e5e0ee] bg-[#f5f2fa] px-2.5 py-1.5 text-[11px] font-bold text-[#6d5b95] md:flex">
            <Icon name="check" size={13} />
            {toArabicDigits(answered)} / {toArabicDigits(totalSubparts)}
          </div>

          <SoundToggle enabled={soundEnabled} onToggle={onToggleSound} />
        </div>
      </div>
      <div className="page-container pb-2.5">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-[#a48e95]">
          <span>تقدّم الإجابة</span>
          <span>{toArabicDigits(progress)}٪ مكتمل</span>
        </div>
      </div>
    </header>
  );
}
