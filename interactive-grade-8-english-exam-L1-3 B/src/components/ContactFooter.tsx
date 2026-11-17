import { PhoneIcon, WhatsAppIcon } from "./Icons";

/**
 * Contact footer — the supplied contact details are displayed exactly as given.
 */
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
          Contact
        </span>

        <p
          dir="rtl"
          lang="ar"
          className="text-lg font-extrabold text-ink"
          style={{ fontFamily: "Nunito, 'Segoe UI', Tahoma, sans-serif" }}
        >
          المهندس سومر شاهين
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <a
            href="tel:0930215022"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink/15 bg-paper px-4 text-base font-extrabold text-ink transition-colors hover:border-brand-blue hover:text-brand-blue"
          >
            <PhoneIcon className="h-4 w-4 text-brand-orange" />
            <span className="tabular">0930215022</span>
          </a>

          <a
            href="https://wa.me/963930215022"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-transparent bg-[#25D366] px-4 text-base font-extrabold text-white transition-transform hover:-translate-y-0.5"
          >
            <WhatsAppIcon className="h-5 w-5" />
            WhatsApp
          </a>
        </div>

        <p className="max-w-md text-xs leading-relaxed text-ink/60">
          Grade 8 · Unit 1 · Lessons 1–3 · English examination (Model B)
        </p>
      </div>
    </footer>
  );
}
