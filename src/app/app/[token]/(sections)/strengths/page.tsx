"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useNav } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";

export default function StrengthsPage() {
  const router = useRouter();
  const nav = useNav();
  const { report } = useApp();
  const strengths = report.data!.strengths;
  const [idx, setIdx] = useState(0);
  const total = strengths.length;
  const s = strengths[idx];
  const go = (n: number) => setIdx((idx + n + total) % total);

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Section 02 · Self" title="Strengths" />

      <div className="strength-stack">
        <div className="strength-back back2" aria-hidden="true" />
        <div className="strength-back back1" aria-hidden="true" />
        <div className="strength-card">
          <div className="eyebrow" style={{ color: "var(--ink-faint)" }}>{s.tag}</div>
          <div className="strength-title">{s.title}</div>
          <div className="strength-blurb">{s.blurb}</div>
          <div className="strength-divider" />
          <div className="strength-section">
            <div className="strength-label">In practice</div>
            <ul className="strength-list">{s.practice.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </div>
          <div className="strength-section">
            <div className="strength-label">Activated by</div>
            <div className="strength-body">{s.activated}</div>
          </div>

        </div>
      </div>

      <div className="carousel-controls">
        <button className="carousel-btn" onClick={() => go(-1)} aria-label="Previous">←</button>
        <div className="carousel-dots">
          {strengths.map((_, i) => (
            <button key={i} className={`dot ${i === idx ? "active" : ""}`} onClick={() => setIdx(i)} aria-label={`Card ${i + 1}`} />
          ))}
        </div>
        <button className="carousel-btn" onClick={() => go(1)} aria-label="Next">→</button>
      </div>
      <div className="carousel-counter">{idx + 1} / {total}</div>
    </div>
  );
}
