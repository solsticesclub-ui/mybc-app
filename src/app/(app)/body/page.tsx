"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";

export default function BodyPage() {
  const router = useRouter();
  const { report, mode, setMode } = useApp();
  const body = report.data!.body;
  const [tab, setTab] = useState("overview");

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push("/hub")} eyebrow="Section 04 · Body" title="Your constitution" mode={mode} setMode={setMode} />

      <div className="body-hero">
        <div className="eyebrow" style={{ color: "rgba(255,255,255,0.55)" }}>Constitution type</div>
        <div className="body-type">{body.constitution}</div>
        <div className="body-blurb">{mode === "expert" ? body.blurb.expert : body.blurb.plain}</div>
      </div>

      <div className="body-tabs">
        {[["overview", "Signals"], ["regions", "Regions"], ["care", "Care"]].map(([k, label]) => (
          <button key={k} className={`body-tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="signals-card">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Active signals</div>
          {body.signals.map((s) => (
            <div key={s.l} className="signal-row">
              <div className="signal-label">{s.l}</div>
              <span className={`signal-badge level-${s.v.toLowerCase()}`}>{s.v}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "regions" && (
        <div className="regions-list">
          {body.regions.map((r) => (
            <div key={r.id} className="region-card">
              <div className="head">
                <div className="label">{r.label}</div>
                <span className={`signal-badge level-${r.priority.toLowerCase()}`}>{r.priority}</span>
              </div>
              <div className="note">{r.note}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "care" && (
        <div className="care-list">
          {body.practices.map((p, i) => (
            <div key={i} className="care-row">
              <div className="n">{String(i + 1).padStart(2, "0")}</div>
              <div className="text">{p}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
