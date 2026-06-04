// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Origin, Horoscope } = require("circular-natal-horoscope-js");

import type { ChartPlanet, ChartHouse, ChartAspect, ChartSign } from "./types";

// ── Constants ────────────────────────────────────────────────────

const SIGNS_ORDER = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
];

const SIGN_GLYPHS: Record<string, string> = {
  Aries:"♈", Taurus:"♉", Gemini:"♊", Cancer:"♋", Leo:"♌", Virgo:"♍",
  Libra:"♎", Scorpio:"♏", Sagittarius:"♐", Capricorn:"♑", Aquarius:"♒", Pisces:"♓",
};

const SIGN_QUALITY: Record<string, string> = {
  Aries:"Cardinal Fire", Taurus:"Fixed Earth", Gemini:"Mutable Air",
  Cancer:"Cardinal Water", Leo:"Fixed Fire", Virgo:"Mutable Earth",
  Libra:"Cardinal Air", Scorpio:"Fixed Water", Sagittarius:"Mutable Fire",
  Capricorn:"Cardinal Earth", Aquarius:"Fixed Air", Pisces:"Mutable Water",
};

const SIGN_ELEMENT: Record<string, string> = {
  Aries:"Fire", Leo:"Fire", Sagittarius:"Fire",
  Taurus:"Earth", Virgo:"Earth", Capricorn:"Earth",
  Gemini:"Air", Libra:"Air", Aquarius:"Air",
  Cancer:"Water", Scorpio:"Water", Pisces:"Water",
};

const SIGN_MODALITY: Record<string, string> = {
  Aries:"Cardinal", Cancer:"Cardinal", Libra:"Cardinal", Capricorn:"Cardinal",
  Taurus:"Fixed", Leo:"Fixed", Scorpio:"Fixed", Aquarius:"Fixed",
  Gemini:"Mutable", Virgo:"Mutable", Sagittarius:"Mutable", Pisces:"Mutable",
};

const BODY_KEYS = ["sun","moon","mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto"] as const;
const BODY_LABELS: Record<string, string> = {
  sun:"Sun", moon:"Moon", mercury:"Mercury", venus:"Venus", mars:"Mars",
  jupiter:"Jupiter", saturn:"Saturn", uranus:"Uranus", neptune:"Neptune", pluto:"Pluto",
};

const ASPECT_TYPE_MAP: Record<string, ChartAspect["type"]> = {
  conjunction:"conjunction", sextile:"sextile", square:"square", trine:"trine", opposition:"opposition",
};

// ── Helpers ──────────────────────────────────────────────────────

// "19° 10' 35''" → "19°10'"
function formatDeg(formatted30: string): string {
  const m = formatted30.match(/(\d+)°\s*(\d+)'/);
  if (!m) return formatted30;
  return `${m[1]}°${m[2].padStart(2, "0")}'`;
}

// Convert absolute ecliptic decimal longitude (0–360) to sign index + decimal within sign
function eclipticToSign(decimal: number): { sign: string; deg: number; min: number } {
  const norm = ((decimal % 360) + 360) % 360;
  const signIdx = Math.floor(norm / 30);
  const inSign = norm - signIdx * 30;
  return {
    sign: SIGNS_ORDER[signIdx],
    deg: Math.floor(inSign),
    min: Math.floor((inSign - Math.floor(inSign)) * 60),
  };
}

// Julian Day Number from calendar date + UTC time
function toJulianDay(year: number, month1: number, day: number, hour: number, minute: number): number {
  const a = Math.floor((14 - month1) / 12);
  const y = year + 4800 - a;
  const m = month1 + 12 * a - 3;
  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  return jdn + (hour - 12) / 24 + minute / 1440;
}

// Mean Lunar North Node ecliptic longitude (degrees) using Meeus formula
function calcMeanNorthNode(year: number, month1: number, day: number, hour: number, minute: number): number {
  const jd = toJulianDay(year, month1, day, hour, minute);
  const T = (jd - 2451545.0) / 36525;
  const omega =
    125.04452 -
    1934.136261 * T +
    0.0020708 * T * T +
    (T * T * T) / 450000;
  return ((omega % 360) + 360) % 360;
}

function houseStrength(
  houseId: number,
  planets: string[]
): ChartHouse["strength"] {
  const hasLuminary = planets.includes("Sun") || planets.includes("Moon");
  const isAngular = [1, 4, 7, 10].includes(houseId);
  const isSuccedent = [2, 5, 8, 11].includes(houseId);
  if (planets.length >= 3 || hasLuminary) return "Very Strong";
  if (planets.length === 2) return "Strong";
  if (planets.length === 1) return isAngular ? "Strong" : "Medium";
  if (isAngular) return "Strong";
  if (isSuccedent) return "Weak";
  return "Empty";
}

// ── Public return type ────────────────────────────────────────────

export interface NatalChartCalc {
  chart_planets: Omit<ChartPlanet, "note">[];
  chart_signs: ChartSign[];
  chart_houses: Omit<ChartHouse, "theme">[];
  chart_aspects: Omit<ChartAspect, "note">[];
  chart_distribution: {
    elements: { l: string; v: number }[];
    modes: { l: string; v: number }[];
  };
  today_moon_sign: string;
}

// ── Main calculation ──────────────────────────────────────────────

export function calcNatalChart(params: {
  birth_date: string;
  birth_time: string;
  birth_lat: number;
  birth_lng: number;
}): NatalChartCalc {
  const [year, month1, day] = params.birth_date.split("-").map(Number);
  const [hour, minute] = params.birth_time.split(":").map(Number);
  // month is 0-indexed in this library
  const month0 = month1 - 1;

  const origin = new Origin({
    year, month: month0, date: day,
    hour, minute,
    latitude: params.birth_lat,
    longitude: params.birth_lng,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const h: any = new Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
    aspectPoints: ["bodies", "points", "angles"],
    aspectWithPoints: ["bodies", "points", "angles"],
    aspectTypes: ["major"],
    customOrbs: {},
    language: "en",
  });

  // ── Planets ──────────────────────────────────────────────────
  const chart_planets: Omit<ChartPlanet, "note">[] = [];

  for (const key of BODY_KEYS) {
    const b = h.CelestialBodies[key];
    chart_planets.push({
      planet: BODY_LABELS[key],
      degree: formatDeg(b.ChartPosition.Ecliptic.ArcDegreesFormatted30),
      sign: b.Sign.label,
      house: b.House.id as number,
      quality: SIGN_QUALITY[b.Sign.label] ?? "",
      retrograde: b.isRetrograde === true,
    });
  }

  // ASC
  const asc = h.Ascendant;
  chart_planets.push({
    planet: "ASC",
    degree: formatDeg(asc.ChartPosition.Ecliptic.ArcDegreesFormatted30),
    sign: asc.Sign.label,
    house: 1,
    quality: SIGN_QUALITY[asc.Sign.label] ?? "",
    retrograde: false,
  });

  // MC
  const mc = h.Midheaven;
  chart_planets.push({
    planet: "MC",
    degree: formatDeg(mc.ChartPosition.Ecliptic.ArcDegreesFormatted30),
    sign: mc.Sign.label,
    house: 10,
    quality: SIGN_QUALITY[mc.Sign.label] ?? "",
    retrograde: false,
  });

  // North Node (mean, Meeus formula)
  const nnLon = calcMeanNorthNode(year, month1, day, hour, minute);
  const nnPos = eclipticToSign(nnLon);
  const snLon = (nnLon + 180) % 360;
  const snPos = eclipticToSign(snLon);

  chart_planets.push({
    planet: "North Node",
    degree: `${nnPos.deg}°${String(nnPos.min).padStart(2, "0")}'`,
    sign: nnPos.sign,
    house: houseForDegree(h.Houses, nnLon),
    quality: SIGN_QUALITY[nnPos.sign] ?? "",
    retrograde: false,
  });

  chart_planets.push({
    planet: "South Node",
    degree: `${snPos.deg}°${String(snPos.min).padStart(2, "0")}'`,
    sign: snPos.sign,
    house: houseForDegree(h.Houses, snLon),
    quality: SIGN_QUALITY[snPos.sign] ?? "",
    retrograde: false,
  });

  // ── Signs ────────────────────────────────────────────────────
  const signMap: Record<string, string[]> = {};
  for (const s of SIGNS_ORDER) signMap[s] = [];
  for (const cp of chart_planets) {
    if (signMap[cp.sign]) signMap[cp.sign].push(cp.planet);
  }
  const chart_signs: ChartSign[] = SIGNS_ORDER.map((s) => ({
    sign: s,
    glyph: SIGN_GLYPHS[s],
    planets: signMap[s],
    count: signMap[s].length,
  }));

  // ── Houses ───────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chart_houses: Omit<ChartHouse, "theme">[] = (h.Houses as any[]).map((house) => {
    const planetsIn = chart_planets
      .filter((p) => p.house === house.id && p.planet !== "ASC" && p.planet !== "MC")
      .map((p) => p.planet);
    return {
      house: house.id as number,
      sign: house.Sign.label as string,
      planets: planetsIn,
      strength: houseStrength(house.id, planetsIn),
    };
  });

  // ── Aspects ──────────────────────────────────────────────────
  const bodyLabelSet = new Set(Object.values(BODY_LABELS));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chart_aspects: Omit<ChartAspect, "note">[] = ((h.Aspects?.all ?? []) as any[])
    .filter(
      (a) =>
        ASPECT_TYPE_MAP[a.aspectKey] &&
        bodyLabelSet.has(a.point1Label) &&
        bodyLabelSet.has(a.point2Label)
    )
    .map((a) => ({
      p1: a.point1Label as string,
      p2: a.point2Label as string,
      type: ASPECT_TYPE_MAP[a.aspectKey],
      orb: `${Math.round(a.orb * 10) / 10}°`,
    }));

  // ── Element & modality distribution (10 planets only) ────────
  const elCount: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const modCount: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  const planetNames = new Set(Object.values(BODY_LABELS));
  let total = 0;

  for (const cp of chart_planets.filter((p) => planetNames.has(p.planet))) {
    const el = SIGN_ELEMENT[cp.sign];
    const mod = SIGN_MODALITY[cp.sign];
    if (el) { elCount[el]++; total++; }
    if (mod) modCount[mod]++;
  }

  const chart_distribution = {
    elements: ["Fire","Earth","Air","Water"].map((l) => ({
      l, v: total > 0 ? Math.round((elCount[l] / total) * 100) : 0,
    })),
    modes: ["Cardinal","Fixed","Mutable"].map((l) => ({
      l, v: total > 0 ? Math.round((modCount[l] / total) * 100) : 0,
    })),
  };

  // ── Today's moon sign ────────────────────────────────────────
  const today_moon_sign = calcCurrentMoonSign();

  return { chart_planets, chart_signs, chart_houses, chart_aspects, chart_distribution, today_moon_sign };
}

// Determine which house a given ecliptic longitude falls in
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function houseForDegree(houses: any[], eclipticDeg: number): number {
  const norm = ((eclipticDeg % 360) + 360) % 360;
  // Houses are sorted 1–12 by cusp degree; find which interval norm falls in
  const cusps: number[] = houses.map((h) =>
    ((h.ChartPosition.StartPosition.Ecliptic.DecimalDegrees % 360) + 360) % 360
  );

  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (start <= end) {
      if (norm >= start && norm < end) return houses[i].id;
    } else {
      // Wraps around 0°
      if (norm >= start || norm < end) return houses[i].id;
    }
  }
  return 1;
}

export function calcCurrentMoonSign(): string {
  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const h: any = new Horoscope({
    origin: new Origin({
      year: now.getUTCFullYear(),
      month: now.getUTCMonth(),
      date: now.getUTCDate(),
      hour: now.getUTCHours(),
      minute: now.getUTCMinutes(),
      latitude: 0,
      longitude: 0,
    }),
    houseSystem: "placidus",
    zodiac: "tropical",
    aspectPoints: [],
    aspectWithPoints: [],
    aspectTypes: [],
    customOrbs: {},
    language: "en",
  });
  return h.CelestialBodies.moon.Sign.label as string;
}
