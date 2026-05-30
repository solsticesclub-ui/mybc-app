"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";
import type { ChartSign } from "@/lib/types";

function NatalChartSvg({ signs, highlightIndex = -1, onSelect }: { signs: ChartSign[]; highlightIndex?: number; onSelect?: (i: number) => void }) {
  const cx = 50, cy = 50, rIn = 12, rBase = 28, rMax = 44, halfSpan = 14;
  const abbr = (s: string) => s.slice(0, 3).toUpperCase();
  const maxCount = Math.max(...signs.map((s) => s.count), 1);
  const shadeFor = (count: number, isHi: boolean) => {
    if (isHi) return "#ffffff";
    if (count === 0) return "#5e6065";
    const t = count / maxCount;
    const v = Math.round(160 + t * 90);
    return `rgb(${v},${v},${v - 5})`;
  };
  const radiusFor = (count: number) => rBase + (count / maxCount) * (rMax - rBase);
  const polar = (r: number, deg: number): [number, number] => {
    const rad = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const petalPath = (centerDeg: number, rOuter: number) => {
    const a1 = centerDeg - halfSpan, a2 = centerDeg + halfSpan;
    const [ix1, iy1] = polar(rIn, a1), [ix2, iy2] = polar(rIn, a2);
    const [ox1, oy1] = polar(rOuter, a1), [ox2, oy2] = polar(rOuter, a2);
    const sideR = (rIn + rOuter) / 2;
    const [c1x, c1y] = polar(sideR, a1 - 3), [c2x, c2y] = polar(sideR, a2 + 3);
    return [`M ${ix1} ${iy1}`, `Q ${c1x} ${c1y} ${ox1} ${oy1}`, `A ${rOuter} ${rOuter} 0 0 1 ${ox2} ${oy2}`, `Q ${c2x} ${c2y} ${ix2} ${iy2}`, `A ${rIn} ${rIn} 0 0 0 ${ix1} ${iy1}`, "Z"].join(" ");
  };
  const drawOrder = signs.map((s, i) => ({ ...s, i })).sort((a, b) => a.count - b.count);

  return (
    <div className="natal-frame">
      <svg viewBox="0 0 100 100" width="100%" style={{ display: "block" }}>
        {drawOrder.map((s) => {
          const angle = s.i * 30;
          const rOuter = radiusFor(s.count);
          const isHi = s.i === highlightIndex;
          return (
            <path key={s.sign} d={petalPath(angle, rOuter)} fill={shadeFor(s.count, isHi)}
              stroke="#1f2125" strokeWidth="0.6" strokeLinejoin="round"
              onClick={() => onSelect && onSelect(s.i)}
              style={{ cursor: onSelect ? "pointer" : "default", transition: "fill 0.2s ease" }} />
          );
        })}
        {signs.map((s, i) => {
          const angle = i * 30;
          const rOuter = radiusFor(s.count);
          const labelR = (rIn + rOuter) / 2 + 2;
          const [lx, ly] = polar(labelR, angle);
          const isHi = i === highlightIndex;
          const dark = s.count === 0 && !isHi;
          const fill = isHi ? "#1f2125" : (dark ? "#9ea0a4" : "#1f2125");
          return (
            <g key={`l${s.sign}`} style={{ pointerEvents: "none" }}>
              <text x={lx} y={ly - 0.5} fontSize="5" textAnchor="middle" fill={fill} fontWeight="700" style={{ fontFamily: "Inter, sans-serif" }}>{s.count}</text>
              <text x={lx} y={ly + 3.8} fontSize="2.4" textAnchor="middle" fill={fill} fontWeight="600" opacity={dark ? 0.8 : 0.7} style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.08em" }}>{abbr(s.sign)}</text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={rIn - 1.5} fill="#1f2125" />
      </svg>
    </div>
  );
}

export default function ChartPage() {
  const router = useRouter();
  const { report, mode, setMode } = useApp();
  const { chart_signs, chart_distribution } = report.data!;
  const [selected, setSelected] = useState(-1);
  const sel = selected >= 0 ? chart_signs[selected] : null;

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push("/hub")} eyebrow="Section 01 · Your chart" title="The shape of you" mode={mode} setMode={setMode} />

      <div className="chart-wrap">
        <NatalChartSvg signs={chart_signs} highlightIndex={selected} onSelect={setSelected} />
      </div>

      {sel && (
        <div className="chart-sign-card">
          <div className="row">
            <div className="glyph">{sel.glyph}</div>
            <div>
              <div className="sign">{sel.sign}</div>
              <div className="count">{sel.planets.length === 0 ? "No planets" : `${sel.planets.length} placement${sel.planets.length > 1 ? "s" : ""}`}</div>
            </div>
            <button className="close" onClick={() => setSelected(-1)} aria-label="Close">×</button>
          </div>
          {sel.planets.length > 0 && (
            <div className="planet-chips">{sel.planets.map((p) => <span key={p} className="planet-chip">{p}</span>)}</div>
          )}
        </div>
      )}
      {!sel && <div className="chart-hint">Tap a petal to see what's there. Bigger petals = more activity.</div>}

      <div className="distribution-card">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Element distribution</div>
        {chart_distribution.elements.map(({ l, v, gloss }) => (
          <div key={l} className="dist-row">
            <div className="dist-label">{l}</div>
            <div className="dist-bar"><div className="dist-fill" style={{ width: `${v}%` }} /></div>
            <div className="dist-val">{v}%</div>
            <div className="dist-gloss">{gloss}</div>
          </div>
        ))}
      </div>

      <div className="distribution-card">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Modality distribution</div>
        {chart_distribution.modes.map(({ l, v, gloss }) => (
          <div key={l} className="dist-row">
            <div className="dist-label">{l}</div>
            <div className="dist-bar"><div className="dist-fill" style={{ width: `${v}%` }} /></div>
            <div className="dist-val">{v}%</div>
            <div className="dist-gloss">{gloss}</div>
          </div>
        ))}
      </div>

      <div className="summary-block">
        {mode === "expert" ? chart_distribution.summary.expert : chart_distribution.summary.plain}
      </div>
    </div>
  );
}
