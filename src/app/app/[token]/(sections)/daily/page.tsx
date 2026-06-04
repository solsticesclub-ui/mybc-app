"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useNav } from "../AppShell";
import { todayKey } from "@/lib/moon";

function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [v, setV] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : JSON.parse(raw);
    } catch { return initial; }
  });
  function set(next: T | ((p: T) => T)) {
    setV((prev) => {
      const val = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
      return val;
    });
  }
  return [v, set];
}

export default function DailyPage() {
  const router = useRouter();
  const nav = useNav();
  const { report } = useApp();
  const protocol = report.data!.daily_protocol;
  const [phase, setPhase] = useState("morning");
  const dateKey = todayKey();
  const [checks, setChecks] = useLocalStorage<Record<string, boolean>>(`mybc.daily.${dateKey}`, {});

  const phaseData = protocol[phase];
  const phaseKeys = ["morning", "day", "evening"].filter((k) => protocol[k]);
  const total = phaseData.items.length;
  const done = phaseData.items.filter((_, i) => checks[`${phase}-${i}`]).length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  function toggle(key: string) {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="page">
      <div className="header-row" style={{ alignItems: "flex-start" }}>
        <div className="greeting">
          <button className="page-back" onClick={() => router.push(nav("hub"))}>← Hub</button>
          <div className="eyebrow" style={{ marginTop: 4 }}>Section 07 · Daily</div>
          <div className="h2" style={{ marginTop: 2 }}>Your day, mapped</div>
        </div>
      </div>

      <div className="phase-tabs">
        {phaseKeys.map((key) => {
          const d = protocol[key];
          return (
            <button key={key} className={`phase-tab ${phase === key ? "active" : ""}`} onClick={() => setPhase(key)}>
              <div className="label">{d.label}</div>
              <div className="time">{d.start}</div>
            </button>
          );
        })}
      </div>

      <div className="progress">
        <div className="count">{done}<span style={{ color: "var(--ink-faint)", fontSize: 14, fontWeight: 600 }}>/{total}</span></div>
        <div className="meta">
          <div className="label">{phaseData.label} routine</div>
          <div className="bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      <div style={{ background: "var(--paper-dim)", borderRadius: 14, padding: "14px 16px", marginBottom: 4, fontSize: 13, lineHeight: 1.5, color: "var(--ink)" }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>{phaseData.label} intent</div>
        <div>{phaseData.intro.plain}</div>
      </div>

      <div className="checklist">
        {phaseData.items.map((item, i) => {
          const key = `${phase}-${i}`;
          const isDone = !!checks[key];
          return (
            <div key={key} className={`step ${isDone ? "done" : ""}`} onClick={() => toggle(key)}>
              <div className="time">{item.time}</div>
              <div className="check">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7l2.5 2.5L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="content">
                <div className="action">{item.action}</div>
                <div className="sub">{item.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {done === total && total > 0 && (
        <div style={{ marginTop: 16, padding: "14px 16px", background: "var(--ink)", color: "var(--paper)", borderRadius: 14, textAlign: "center", fontSize: 13, fontWeight: 600 }}>
          ✓ {phaseData.label} complete
        </div>
      )}

      <div style={{ height: 12 }} />
      <button
        onClick={() => { if (confirm("Reset today's checklist?")) setChecks({}); }}
        style={{ width: "100%", padding: "10px", background: "transparent", border: "1px solid var(--line)", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", cursor: "pointer", font: "inherit" }}>
        Reset today
      </button>
    </div>
  );
}
