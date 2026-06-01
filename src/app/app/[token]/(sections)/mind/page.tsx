"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useNav } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";

export default function MindPage() {
  const router = useRouter();
  const nav = useNav();
  const { report, mode, setMode } = useApp();
  const mind = report.data!.mind;
  const [tab, setTab] = useState("signature");

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Section 03 · Mind" title="Your cognitive signature" mode={mode} setMode={setMode} />

      <div className="principle-card">
        <div className="eyebrow">Signature</div>
        <div className="mind-sig">{mind.signature.label}</div>
        <div className="body">{mode === "expert" ? mind.signature.expert : mind.signature.plain}</div>
      </div>

      <div className="body-tabs">
        {[["signature", "Strengths"], ["friction", "Friction"], ["windows", "Windows"]].map(([k, label]) => (
          <button key={k} className={`body-tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === "signature" && (
        <div className="needs-list">
          {mind.strengths.map((s) => (
            <div key={s.n} className="need-card">
              <div className="n">{s.n}</div>
              <div className="body"><div className="title">{s.l}</div></div>
            </div>
          ))}
        </div>
      )}

      {tab === "friction" && (
        <div className="mind-chip-list">
          {mind.friction.map((f, i) => (
            <div key={i} className="mind-chip">
              <svg viewBox="0 0 14 14" width="11" height="11" aria-hidden="true"><path d="M3.5 3.5 L10.5 10.5 M10.5 3.5 L3.5 10.5" stroke="#1f2125" strokeWidth="1.8" strokeLinecap="round" /></svg>
              {f}
            </div>
          ))}
          <div className="mind-never">
            <div className="eyebrow">Never</div>
            <ul>{mind.never.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </div>
        </div>
      )}

      {tab === "windows" && (
        <div className="mind-windows">
          {mind.windows.map((w) => (
            <div key={w.time} className="mind-window">
              <div className="mind-window-time">{w.time}</div>
              <div className="mind-window-body">
                <div className="label">{w.label}</div>
                <div className="note">{w.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
