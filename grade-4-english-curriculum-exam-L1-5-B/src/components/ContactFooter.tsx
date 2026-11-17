import React from 'react';

export const ContactFooter: React.FC = () => {
  return (
    <footer className="mt-10 border-t-2 border-cyan-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 text-white shadow-sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-sm font-bold text-slate-600">
            Grade 4 English Curriculum Exam · Unit 1 (Lessons 1–5)
          </span>
        </div>

        <a
          href="https://wa.me/963930215022"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp 0930215022"
          className="group inline-flex items-center gap-3 rounded-full border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-teal-50 px-4 py-2 shadow-sm transition hover:border-emerald-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
        >
          {/* Official-style WhatsApp Logo SVG */}
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-transform group-hover:scale-105">
            <svg viewBox="0 0 32 32" className="h-4.5 w-4.5 fill-current" aria-hidden="true">
              <path d="M19.11 17.21c-.28-.14-1.64-.81-1.9-.9-.25-.09-.44-.14-.62.14-.19.28-.72.9-.88 1.09-.16.19-.32.21-.6.07-.28-.14-1.18-.43-2.24-1.38-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.32.42-.49.14-.16.19-.28.28-.46.09-.19.05-.35-.02-.49-.07-.14-.62-1.5-.85-2.06-.22-.54-.45-.47-.62-.48h-.53c-.19 0-.49.07-.74.35-.25.28-.97.95-.97 2.32 0 1.37 1 2.69 1.14 2.88.14.19 1.96 2.99 4.75 4.19.66.29 1.18.46 1.58.59.66.21 1.27.18 1.75.11.53-.08 1.64-.67 1.87-1.32.23-.65.23-1.21.16-1.32-.07-.11-.25-.18-.53-.32z" />
              <path d="M16.02 3.2c-7.05 0-12.78 5.73-12.78 12.78 0 2.25.59 4.45 1.71 6.39L3.14 28.8l6.6-1.73a12.74 12.74 0 0 0 6.28 1.68h.01c7.04 0 12.77-5.73 12.77-12.78 0-3.41-1.33-6.62-3.74-9.04a12.69 12.69 0 0 0-9.04-3.73zm0 23.39h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.92 1.03 1.05-3.82-.25-.39a10.57 10.57 0 0 1-1.63-5.63c0-5.85 4.76-10.61 10.62-10.61 2.83 0 5.5 1.1 7.5 3.11a10.55 10.55 0 0 1 3.1 7.51c0 5.85-4.76 10.61-10.67 10.61z" />
            </svg>
          </span>

          <span className="flex flex-wrap items-center gap-2 text-sm">
            <span lang="ar" dir="rtl" className="ar-contact font-extrabold text-slate-800 text-base">
              المهندس سومر شاهين
            </span>
            <span className="text-emerald-300 font-bold" aria-hidden="true">
              •
            </span>
            <span className="font-extrabold tracking-wide text-emerald-700 underline decoration-emerald-300 decoration-2 underline-offset-2 group-hover:text-emerald-800">
              0930215022
            </span>
          </span>
        </a>
      </div>
    </footer>
  );
};
