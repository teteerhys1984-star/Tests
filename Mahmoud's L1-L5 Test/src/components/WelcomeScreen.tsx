import { useState } from "react";
import {
  BookOpenCheck,
  ChevronRight,
  Crosshair,
  Radar,
  ShieldCheck,
  Timer,
  UserRound,
  Waypoints,
} from "lucide-react";
import { BRAND, EXAM_SCOPE, EXAM_TITLE, MISSIONS, TOTAL_MARKS } from "../data/questions";
import { BrandMark, HudChip } from "./ui";

function ContourMap() {
  return (
    <svg
      className="contour-lines pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g fill="none" stroke="#3d4d22" strokeWidth="1">
        <path d="M-40,220 C180,160 300,300 520,240 S860,120 1080,220 S1240,180 1320,200" opacity=".6" />
        <path d="M-40,260 C190,200 320,340 540,280 S880,160 1100,260 S1250,220 1320,240" opacity=".45" />
        <path d="M-40,310 C200,250 340,390 560,330 S900,210 1120,310 S1260,270 1330,290" opacity=".3" />
        <path d="M-40,560 C220,500 360,660 600,600 S940,470 1160,580 S1280,540 1340,560" opacity=".5" />
        <path d="M-40,610 C230,550 380,710 620,650 S960,520 1180,630 S1300,590 1350,610" opacity=".35" />
        <ellipse cx="880" cy="330" rx="150" ry="95" strokeDasharray="6 6" stroke="#55682c" opacity=".7" />
        <ellipse cx="880" cy="330" rx="95" ry="58" strokeDasharray="4 5" stroke="#55682c" opacity=".6" />
        <ellipse cx="330" cy="560" rx="120" ry="75" strokeDasharray="6 6" stroke="#44551f" opacity=".6" />
      </g>
      <g stroke="#ffb400" opacity=".5">
        <circle cx="880" cy="330" r="4" fill="#ffb400" stroke="none" />
        <circle cx="330" cy="560" r="3" fill="#ffb400" stroke="none" />
      </g>
    </svg>
  );
}

const RANGES = ["Q 01–13", "Q 14–26", "Q 27–28", "Q 29–32", "Q 33–35"];

export default function WelcomeScreen({
  defaultName,
  onStart,
}: {
  defaultName: string;
  onStart: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [touched, setTouched] = useState(false);
  const valid = name.trim().length >= 3;

  return (
    <div className="tactical-bg relative min-h-screen overflow-hidden">
      <div className="grid-overlay absolute inset-0" aria-hidden="true" />
      <ContourMap />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-4 py-10">
        {/* Brand */}
        <div className="fade-up flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <BrandMark size={66} />
            <span className="zone-ring" aria-hidden="true" />
          </div>
          <p className="font-hud text-[11px] font-bold tracking-[0.42em] text-[#8fa06d] uppercase">
            {BRAND}
          </p>
          <div className="stripe-edge h-1.5 w-40 rounded-full" aria-hidden="true" />
        </div>

        {/* Briefing card */}
        <div
          className="hud-panel hud-corners fade-up mt-6 w-full max-w-3xl rounded-xl"
          style={{ animationDelay: "0.08s" }}
        >
          <div className="border-b border-[#232d15] px-6 py-4 text-center sm:px-10">
            <div className="mb-2 flex items-center justify-center gap-2">
              <HudChip icon={<Crosshair className="h-3.5 w-3.5" />} tone="amber">
                Mission Briefing
              </HudChip>
            </div>
            <h1 className="font-hud text-2xl font-black tracking-wide text-[#f4ecd4] uppercase sm:text-3xl">
              {EXAM_TITLE}
            </h1>
            <p className="font-hud mt-1.5 text-[12px] font-semibold tracking-[0.3em] text-[#ffb400] uppercase">
              {EXAM_SCOPE}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <HudChip icon={<Radar className="h-3.5 w-3.5" />}>35 Questions</HudChip>
              <HudChip icon={<Waypoints className="h-3.5 w-3.5" />}>{TOTAL_MARKS} Marks</HudChip>
              <HudChip icon={<BookOpenCheck className="h-3.5 w-3.5" />}>13 Vocabulary Drops</HudChip>
              <HudChip icon={<Timer className="h-3.5 w-3.5" />}>Timed Mission</HudChip>
            </div>
          </div>

          {/* Mission list */}
          <div className="grid gap-2 px-6 py-5 sm:grid-cols-2 sm:px-10">
            {MISSIONS.map((m, i) => (
              <div
                key={m.no}
                className="flex items-start gap-3 rounded-md border border-[#232d15] bg-[#0d120a]/70 p-3"
              >
                <span className="font-hud mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[#b58500] bg-[#221a03] text-[11px] font-black text-[#ffb400]">
                  {String(m.no).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="font-hud text-[11px] font-bold tracking-[0.18em] text-[#e6dcc0] uppercase">
                    {m.name}
                    <span className="ml-2 text-[9px] font-medium tracking-widest text-[#5c6a45]">
                      {RANGES[i]}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[13.5px] leading-snug font-medium text-[#9aa886]">
                    {m.blurb}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3 rounded-md border border-[#3d4d22] bg-[#141b0d]/80 p-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#8fbf5f]" />
              <p className="text-[13.5px] leading-snug font-medium text-[#a9c37e]">
                Your answers auto-save. Answer every question to unlock
                <span className="font-bold text-[#ffd75e]"> Submit Exam</span>.
              </p>
            </div>
          </div>

          {/* Callsign form */}
          <div className="border-t border-[#232d15] px-6 py-5 sm:px-10">
            <label
              htmlFor="student-name"
              className="font-hud mb-2 flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-[#cbb894] uppercase"
            >
              <UserRound className="h-4 w-4 text-[#ffb400]" />
              Recruit Name — enter your full name to deploy
            </label>
            <input
              id="student-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              onKeyDown={(e) => e.key === "Enter" && valid && onStart(name.trim())}
              placeholder="e.g. Ahmad Saleh Haddad"
              autoComplete="name"
              className="tac-input w-full rounded-md px-4 py-3 text-[17px] font-semibold tracking-wide"
            />
            {touched && !valid && (
              <p className="mt-1.5 text-[13px] font-semibold text-[#ff8d7e]">
                Please enter your full name (at least 3 letters) before starting.
              </p>
            )}
            <button
              type="button"
              disabled={!valid}
              onClick={() => onStart(name.trim())}
              className="btn-primary mt-4 flex w-full items-center justify-center gap-2 rounded-md px-6 py-3.5 text-[13px] font-black"
            >
              Start Exam
              <ChevronRight className="h-4 w-4" />
            </button>
            <p className="mt-2 text-center text-[12.5px] font-medium text-[#5c6a45]">
              The mission stopwatch starts the moment you press Start Exam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
