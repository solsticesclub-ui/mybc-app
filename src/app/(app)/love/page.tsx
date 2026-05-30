"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";

export default function LovePage() {
  const router = useRouter();
  const { report, mode, setMode } = useApp();
  const love = report.data!.love;
  const [tab, setTab] = useState("blueprint");

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push("/hub")} eyebrow="Section 10 · Love & relationships" title="Your love blueprint" mode={mode} setMode={setMode} />

      <div className="love-hero">
        <div className="love-quote">{mode === "expert" ? love.blueprint.expert : love.blueprint.plain}</div>
      </div>

      <div className="body-tabs">
        {[["blueprint", "Needs"], ["dynamics", "Dynamics"], ["compat", "Compatibility"]].map(([k, label]) => (
          <button key={k} className={`body-tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === "blueprint" && (
        <div className="needs-list">
          {love.needs.map((n, i) => (
            <div key={i} className="need-card">
              <div className="n">{String(i + 1).padStart(2, "0")}</div>
              <div className="body"><div className="title">{n.l}</div><div className="sub">{n.sub}</div></div>
            </div>
          ))}
        </div>
      )}

      {tab === "dynamics" && (
        <div className="dynamics-grid">
          <div className="dyn-col activates">
            <div className="dyn-head">
              <div className="symbol" style={{ backgroundColor: "rgb(255,255,255)" }}>+</div>
              <div className="label" style={{ color: "rgb(255,255,255)" }}>Activates</div>
            </div>
            <ul>{love.activates.map((a, i) => <li key={i} style={{ color: "rgb(255,255,255)" }}>{a}</li>)}</ul>
          </div>
          <div className="dyn-col depletes">
            <div className="dyn-head">
              <div className="symbol">−</div>
              <div className="label">Depletes</div>
            </div>
            <ul>{love.depletes.map((d, i) => <li key={i}>{d}</li>)}</ul>
          </div>
        </div>
      )}

      {tab === "compat" && (
        <div className="compat-list">
          {love.compatibility.map((c) => (
            <div key={c.sign} className="compat-row">
              <div className="glyph">{c.glyph}</div>
              <div className="body">
                <div className="head">
                  <div className="sign">{c.sign}</div>
                  <span className={`score score-${c.score.toLowerCase()}`} style={{ backgroundColor: "rgb(75,85,99)", color: "rgb(255,255,255)" }}>{c.score}</span>
                </div>
                <div className="note">{c.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
