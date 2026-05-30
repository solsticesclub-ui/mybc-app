"use client";

interface Props {
  phase?: number;
  size?: number;
  dark?: string;
  lit?: string;
  stroke?: string | null;
}

export default function MoonGlyph({ phase = 0.4, size = 32, dark = "#1a1f2e", lit = "#ffffff", stroke = null }: Props) {
  const p = ((phase % 1) + 1) % 1;
  const waxing = p <= 0.5;
  const illum = waxing ? p * 2 : (1 - p) * 2;
  const sw = stroke ? Math.max(1, size / 24) : 0;
  const r = size / 2 - 0.5 - sw / 2;
  const cx = size / 2, cy = size / 2;
  const rx = Math.abs(r * (1 - 2 * illum));
  const outerSweep = waxing ? 1 : 0;
  const innerSweep = illum > 0.5 ? (waxing ? 1 : 0) : (waxing ? 0 : 1);
  const d = `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${outerSweep} ${cx} ${cy + r} A ${rx} ${r} 0 0 ${innerSweep} ${cx} ${cy - r} Z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill={dark} stroke={stroke ?? "none"} strokeWidth={sw} />
      {illum > 0.005 && <path d={d} fill="rgb(236, 236, 229)" />}
    </svg>
  );
}
