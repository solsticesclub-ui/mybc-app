"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";

function CareerDetail({ idx, onBack, mode, setMode, onJump }: { idx: number; onBack: () => void; mode: string; setMode: (m: string) => void; onJump: (i: number) => void }) {
  const { report } = useApp();
  const careers = report.data!.careers;
  const c = careers[idx];
  const go = (delta: number) => onJump((idx + delta + careers.length) % careers.length);

  return (
    <div className="page">
      <SectionHeader onBack={onBack} backLabel="Career" eyebrow={`${c.n} of ${String(careers.length).padStart(2, "0")}`} title={c.title} mode={mode} setMode={setMode} />
      <div className="career-detail-blurb">{mode === "expert" ? c.expert : c.plain}</div>
      {mode === "expert" && (
        <div className="career-source-card">
          <div className="eyebrow">Astrological source</div>
          <div className="source-chips" style={{ marginTop: 8 }}>{c.sources.map((s) => <span key={s} className="source-chip">{s}</span>)}</div>
        </div>
      )}
      <div className="career-section">
        <div className="eyebrow">In practice</div>
        <ul className="strength-list" style={{ marginTop: 8 }}>{c.practice.map((p, i) => <li key={i}>{p}</li>)}</ul>
      </div>
      <div className="career-nav-row">
        <button className="career-nav-btn" onClick={() => go(-1)}>← Prev</button>
        <button className="career-nav-btn primary" onClick={() => go(1)}>Next →</button>
      </div>
    </div>
  );
}

export default function CareerPage() {
  const router = useRouter();
  const { report, mode, setMode } = useApp();
  const { careers, career_mission } = report.data!;
  const [detail, setDetail] = useState<number | null>(null);

  if (detail !== null) {
    return <CareerDetail idx={detail} onBack={() => setDetail(null)} onJump={(next) => setDetail(next)} mode={mode} setMode={setMode} />;
  }

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push("/hub")} eyebrow="Section 09 · Career & Mission" title="What you're built to build" mode={mode} setMode={setMode} />
      <div className="mission-card">
        <div className="eyebrow">Your mission</div>
        <div className="mission-body">{mode === "expert" ? career_mission.expert : career_mission.plain}</div>
      </div>
      <div className="career-list-label">Top {careers.length} pathways</div>
      <div className="career-list">
        {careers.map((c, i) => (
          <button key={c.n} className="career-row" onClick={() => setDetail(i)}>
            <div className="n">{c.n}</div>
            <div className="body">
              <div className="title">{c.title}</div>
              <div className="sub">{c.sub}</div>
            </div>
            <div className="arrow">→</div>
          </button>
        ))}
      </div>
    </div>
  );
}
