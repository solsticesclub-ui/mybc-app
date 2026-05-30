"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";

export default function NutritionPage() {
  const router = useRouter();
  const { report, mode, setMode } = useApp();
  const nutrition = report.data!.nutrition;
  const [tab, setTab] = useState("foods");

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push("/hub")} eyebrow="Section 05 · Nutrition" title="How you eat" mode={mode} setMode={setMode} />

      <div className="principle-card">
        <div className="eyebrow">Principle</div>
        <div className="body">{mode === "expert" ? nutrition.principle.expert : nutrition.principle.plain}</div>
      </div>

      <div className="body-tabs">
        {[["foods", "Food groups"], ["rhythm", "Daily rhythm"]].map(([k, label]) => (
          <button key={k} className={`body-tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === "foods" && (
        <div className="food-stack">
          {nutrition.groups.map((g) => (
            <div key={g.label} className={`food-group tone-${g.tone}`} style={{ backgroundColor: "rgb(241,241,241)", borderColor: "rgb(31,33,37)" }}>
              <div className="food-head" style={{ color: "rgb(75,85,99)" }}>
                <div className="food-mark">
                  {g.tone === "eat" && <svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 7.4 L5.6 10.4 L11.5 3.8" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  {g.tone === "limit" && <svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 8 Q4.25 4.5 7 8 T12 8" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" fill="none" /></svg>}
                  {g.tone === "avoid" && <svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.5 3.5 L10.5 10.5 M10.5 3.5 L3.5 10.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" /></svg>}
                </div>
                <div className="food-label" style={{ color: "rgb(75,85,99)" }}>{g.label}</div>
                <div className="food-count">{g.items.length}</div>
              </div>
              <ul className="food-list">{g.items.map((it, i) => <li key={i} style={{ color: "rgb(75,85,99)" }}>{it}</li>)}</ul>
            </div>
          ))}
        </div>
      )}

      {tab === "rhythm" && (
        <div className="rhythm-list">
          {nutrition.rhythm.map((r, i) => (
            <div key={i} className="rhythm-row">
              <div className="time">{r.time}</div>
              <div className="rhythm-dot" />
              <div className="what">{r.what}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
