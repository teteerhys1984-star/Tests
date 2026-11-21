import React from 'react'
import { Sparkles, Phone } from 'lucide-react'

export const ContactFooter: React.FC = () => {
  const whatsappUrl = 'https://wa.me/963930215022'

  return (
    <footer className="mt-10 border-t-2 border-pink-200/80 bg-gradient-to-r from-pink-50/95 via-white to-purple-50/95 py-5 px-4 shadow-inner">
      <div className="mx-auto flex max-w-4xl flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-medium text-purple-700">
              تصميم وتطوير المنصة التعليمية التفاعلية
            </p>
            <p className="text-sm sm:text-base font-bold text-purple-950">
              المهندس سومر شاهين
            </p>
          </div>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="تواصل عبر واتساب مع المهندس سومر شاهين 0930215022"
          className="group inline-flex items-center gap-2.5 rounded-full border-2 border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-900 shadow-xs transition hover:border-emerald-400 hover:bg-emerald-50 active:scale-95"
        >
          {/* Official crisp WhatsApp SVG Logo */}
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xs transition group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-current"
              aria-hidden="true"
            >
              <path d="M12.031 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 0 0 1.333 4.993L2 22l5.233-1.237a9.994 9.994 0 0 0 4.779 1.217h.004c5.505 0 9.988-4.478 9.989-9.984 0-2.669-1.037-5.176-2.922-7.062A9.935 9.935 0 0 0 12.031 2M12.035 20.348h-.003a8.32 8.32 0 0 1-4.242-1.161l-.304-.18-3.156.746.76-3.076-.198-.315a8.313 8.313 0 0 1-1.27-4.426c.002-4.593 3.74-8.33 8.335-8.33 2.226 0 4.318.868 5.891 2.443a8.282 8.282 0 0 1 2.438 5.892c-.002 4.594-3.74 8.407-8.251 8.407zm4.573-6.238c-.25-.125-1.482-.731-1.711-.815-.23-.083-.396-.125-.563.125-.167.25-.646.815-.792.982-.146.167-.292.188-.542.063-.25-.125-1.055-.389-2.01-1.24-.743-.662-1.244-1.481-1.39-1.731-.146-.25-.015-.385.11-.51.112-.112.25-.292.375-.438.125-.146.167-.25.25-.417.083-.167.042-.313-.021-.438-.063-.125-.563-1.357-.771-1.858-.203-.487-.409-.421-.563-.429l-.479-.008c-.167 0-.438.063-.667.313-.229.25-.875.855-.875 2.086 0 1.231.896 2.421 1.021 2.588.125.167 1.764 2.694 4.273 3.777.597.258 1.063.412 1.426.527.599.19 1.144.163 1.575.099.48-.072 1.482-.606 1.69-1.191.209-.584.209-1.085.146-1.19-.062-.104-.229-.167-.479-.292z" />
            </svg>
          </span>
          <Phone className="h-3.5 w-3.5 text-emerald-700" />
          <span dir="ltr" className="tracking-wide font-extrabold text-emerald-950">
            0930215022
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
            واتساب مباشر
          </span>
        </a>
      </div>
    </footer>
  )
}
