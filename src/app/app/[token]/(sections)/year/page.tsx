"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useNav } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";

export default function YearPage() {
  const router = useRouter();
  const nav = useNav();
  const { report } = useApp();
  const year_months = report.data?.year_months;
  const year_windows = report.data?.year_windows;
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!year_months?.length || !year_windows) return (
    <div className="page">
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Section 12 · Year ahead" title="Next twelve months" />
      <p style={{ padding: "24px 0", color: "var(--ink-soft)", fontSize: 14 }}>This section is still being generated. Check back in a moment.</p>
    </div>
  );

  const m = year_months[selectedIdx];

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Section 12 · Year ahead" title="Next twelve months" />

      <div className="year-strip">
        {year_months.map((mm, i) => {
          const isSel = i === selectedIdx;
          return (
            <button key={i} className={`year-month ${isSel ? "sel" : ""}`} onClick={() => setSelectedIdx(i)} style={{ "--mcolor": mm.color } as React.CSSProperties}>
              <div className="month-tag">
                <div className="m">{mm.m}</div>
                <div className="y">&apos;{mm.y}</div>
              </div>
              <div className="theme">{mm.theme}</div>
              <div className="bars">
                <div className="bar" style={{ height: `${10 + mm.energy * 6}%` }} />
                <div className="bar" style={{ height: `${10 + mm.business * 6}%` }} />
                <div className="bar" style={{ height: `${10 + mm.body * 6}%` }} />
                <div className="bar" style={{ height: `${10 + mm.love * 6}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="year-detail" style={{ background: "rgb(31,33,37)" }}>
        <div className="head">
          <div>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,0.55)" }}>{m.m} {m.y < 100 ? `20${m.y}` : m.y}</div>
            <div className="theme">{m.theme}</div>
          </div>
          <div className="transit-badge">{m.transit}</div>
        </div>
        <div className="body">{m.plain}</div>
        <div className="legend">
          {(["Energy", "Business", "Body", "Love"] as const).map((label, i) => {
            const value = [m.energy, m.business, m.body, m.love][i];
            return (
              <div key={label} className="legend-item">
                <div className="legend-label">{label}</div>
                <div className="legend-bar"><div className="fill" style={{ width: `${value * 10}%`, backgroundColor: "rgb(255,255,255)" }} /></div>
                <div className="legend-val">{value}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="windows-section">
        <div className="eyebrow" style={{ marginBottom: 8, paddingLeft: 4 }}>Key windows</div>
        <div className="windows-list">
          {year_windows.map((w) => (
            <div key={w.label} className="window-card">
              <div className="window-label">{w.label}</div>
              <div className="window-range">{w.range}</div>
              <div className="window-detail">{w.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
