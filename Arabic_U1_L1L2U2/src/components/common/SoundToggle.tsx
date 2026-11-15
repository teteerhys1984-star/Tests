import { IconSound } from './Icons';

export function SoundToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="btn btn-soft !px-3 !py-2 text-sm"
      aria-pressed={on}
      title={on ? 'إيقاف الصوت' : 'تشغيل الصوت'}
    >
      <IconSound on={on} />
      <span className="hidden sm:inline">{on ? 'الصوت مفعّل' : 'الصوت متوقّف'}</span>
    </button>
  );
}
