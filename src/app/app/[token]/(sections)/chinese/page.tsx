"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useNav } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";

export default function ChinesePage() {
  const router = useRouter();
  const nav = useNav();
  const { report } = useApp();
  const chinese = report.data?.chinese;
  const [tab, setTab] = useState("type");

  if (!chinese) return (
    <div className="page">
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Section 15 · Chinese" title="BaZi & animal sign" />
      <p style={{ padding: "24px 0", color: "var(--ink-soft)", fontSize: 14 }}>This section is still being generated. Check back in a moment.</p>
    </div>
  );

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Section 13 · Chinese" title="BaZi reading" />

      <div className="chinese-hero">
        <div className="ch-pillars">
          <div className="ch-pillar"><div className="k">Animal</div><div className="v">{chinese.animal}</div></div>
          <div className="ch-pillar"><div className="k">Element</div><div className="v">{chinese.element}</div></div>
          <div className="ch-pillar"><div className="k">Polarity</div><div className="v">{chinese.polarity}</div></div>
        </div>
        <div className="ch-range">Year of the {chinese.polarity} {chinese.element} {chinese.animal} · {chinese.range}</div>
      </div>

      <div className="body-tabs">
        {[["type", "Archetype"], ["tcm", "TCM body"], ["years", "5-year arc"]].map(([k, label]) => (
          <button key={k} className={`body-tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === "type" && (
        <>
          <div className="principle-card">
            <div className="eyebrow">{chinese.polarity} {chinese.element} {chinese.animal}</div>
            <div className="body">{chinese.archetype.plain}</div>
          </div>
          <div className="needs-list">
            {chinese.traits.map((t, i) => (
              <div key={i} className="need-card">
                <div className="n">{String(i + 1).padStart(2, "0")}</div>
                <div className="body"><div className="title">{t}</div></div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "tcm" && (
        <>
          <div className="seasonal-list">
            {chinese.tcm.map((t) => (
              <div key={t.organ} className="seasonal-row">
                <div className="left">
                  <div className="seasonal-label">{t.organ}</div>
                  <div className="seasonal-cadence">{t.el}</div>
                </div>
                <div className="seasonal-detail">{t.note}</div>
              </div>
            ))}
          </div>
          <div className="emotion-grid">
            <div className="eyebrow" style={{ marginBottom: 8 }}>How emotion lives in the body</div>
            {chinese.emotions.map((e, i) => (
              <div key={i} className="emotion-row">
                <div className="e">{e.e}</div>
                <div className="arrow">→</div>
                <div className="o">{e.o}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "years" && (
        <div className="year-list">
          {chinese.years.map((y) => (
            <div key={y.y} className={`year-row tone-${y.tone}`}>
              <div className="year-y">{y.y}</div>
              <div className="year-body">
                <div className="year-name">{y.name}</div>
                <div className="year-note">{y.n}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
