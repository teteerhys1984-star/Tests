import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-[#c6ebd3] bg-white/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2.5 px-4 py-4 sm:flex-row sm:px-6">
        <p className="text-xs font-semibold text-[#3f6a52]">
          Grade 3 English Curriculum Exam · Unit 1 (Lessons 1–5)
        </p>

        <div className="inline-flex flex-wrap items-center justify-center gap-2.5 rounded-full border border-[#bce8cc] bg-[#eefbf2] px-4 py-1.5 text-sm shadow-xs">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xs"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 fill-current"
              focusable="false"
            >
              <path d="M20.52 3.48A11.82 11.82 0 0 0 12.06 0C5.53 0 .22 5.31.22 11.84c0 2.09.55 4.12 1.58 5.92L0 24l6.41-1.68a11.8 11.8 0 0 0 5.65 1.44h.01c6.53 0 11.84-5.31 11.84-11.84 0-3.16-1.23-6.14-3.39-8.44ZM12.07 21.76h-.01a9.84 9.84 0 0 1-5.01-1.37l-.36-.21-3.81 1 1.02-3.71-.24-.38a9.82 9.82 0 0 1-1.51-5.25c0-5.43 4.42-9.85 9.86-9.85 2.63 0 5.1 1.03 6.96 2.89a9.78 9.78 0 0 1 2.88 6.96c0 5.44-4.42 9.92-9.78 9.92Zm5.4-7.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.76.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.19 5.07 4.48.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.24-.69.24-1.29.17-1.41-.08-.12-.27-.2-.57-.35Z" />
            </svg>
          </span>

          <span
            lang="ar"
            dir="rtl"
            className="font-arabic-contact font-bold text-[#0f3d24]"
          >
            المهندس سومر شاهين
          </span>

          <span className="text-[#86cf9f]" aria-hidden="true">
            •
          </span>

          <a
            href="https://wa.me/963930215022"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-extrabold tracking-wide text-[#15803d] underline decoration-[#86efac] decoration-2 underline-offset-2 transition-colors hover:text-[#0f3d24] hover:decoration-[#22c55e]"
            aria-label="Contact on WhatsApp at 0930215022"
          >
            0930215022
          </a>
        </div>
      </div>
    </footer>
  );
};
