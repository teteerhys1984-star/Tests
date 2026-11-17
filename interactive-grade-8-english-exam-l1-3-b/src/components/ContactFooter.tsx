import { EXAM_TITLE } from "@/config";
import { PhoneIcon, WhatsAppIcon } from "./Icons";

const WHATSAPP_URL = "https://wa.me/963930215022";

export default function ContactFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      className={
        compact
          ? "mt-8 border-t-2 border-ink/10 bg-white"
          : "mt-12 border-t-2 border-ink/10 bg-white"
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-6 text-center">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-ink/60">
          Exam prepared by
        </span>

        <p dir="rtl" lang="ar" className="text-lg font-extrabold text-ink">
          المهندس سومر شاهين
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <a
            href="tel:+963930215022"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink/15 bg-paper px-4 text-base font-extrabold text-ink transition-colors hover:border-brand-blue hover:text-brand-blue"
          >
            <PhoneIcon className="h-4 w-4 text-brand-orange" />
            <span dir="ltr" className="tabular">
              0930215022
            </span>
          </a>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-transparent bg-[#25D366] px-4 text-base font-extrabold text-white transition-transform hover:-translate-y-0.5"
          >
            <WhatsAppIcon className="h-5 w-5" />
            WhatsApp
          </a>
        </div>

        <p className="max-w-lg text-xs leading-relaxed text-ink/60">
          {EXAM_TITLE} · Grade 8 · Unit 1 · Lessons 1–3 · Model B. Results are also sent to the
          teacher when a connection is available.
        </p>
      </div>
    </footer>
  );
}
