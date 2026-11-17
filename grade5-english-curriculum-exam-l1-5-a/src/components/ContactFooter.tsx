import { EXAM_TITLE } from "@/config";

interface Props {
  showTeacherKey?: boolean;
  onOpenTeacherKey?: () => void;
}

export const WHATSAPP_URL = "https://wa.me/963930215022";
export const PHONE_DISPLAY = "0930215022";
export const CONTACT_NAME = "المهندس سومر شاهين";

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
    </svg>
  );
}

export default function ContactFooter({ showTeacherKey, onOpenTeacherKey }: Props) {
  return (
    <footer className="mt-16 border-t-[3px] border-turq/70 bg-[#fffdf6]/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-7 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_2px_0_rgba(10,110,120,0.35)]"
            aria-hidden="true"
          >
            <WhatsAppIcon className="h-7 w-7" />
          </span>
          <div className="leading-tight">
            <p className="label-caps text-turq-deep">Contact · Curriculum office</p>
            <p
              dir="rtl"
              lang="ar"
              className="mt-1 text-lg font-bold text-ink"
              style={{ fontFamily: '"Geeza Pro", "Segoe UI", Tahoma, Arial, sans-serif' }}
            >
              {CONTACT_NAME}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`tel:${PHONE_DISPLAY}`}
            className="tabular rounded-full border-2 border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-turq hover:text-turq-deep"
          >
            {PHONE_DISPLAY}
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp us
          </a>
          {showTeacherKey && onOpenTeacherKey && (
            <button
              type="button"
              onClick={onOpenTeacherKey}
              className="rounded-full border border-dashed border-purple/50 px-3 py-2 text-xs font-semibold text-purple/80 transition hover:bg-purple/10 hover:text-purple"
            >
              Teacher area
            </button>
          )}
        </div>
      </div>
      <div className="border-t border-paper-edge px-4 py-3 text-center text-[11px] text-ink-soft md:px-8">
        {EXAM_TITLE} · Unit 1 · Model A · Lessons 1–5 · 50 questions · 100 marks
      </div>
    </footer>
  );
}
