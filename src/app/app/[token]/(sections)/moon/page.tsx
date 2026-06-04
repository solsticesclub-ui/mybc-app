"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNav } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";
import MoonGlyph from "@/components/ui/MoonGlyph";
import { buildMoonDays } from "@/lib/moon";

const MOON_WEEK_BASE = Date.UTC(2026, 4, 25);
const MOON_DAYS = buildMoonDays(MOON_WEEK_BASE, 28);
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const MOON_DAY_NOTES = [
  { sign: "Gemini", do: "Write. Talk. Cross-pollinate.", avoid: "Closed rooms. Silence." },
  { sign: "Cancer", do: "Nest. Cook. Tend the inner.", avoid: "Crowds. Bright lights." },
  { sign: "Leo", do: "Show up. Be seen.", avoid: "Self-shrinking." },
  { sign: "Virgo", do: "Tidy systems. Refine.", avoid: "Big new commitments." },
];

const weeks = [0, 1, 2, 3].map((w) => MOON_DAYS.slice(w * 7, w * 7 + 7));

export default function MoonPage() {
  const router = useRouter();
  const nav = useNav();
  const [selectedIdx, setSelectedIdx] = useState(2);
  const day = MOON_DAYS[selectedIdx];
  const note = MOON_DAY_NOTES[selectedIdx % MOON_DAY_NOTES.length];

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Section 11 · Moon" title="Next four weeks" />

      <div className="moon-weeks">
        {weeks.map((week, wi) => (
          <div key={wi} className="moon-week">
            <div className="moon-week-label">Week {wi + 1}</div>
            <div className="moon-week-grid">
              {week.map((d, di) => {
                const globalIdx = wi * 7 + di;
                const isSel = globalIdx === selectedIdx;
                return (
                  <button key={di} className={`moon-day ${isSel ? "sel" : ""}`} onClick={() => setSelectedIdx(globalIdx)}>
                    <div className="dow">{DAY_LABELS[di]}</div>
                    <div className="glyph">
                      <MoonGlyph phase={d.phase} size={20} dark={isSel ? "#1a1f2e" : "#2a3142"} lit={isSel ? "#ffffff" : "#e7e7e2"} stroke={isSel ? "rgba(255,255,255,0.55)" : null} />
                    </div>
                    <div className="num">{new Date(d.date).getDate()}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="moon-day-card">
        <div className="head">
          <div>
            <div className="eyebrow">{new Date(day.date).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}</div>
            <div className="title">Moon in {note.sign} · {day.phaseName.toLowerCase()}</div>
          </div>
          <MoonGlyph phase={day.phase} size={40} />
        </div>
        <div className="score-grid">
          {Object.entries(day.scores).map(([label, value]) => (
            <div key={label} className="score-row">
              <div className="score-label">{label}</div>
              <div className="score-bar"><div className="score-fill" style={{ width: `${value * 10}%` }} /></div>
              <div className="score-val">{value}</div>
            </div>
          ))}
        </div>
        <div className="moon-divider" />
        <div className="moon-advice">
          <div className="advice-row"><span className="advice-label">Do</span><span>{note.do}</span></div>
          <div className="advice-row"><span className="advice-label">Avoid</span><span>{note.avoid}</span></div>
        </div>

      </div>
    </div>
  );
}
