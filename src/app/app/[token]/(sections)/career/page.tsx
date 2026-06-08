"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useNav } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";

function CareerDetail({ idx, onBack, onJump }: { idx: number; onBack: () => void; onJump: (i: number) => void }) {
  const { report } = useApp();
  const careers = report.data?.careers ?? [];
  const c = careers[idx];
  const go = (delta: number) => onJump((idx + delta + careers.length) % careers.length);

  return (
    <div className="page">
      <SectionHeader onBack={onBack} backLabel="Career" eyebrow={`${c.n} of ${String(careers.length).padStart(2, "0")}`} title={c.title} />
      <div className="career-detail-blurb">{c.plain}</div>
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
  const nav = useNav();
  const { report } = useApp();
  const careers = report.data?.careers;
  const career_mission = report.data?.career_mission;
  const [detail, setDetail] = useState<number | null>(null);

  if (!careers || !career_mission) return (
    <div className="page">
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Section 09 · Career & Mission" title="What you're built to build" />
      <p style={{ padding: "24px 0", color: "var(--ink-soft)", fontSize: 14 }}>This section is still being generated. Check back in a moment.</p>
    </div>
  );

  if (detail !== null) {
    return <CareerDetail idx={detail} onBack={() => setDetail(null)} onJump={(next) => setDetail(next)} />;
  }

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Section 09 · Career & Mission" title="What you're built to build" />
      <div className="mission-card">
        <div className="eyebrow">Your mission</div>
        <div className="mission-body">{career_mission.plain}</div>
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
