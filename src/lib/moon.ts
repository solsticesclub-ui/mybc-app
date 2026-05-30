const MOON_SYNODIC = 29.530588853;
const MOON_REF_EPOCH = Date.UTC(2000, 0, 6, 18, 14);

export function calcMoonPhase(date: Date): number {
  const elapsedDays = (date.getTime() - MOON_REF_EPOCH) / 86400000;
  return ((elapsedDays / MOON_SYNODIC) % 1 + 1) % 1;
}

export function moonPhaseName(p: number): string {
  if (p < 0.03 || p >= 0.97) return "New moon";
  if (p < 0.22) return "Waxing crescent";
  if (p < 0.28) return "First quarter";
  if (p < 0.47) return "Waxing gibbous";
  if (p < 0.53) return "Full moon";
  if (p < 0.72) return "Waning gibbous";
  if (p < 0.78) return "Last quarter";
  return "Waning crescent";
}

export function buildMoonDays(startMs: number, count = 28) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startMs + i * 86400000);
    const phase = calcMoonPhase(d);
    out.push({
      date: d.toISOString(),
      phase,
      phaseName: moonPhaseName(phase),
      scores: {
        Energy: 3 + Math.round(7 * (0.5 + 0.5 * Math.sin(i / 2.1))),
        Business: 3 + Math.round(7 * (0.5 + 0.5 * Math.sin(i / 3.4 + 1))),
        Body: 3 + Math.round(7 * (0.5 + 0.5 * Math.sin(i / 1.7 + 2))),
        Social: 3 + Math.round(7 * (0.5 + 0.5 * Math.sin(i / 2.8 + 4))),
      },
    });
  }
  return out;
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
