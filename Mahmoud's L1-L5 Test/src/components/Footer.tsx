import { Lock, Phone } from "lucide-react";
import { BRAND } from "../data/questions";
import { BrandMark, WhatsAppIcon } from "./ui";

/**
 * Global footer — brand identity + the required contact strip.
 * The WhatsApp number opens a direct conversation via wa.me.
 */
export default function Footer({ onTeacherAccess }: { onTeacherAccess: () => void }) {
  return (
    <footer className="relative z-10 mt-10 border-t border-[#232d15] bg-[#090c07]/90">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          <BrandMark size={30} glow={false} />
          <div className="leading-tight">
            <p className="font-hud text-[10px] tracking-[0.22em] text-[#8fa06d] uppercase">
              {BRAND}
            </p>
            <p className="text-[13px] font-semibold text-[#cbb894]">
              Grade 4 English · Unit 1 · Lessons 1–5
            </p>
          </div>
        </div>

        {/* Contact strip — required */}
        <div className="flex items-center gap-3 rounded-full border border-[#2a3819] bg-[#0e1209] py-1.5 pr-1.5 pl-4">
          <p className="font-hud text-[11px] font-semibold tracking-widest text-[#e6dcc0] uppercase">
            Eng. Somer Shaheen
          </p>
          <a
            href="tel:0930215022"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#37431f] bg-[#141b0d] px-3 py-1.5 text-[12px] font-bold text-[#cbb894] transition hover:border-[#ffb400] hover:text-[#ffd75e]"
          >
            <Phone className="h-3.5 w-3.5 text-[#ffb400]" />
            Phone: 0930215022
          </a>
          <a
            href="https://wa.me/963930215022"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp with Eng. Somer Shaheen"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1faa53] text-white shadow-[0_0_16px_-4px_rgba(31,170,83,0.8)] transition hover:scale-110 hover:bg-[#25c261]"
          >
            <WhatsAppIcon className="h-4.5 w-4.5" />
          </a>
        </div>

        <button
          onClick={onTeacherAccess}
          className="inline-flex items-center gap-1.5 rounded border border-transparent px-2 py-1 font-hud text-[9px] tracking-[0.2em] text-[#5c6a45] uppercase transition hover:border-[#2a3819] hover:text-[#9aa886]"
        >
          <Lock className="h-3 w-3" />
          Teacher Access
        </button>
      </div>
    </footer>
  );
}
