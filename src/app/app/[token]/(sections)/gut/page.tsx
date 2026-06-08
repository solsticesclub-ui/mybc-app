"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useNav } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";

export default function GutPage() {
  const router = useRouter();
  const nav = useNav();
  const { report } = useApp();
  const gut = report.data?.gut;
  const [tab, setTab] = useState("rituals");

  if (!gut) return (
    <div className="page">
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Section 14 · Gut" title="Your #1 health axis" />
      <p style={{ padding: "24px 0", color: "var(--ink-soft)", fontSize: 14 }}>This section is still being generated. Check back in a moment.</p>
    </div>
  );

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Section 14 · Gut" title="Your #1 health axis" />

      <div className="principle-card">
        <div className="eyebrow">Why this matters</div>
        <div className="body">{gut.principle.plain}</div>
      </div>

      <div className="body-tabs">
        {[["rituals", "Daily"], ["warnings", "Warning signs"], ["reset", "48 h reset"]].map(([k, label]) => (
          <button key={k} className={`body-tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === "rituals" && (
        <div className="rhythm-list">
          {gut.rituals.map((r, i) => (
            <div key={i} className="rhythm-row">
              <div className="time">{r.time}</div>
              <div className="rhythm-dot" />
              <div className="what">{r.what}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "warnings" && (
        <div className="warning-grid">
          {gut.warnings.map((w, i) => (
            <div key={i} className="warning-card">
              <div className="warning-dot" />
              <div>{w}</div>
            </div>
          ))}
          <div className="warning-foot">If two or more show up together: pull the brake. Clear 48 hours. Move to the reset protocol.</div>
        </div>
      )}

      {tab === "reset" && (
        <>
          <div className="reset-card">
            <div className="eyebrow">48 hours when things go sideways</div>
            <div className="reset-list">
              {gut.reset48.map((r, i) => (
                <div key={i} className="reset-row">
                  <div className="l">{r.l}</div>
                  <div className="n">{r.n}</div>
                </div>
              ))}
            </div>
            <div className="reset-note">Usually resets in 3–5 days.</div>
          </div>
          <div className="ritual-section-label">Long-term testing</div>
          <div className="seasonal-list">
            {gut.testing.map((t, i) => (
              <div key={i} className="seasonal-row">
                <div className="left">
                  <div className="seasonal-label">{t.l}</div>
                  <div className="seasonal-cadence">{t.cadence}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="reset-disclaimer">Discuss all of this with a functional medicine practitioner who knows your history.</div>
        </>
      )}
    </div>
  );
}
