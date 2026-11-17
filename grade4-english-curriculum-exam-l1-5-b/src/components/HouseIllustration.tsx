import React from 'react';

/**
 * Clean cutaway house illustration matching Grade 4 Pupil's Book p. 14 Exercise 8:
 * - Two bedrooms (top-left room with two beds & wardrobe; bottom-right room with one bed & wardrobe)
 * - One kitchen (middle-left with oven, sink, refrigerator)
 * - One living room (middle-right with TV, lamp, two armchairs)
 * - One bathroom (bottom-left with bathtub & sink)
 * - One study corner & balcony (top-right)
 * - Plain pavement outside: no garden and no trees.
 */
export const HouseIllustration: React.FC = () => {
  return (
    <div className="my-4 rounded-2xl border-2 border-sky-200 bg-gradient-to-b from-sky-50 to-white p-4">
      <div className="flex flex-col items-center">
        <svg
          viewBox="0 0 360 250"
          className="w-full max-w-md h-auto"
          role="img"
          aria-label="Cutaway picture of a house with two bedrooms, one kitchen, one living room, one bathroom, a study with a balcony, and no garden or trees outside."
        >
          {/* Sky backdrop */}
          <rect x="0" y="0" width="360" height="232" rx="14" fill="#f0f9ff" />
          {/* Plain ground line — no garden, no trees */}
          <rect x="20" y="226" width="320" height="8" rx="4" fill="#cbd5e1" />

          {/* Pitched roof */}
          <polygon
            points="68,42 180,14 268,38 268,96 68,96"
            fill="#faf5ff"
            stroke="#334155"
            strokeWidth="2.5"
          />
          <line x1="180" y1="14" x2="180" y2="96" stroke="#334155" strokeWidth="2.2" />

          {/* Top-left: Bedroom 1 (wardrobe + 2 pink beds) */}
          <rect x="74" y="54" width="22" height="40" rx="2" fill="#f43f5e" stroke="#881337" strokeWidth="1.5" />
          <line x1="85" y1="54" x2="85" y2="94" stroke="#881337" strokeWidth="1.2" />
          <rect x="104" y="72" width="28" height="22" rx="4" fill="#fb7185" stroke="#881337" strokeWidth="1.4" />
          <rect x="142" y="72" width="28" height="22" rx="4" fill="#fb7185" stroke="#881337" strokeWidth="1.4" />
          <circle cx="137" cy="69" r="4" fill="#facc15" />
          <text x="124" y="48" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#6b21a8">
            Bedroom 1
          </text>

          {/* Top-right: Study + Balcony */}
          <rect x="196" y="76" width="34" height="18" fill="#e2e8f0" stroke="#334155" strokeWidth="1.4" />
          <rect x="203" y="63" width="20" height="13" rx="2" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.4" />
          {/* Balcony */}
          <rect x="268" y="74" width="34" height="22" fill="#ffffff" stroke="#334155" strokeWidth="1.8" />
          <line x1="276" y1="74" x2="276" y2="96" stroke="#64748b" strokeWidth="1.4" />
          <line x1="285" y1="74" x2="285" y2="96" stroke="#64748b" strokeWidth="1.4" />
          <line x1="294" y1="74" x2="294" y2="96" stroke="#64748b" strokeWidth="1.4" />

          {/* Middle floor: Kitchen (left) + Living Room (right) */}
          <rect x="68" y="96" width="112" height="65" fill="#fef9c3" stroke="#334155" strokeWidth="2.2" />
          <rect x="180" y="96" width="122" height="65" fill="#ffedd5" stroke="#334155" strokeWidth="2.2" />

          {/* Kitchen items: oven, counter/sink, fridge */}
          <rect x="74" y="132" width="26" height="27" rx="2" fill="#94a3b8" stroke="#334155" strokeWidth="1.4" />
          <rect x="79" y="140" width="16" height="13" rx="1" fill="#fde68a" />
          <rect x="102" y="132" width="42" height="27" fill="#0284c7" stroke="#0c4a6e" strokeWidth="1.4" />
          <rect x="148" y="114" width="24" height="45" rx="3" fill="#ffffff" stroke="#334155" strokeWidth="1.5" />
          <line x1="148" y1="134" x2="172" y2="134" stroke="#334155" strokeWidth="1.3" />
          <text x="115" y="111" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#854d0e">
            Kitchen
          </text>

          {/* Living Room items: TV, 2 armchairs, lamp */}
          <rect x="188" y="136" width="22" height="15" rx="2" fill="#475569" />
          <rect x="190" y="151" width="18" height="9" fill="#f97316" />
          <rect x="220" y="136" width="32" height="23" rx="5" fill="#10b981" stroke="#065f46" strokeWidth="1.4" />
          <rect x="264" y="136" width="28" height="23" rx="5" fill="#10b981" stroke="#065f46" strokeWidth="1.4" />
          <line x1="258" y1="126" x2="258" y2="159" stroke="#78350f" strokeWidth="1.6" />
          <polygon points="251,126 265,126 262,117 254,117" fill="#facc15" />
          <text x="242" y="111" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#9a3412">
            Living Room
          </text>

          {/* Ground floor: Bathroom (left) + Bedroom 2 (right) */}
          <rect x="68" y="161" width="112" height="65" fill="#ffe4e6" stroke="#334155" strokeWidth="2.2" />
          <rect x="180" y="161" width="122" height="65" fill="#ecfccb" stroke="#334155" strokeWidth="2.2" />

          {/* Bathroom items: bathtub + sink */}
          <rect x="74" y="202" width="58" height="22" rx="4" fill="#ffffff" stroke="#e11d48" strokeWidth="1.8" />
          <rect x="150" y="198" width="20" height="26" rx="3" fill="#ffffff" stroke="#334155" strokeWidth="1.4" />
          <text x="122" y="177" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#9f1239">
            Bathroom
          </text>

          {/* Bedroom 2 items: green bed + wardrobe */}
          <rect x="188" y="201" width="62" height="23" rx="4" fill="#22c55e" stroke="#14532d" strokeWidth="1.5" />
          <rect x="190" y="196" width="14" height="7" rx="2" fill="#ffffff" stroke="#334155" strokeWidth="1.1" />
          <rect x="272" y="178" width="22" height="46" rx="2" fill="#f97316" stroke="#7c2d12" strokeWidth="1.5" />
          <text x="228" y="177" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#3f6212">
            Bedroom 2
          </text>
        </svg>
        <p className="mt-2 text-xs font-semibold text-slate-600 text-center">
          House rooms shown: 2 bedrooms · 1 kitchen · 1 living room · 1 bathroom · outside: no garden, no trees
        </p>
      </div>
    </div>
  );
};
