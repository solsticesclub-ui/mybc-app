"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useNav } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";

export default function SportPage() {
  const router = useRouter();
  const nav = useNav();
  const { report, mode, setMode } = useApp();
  const sport = report.data!.sport;
  const todayDow = new Date().getDay();
  const todayIdx = (todayDow + 6) % 7;
  const [tab, setTab] = useState("week");
  const [selDay, setSelDay] = useState(todayIdx);
  const day = sport.week[selDay];

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Section 06 · Sport" title="How your body moves" mode={mode} setMode={setMode} />

      <div className="principle-card">
        <div className="eyebrow">Philosophy</div>
        <div className="body">{mode === "expert" ? sport.philosophy.expert : sport.philosophy.plain}</div>
      </div>

      <div className="body-tabs">
        {[["week", "Weekly plan"], ["best", "Best for you"], ["avoid", "Avoid"]].map(([k, label]) => (
          <button key={k} className={`body-tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === "week" && (
        <>
          <div className="week-rail">
            {sport.week.map((d, i) => (
              <button key={d.d} className={`week-day ${i === selDay ? "sel" : ""} ${i === todayIdx ? "today" : ""}`} onClick={() => setSelDay(i)}>
                <div className="ruler">{d.m.split(" ")[0]}</div>
                <div className="dow">{d.d}</div>
              </button>
            ))}
          </div>
          <div className="ritual-card">
            <div className="head"><div><div className="eyebrow">{day.d} · {day.m}</div><div className="theme">{day.l}</div></div></div>
            <div className="ritual-body">{day.n}</div>
          </div>
        </>
      )}

      {tab === "best" && (
        <div className="seasonal-list">
          {sport.best.map((s) => (
            <div key={s.l} className="seasonal-row">
              <div className="left"><div className="seasonal-label">{s.l}</div></div>
              <div className="seasonal-detail">{s.n}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "avoid" && (
        <div className="mind-chip-list">
          {sport.avoid.map((a, i) => (
            <div key={i} className="mind-chip">
              <svg viewBox="0 0 14 14" width="11" height="11" aria-hidden="true"><path d="M3.5 3.5 L10.5 10.5 M10.5 3.5 L3.5 10.5" stroke="#1f2125" strokeWidth="1.8" strokeLinecap="round" /></svg>
              {a}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
