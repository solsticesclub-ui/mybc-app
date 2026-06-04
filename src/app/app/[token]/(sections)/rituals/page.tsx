"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useNav } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";

export default function RitualsPage() {
  const router = useRouter();
  const nav = useNav();
  const { report } = useApp();
  const { rituals_days, rituals_seasonal } = report.data!;
  const todayDow = new Date().getDay();
  const todayIdx = (todayDow + 6) % 7;
  const [selectedIdx, setSelectedIdx] = useState(todayIdx);
  const day = rituals_days[selectedIdx];

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Section 08 · Rituals" title="Anchors of the week" />

      <div className="week-rail">
        {rituals_days.map((d, i) => {
          const isSel = i === selectedIdx;
          const isToday = i === todayIdx;
          return (
            <button key={d.day} className={`week-day ${isSel ? "sel" : ""} ${isToday ? "today" : ""}`} onClick={() => setSelectedIdx(i)}>
              <div className="ruler">{d.ruler}</div>
              <div className="dow">{d.day.slice(0, 3)}</div>
            </button>
          );
        })}
      </div>

      <div className="ritual-card">
        <div className="head">
          <div>
            <div className="eyebrow">{day.day} · {day.ruler}</div>
            <div className="theme">{day.label}</div>
          </div>
        </div>
        <div className="ritual-body">{day.ritual}</div>
      </div>

      <div className="ritual-section-label">Seasonal anchors</div>
      <div className="seasonal-list">
        {rituals_seasonal.map((r) => (
          <div key={r.label} className="seasonal-row">
            <div className="left">
              <div className="seasonal-label">{r.label}</div>
              <div className="seasonal-cadence">{r.cadence}</div>
            </div>
            <div className="seasonal-detail">{r.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
