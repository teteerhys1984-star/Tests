import { WhatsAppIcon } from "./Icons";

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-6 pt-10 no-print">
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-green-100 bg-white/75 px-4 py-3 text-sm text-green-900 shadow-sm backdrop-blur sm:flex-row sm:gap-4">
        <span className="flex items-center gap-2">
          <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
          <span lang="ar" dir="rtl" className="font-semibold">
            المهندس سومر شاهين
          </span>
        </span>
        <span className="hidden h-4 w-px bg-green-200 sm:block" aria-hidden="true" />
        <a
          href="https://wa.me/963930215022"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 font-bold tracking-wide text-green-800 ring-1 ring-green-200 transition hover:bg-lime-100 hover:text-green-950"
          aria-label="Contact on WhatsApp: 0930215022"
        >
          <span dir="ltr">0930215022</span>
        </a>
      </div>
    </footer>
  );
}
