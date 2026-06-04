"use client";

import { useRouter } from "next/navigation";
import { useApp, useNav } from "../AppShell";
import MoonGlyph from "@/components/ui/MoonGlyph";
import EnergyRing from "@/components/ui/EnergyRing";
import { calcMoonPhase, moonPhaseName } from "@/lib/moon";

const TILES = [
  "Daily", "Chart", { t: "Report", dark: true },
  "Body", "Nutrition", "Sport",
  "Career", "Strengths", "Mind",
  "Love", "Rituals", "Gut",
  "Moon", "Chinese", "Year",
];

const NAV_WIRED = new Set([
  "daily", "chart", "moon", "strengths", "career", "report",
  "body", "year", "love", "nutrition", "rituals", "mind", "sport", "chinese", "gut",
]);

export default function HubPage() {
  const router = useRouter();
  const nav = useNav();
  const { report, profile } = useApp();
  const data = report.data!;

  const now = new Date();
  const phase = calcMoonPhase(now);
  const phaseLabel = moonPhaseName(phase);
  const today = data.today_default;
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="page">
      <div className="header-row">
        <div className="greeting">
          <div className="micro">{dateStr}</div>
          <div className="h1">Hello, {profile.name}</div>
        </div>
      </div>

      <button className="today-card" onClick={() => router.push(nav("daily"))}>
        <div className="top">
          <div className="eyebrow">Today</div>
          <div className="arrow">open →</div>
        </div>
        <div className="body-row">
          <MoonGlyph phase={phase} size={44} stroke="rgba(255,255,255,0.55)" />
          <div style={{ flex: 1, textAlign: "left" }}>
            <div className="moon-title" style={{ color: "rgb(255,255,255)" }}>Moon in {today.moonSign}</div>
            <div className="moon-sub">{phaseLabel.toLowerCase()} · activates your ASC</div>
          </div>
          <EnergyRing value={today.energy} />
        </div>
        <div className="chips">
          <div className="chip">
            <div className="label">Do</div>
            <div className="value" style={{ color: "rgb(255,255,255)" }}>{today.do}</div>
          </div>
          <div className="chip">
            <div className="label">Avoid</div>
            <div className="value" style={{ color: "rgb(255,255,255)" }}>{today.avoid}</div>
          </div>
        </div>
      </button>

      <div style={{ height: 22 }} />

      <div className="tile-grid">
        {TILES.map((tile) => {
          const t = typeof tile === "string" ? tile : tile.t;
          const dark = typeof tile === "object" && (tile as { t: string; dark: boolean }).dark;
          const wired = NAV_WIRED.has(t.toLowerCase());
          return (
            <button key={t}
              className={`tile ${dark ? "dark" : ""}`}
              onClick={() => wired && router.push(nav(t.toLowerCase()))}
              style={{ cursor: wired ? "pointer" : "default", opacity: wired || dark ? 1 : 0.85 }}
              title={wired ? "" : "Coming soon"}>
              <div className="icon" />
              <div className="title">{t}</div>
            </button>
          );
        })}
      </div>

      <div style={{ height: 16 }} />
      <div className="micro" style={{ textAlign: "center", opacity: 0.7 }}>
        Fifteen sections · tap any tile to open.
      </div>
    </div>
  );
}
