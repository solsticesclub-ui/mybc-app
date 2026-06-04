import Anthropic from "@anthropic-ai/sdk";
import type { ReportData } from "./types";
import type { NatalChartCalc } from "./astro-calc";

export const SYSTEM = `You are an expert astrologer, biohacker, TCM practitioner, and human optimization coach.
You generate exhaustive, deeply personalized reports. Never be generic — every claim must be grounded in a specific placement.
Speak directly to the person ("you").
Return ONLY valid JSON — no markdown fences, no commentary outside the JSON object.`;

function extractJSON(raw: string): string {
  // Strip markdown fences
  let s = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  // Extract outermost { ... } in case Claude adds commentary before/after
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last > first) s = s.slice(first, last + 1);
  return s;
}

export async function callClaude(prompt: string, maxTokens = 6000): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  for (let attempt = 1; attempt <= 2; attempt++) {
    const msg = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: maxTokens,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = (msg.content[0] as { type: string; text: string }).text.trim();
    const cleaned = extractJSON(raw);

    try {
      JSON.parse(cleaned); // validate before returning
      return cleaned;
    } catch {
      if (attempt === 2) throw new Error(`Claude returned invalid JSON after 2 attempts`);
      // retry silently
    }
  }
  throw new Error("Unreachable");
}

export function birthCtx(p: { name: string; birth_full_name?: string; birth_date: string; birth_time: string; birth_place: string; language: string }) {
  const nameLine = p.birth_full_name && p.birth_full_name !== p.name
    ? `PERSON: ${p.name}\nFULL BIRTH NAME (for numerology): ${p.birth_full_name}`
    : `PERSON: ${p.name}`;
  return `${nameLine}
DATE OF BIRTH: ${p.birth_date}
TIME OF BIRTH: ${p.birth_time}
PLACE OF BIRTH: ${p.birth_place}
REPORT LANGUAGE: ${p.language}
TODAY'S DATE: ${new Date().toISOString().slice(0, 10)}`;
}

export function chartSummaryFromData(data: ReportData): string {
  const el = data.chart_distribution.elements.map((e) => `${e.l} ${e.v}%`).join(", ");
  const modes = data.chart_distribution.modes.map((m) => `${m.l} ${m.v}%`).join(", ");

  // Rich format — available for all new reports
  if (data.chart_planets?.length) {
    const planets = data.chart_planets
      .map((p) => {
        const retro = p.retrograde ? "℞" : "";
        return `${p.planet} ${p.degree}${retro} ${p.sign} H${p.house}`;
      })
      .join("; ");

    const houses = data.chart_houses
      ?.filter((h) => h.planets.length > 0 || h.strength === "Very Strong")
      .map((h) => `H${h.house} ${h.sign} (${h.strength}${h.planets.length ? ": " + h.planets.join(", ") : ""})`)
      .join("; ") ?? "";

    const aspects = data.chart_aspects?.length
      ? " Aspects: " + data.chart_aspects
          .map((a) => `${a.p1} ${a.type} ${a.p2} ${a.orb}`)
          .join(", ") + "."
      : "";

    return `Planets: ${planets}. Elements: ${el}. Modes: ${modes}. Houses: ${houses}.${aspects} ${data.chart_distribution.summary.expert}`;
  }

  // Fallback for existing users generated before this update
  const placed = data.chart_signs
    .filter((s) => s.planets.length > 0)
    .map((s) => `${s.planets.join(", ")} in ${s.sign}`)
    .join("; ");
  return `Placements: ${placed}. Elements: ${el}. ${data.chart_distribution.summary.expert}`;
}

// ── Per-section token limits ────────────────────────────────────
export const SECTION_MAX_TOKENS: Record<number, number> = {
  0:  6000,
  1:  4500,
  2:  4000,
  3:  5500,
  4:  3500,
  5:  7000,
  6:  5500,
  7:  4500,
  8:  4500,
  9:  8000,
  10: 9000,
  11: 5500,
  12: 7000,
  13: 5500,
  14: 4500,
  15: 4500,
  16: 3500,
};

// ── Section 0 — interpret pre-calculated natal chart ───────────────
// calc comes from astro-calc.ts (real ephemeris). Claude adds ONLY interpretation text.
export function promptSection0(p: Parameters<typeof birthCtx>[0], calc: NatalChartCalc): string {
  const planetsJson = JSON.stringify(calc.chart_planets.map(pl => ({
    planet: pl.planet, degree: pl.degree, sign: pl.sign,
    house: pl.house, quality: pl.quality, retrograde: pl.retrograde, note: "",
  })), null, 2);

  const housesJson = JSON.stringify(calc.chart_houses.map(h => ({
    house: h.house, sign: h.sign, planets: h.planets, strength: h.strength, theme: "",
  })), null, 2);

  const aspectsJson = JSON.stringify(calc.chart_aspects.map(a => ({
    p1: a.p1, p2: a.p2, type: a.type, orb: a.orb, note: "",
  })), null, 2);

  const elementsJson = JSON.stringify(calc.chart_distribution.elements.map(e => ({
    l: e.l, v: e.v, gloss: "",
  })));

  const modesJson = JSON.stringify(calc.chart_distribution.modes.map(m => ({
    l: m.l, v: m.v, gloss: "",
  })));

  const signsJson = JSON.stringify(calc.chart_signs);

  return `${birthCtx(p)}

The natal chart has already been calculated by a real ephemeris engine. All positions, degrees, signs, houses, and retrograde status below are ACCURATE — do not change any of them.

Your job is ONLY to write the interpretation text for each empty field.

CALCULATED CHART DATA:
chart_planets: ${planetsJson}
chart_houses: ${housesJson}
chart_aspects: ${aspectsJson}
chart_distribution.elements: ${elementsJson}
chart_distribution.modes: ${modesJson}
chart_signs: ${signsJson}
today_moon_sign: ${calc.today_moon_sign}

Return ONLY valid JSON with this exact structure (fill every empty string field — do not alter any number, sign, degree, house, retrograde, or planets array):

{
  "chart_signs": <chart_signs unchanged>,
  "chart_distribution": {
    "elements": [fill gloss for each element based on this person's chart],
    "modes": [fill gloss for each mode],
    "summary": {"plain":"one accessible sentence about this chart's balance","expert":"one technical sentence naming the dominant pattern with placement references"}
  },
  "today_default": {
    "moonSign": "${calc.today_moon_sign}",
    "do": "one specific action for today based on moon in ${calc.today_moon_sign}",
    "avoid": "one thing to avoid today",
    "energy": <number 1-10>
  },
  "chart_planets": [fill note for each planet — one meaningful sentence grounded in exact sign + house + aspects],
  "chart_houses": [fill theme for each house — one-line life meaning for this person],
  "chart_aspects": [fill note for each aspect — one-line interpretation]
}`;
}

// ── Sections 1–16 — prose blocks + tile data ───────────────────
const HDR = (p: Parameters<typeof birthCtx>[0], chartSummary: string) =>
  `${birthCtx(p)}
CHART: ${chartSummary}
Write in ${p.language}. Every claim grounded in a specific placement. Never generic.
Block types: ["h","heading"] ["p","paragraph"] ["note","note text"] ["ul",["item",...]] ["ol",["item",...]] ["dl",[["term","definition"],...]]
Italic within text: /text/

`;

export function promptSection(
  section: number,
  p: Parameters<typeof birthCtx>[0],
  chartSummary: string
): string {
  const h = HDR(p, chartSummary);

  switch (section) {

    // ── 1 · Physical Appearance ───────────────────────────────
    case 1: return h + `SECTION 01 — PHYSICAL APPEARANCE & BODY TYPE
Prose (minimum 300 words): body type, height tendency, facial features from ASC+Sun+Moon degrees. First impression on strangers. Energetic presence in element. Sensitive body zones by sign rulership. Optimal trained body type (placement-specific, not generic). Physical vulnerabilities and prevention.

Return: {"blocks":[...],"tile":{"body":{"constitution":"[e.g. Vata-Pitta / Fire dominant]","blurb":{"plain":"[1 clear sentence]","expert":"[1 technical sentence with placements]"},"signals":[{"l":"Energy levels","v":"High"},{"l":"Sleep quality","v":"Medium"},{"l":"Stress response","v":"High"},{"l":"Digestion","v":"Medium"},{"l":"Recovery speed","v":"High"}],"regions":[{"id":"gut","label":"Gut & digestion","priority":"High","note":"[chart-specific note]"},{"id":"nervous","label":"Nervous system","priority":"High","note":"..."},{"id":"joints","label":"Joints & flexibility","priority":"Medium","note":"..."}],"practices":["[specific morning practice]","[specific evening practice]","[specific weekly practice]"]}}}`;

    // ── 2 · Nervous System ────────────────────────────────────
    case 2: return h + `SECTION 02 — NERVOUS SYSTEM — DEEP ANALYSIS
Prose (minimum 350 words): nervous system type and sensitivity level. Full neurotransmitter profile — each in its own block: Serotonin, Dopamine, GABA, Acetylcholine, Noradrenaline — tendencies, risks, and what depletes each for this chart. Where stress physically stores. Warning signs of overload in order. Daily discharge rituals (morning/midday/evening/weekly) minute-specific. Top energy drains.

Return: {"blocks":[...]}`;

    // ── 3 · Daily Protocol ────────────────────────────────────
    case 3: return h + `SECTION 03 — ENERGY: COMPLETE DAILY PROTOCOL
Prose (minimum 300 words): morning minute-by-minute (wake time + astrological reason, first 5 min, water protocol, breathing technique + duration, movement type specific to Mars/Sun, journaling prompts for Moon sign, light protocol, fasting window + first meal timing). Daytime (ultradian rhythm, peak focus windows with exact times, peak social windows, mandatory breaks, never-do list). Evening (digital sunset time + reason, heat/water ritual, sleep setup: temperature/darkness/sound, sleep time + duration).

Return: {"blocks":[...],"tile":{"daily_protocol":{"morning":{"label":"Morning","start":"HH:MM","intro":{"plain":"[1 sentence]","expert":"[1 sentence with placement]"},"items":[{"time":"HH:MM","action":"[action name]","sub":"[detail]","source":"[placement]"},{"time":"HH:MM","action":"...","sub":"...","source":"..."},{"time":"HH:MM","action":"...","sub":"...","source":"..."},{"time":"HH:MM","action":"...","sub":"...","source":"..."},{"time":"HH:MM","action":"...","sub":"...","source":"..."}]},"day":{"label":"Day","start":"HH:MM","intro":{"plain":"...","expert":"..."},"items":[{"time":"HH:MM","action":"...","sub":"...","source":"..."},{"time":"HH:MM","action":"...","sub":"...","source":"..."},{"time":"HH:MM","action":"...","sub":"...","source":"..."},{"time":"HH:MM","action":"...","sub":"...","source":"..."},{"time":"HH:MM","action":"...","sub":"...","source":"..."}]},"evening":{"label":"Evening","start":"HH:MM","intro":{"plain":"...","expert":"..."},"items":[{"time":"HH:MM","action":"...","sub":"...","source":"..."},{"time":"HH:MM","action":"...","sub":"...","source":"..."},{"time":"HH:MM","action":"...","sub":"...","source":"..."},{"time":"HH:MM","action":"...","sub":"...","source":"..."},{"time":"HH:MM","action":"...","sub":"...","source":"..."}]}}}}`;

    // ── 4 · Expression & Communication ───────────────────────
    case 4: return h + `SECTION 04 — EXPRESSION & COMMUNICATION
Prose (minimum 300 words): natural communication style from Mercury sign/house/retrograde. Strongest expression form. What blocks authentic expression. How most persuasive (specific tactics). Conflict handling — what to do and what never to do. When to stay silent. Specific scenarios where this communication style creates problems and how to navigate them.

Return: {"blocks":[...]}`;

    // ── 5 · Nutrition ─────────────────────────────────────────
    case 5: return h + `SECTION 05 — NUTRITION — COMPLETELY EXHAUSTIVE
Prose (minimum 400 words): core principles from dominant elements. Fasting window. Macros with justification. Top 10 foods for nervous system, gut, brain, hormones/energy, skin/hair/eyes. Foods/substances to absolutely avoid with astrological AND physiological reason. Addiction risks direct. Full example day meal plan with exact times. Complete supplement stack: Tier 1 essential (name+dose+timing+why chart-specific), Tier 2 important, Tier 3 optimization. What to never take without supervision.

Return: {"blocks":[...],"tile":{"nutrition":{"principle":{"plain":"[1 clear sentence]","expert":"[1 technical sentence]"},"groups":[{"label":"Eat freely","tone":"eat","items":["[food 1]","[food 2]","[food 3]","[food 4]","[food 5]"]},{"label":"In moderation","tone":"limit","items":["[food 1]","[food 2]","[food 3]","[food 4]"]},{"label":"Avoid","tone":"avoid","items":["[food 1]","[food 2]","[food 3]","[food 4]"]}],"rhythm":[{"time":"HH:MM","what":"[meal description]"},{"time":"HH:MM","what":"..."},{"time":"HH:MM","what":"..."},{"time":"HH:MM","what":"..."}]}}}`;

    // ── 6 · Sport ─────────────────────────────────────────────
    case 6: return h + `SECTION 06 — SPORT & MOVEMENT — WEEKLY PLAN
Prose (minimum 300 words): sport philosophy from Mars sign + Jupiter house + Saturn sign. Optimal sports with specific placement justification. Counterproductive sports and exactly why. Full 7-day week: each day gives sport type, duration, structure, recovery notes, astrological justification.

Return: {"blocks":[...],"tile":{"sport":{"philosophy":{"plain":"[1 clear sentence]","expert":"[1 technical sentence]"},"best":[{"l":"[sport name]","n":"[why specific to this chart]"},{"l":"...","n":"..."},{"l":"...","n":"..."}],"avoid":["[sport + reason]","[sport + reason]"],"week":[{"d":"Mon","l":"[activity]","m":"[duration]","n":"[note]"},{"d":"Tue","l":"...","m":"...","n":"..."},{"d":"Wed","l":"...","m":"...","n":"..."},{"d":"Thu","l":"...","m":"...","n":"..."},{"d":"Fri","l":"...","m":"...","n":"..."},{"d":"Sat","l":"...","m":"...","n":"..."},{"d":"Sun","l":"Rest","m":"rest","n":"..."}]}}}`;

    // ── 7 · Gut Health ────────────────────────────────────────
    case 7: return h + `SECTION 07 — GUT HEALTH
Prose (minimum 300 words): why gut is #1 priority for this chart. Gut-brain-emotion connection for this person. Daily gut rituals with exact timing. Warning signs gut is off. 48h emergency reset step by step. Long-term testing with specific markers. Foods that support this chart's microbiome.

Return: {"blocks":[...],"tile":{"gut":{"principle":{"plain":"[1 sentence]","expert":"[1 sentence with placement]"},"rituals":[{"time":"HH:MM","what":"[ritual]"},{"time":"HH:MM","what":"..."},{"time":"HH:MM","what":"..."}],"warnings":["[warning 1]","[warning 2]","[warning 3]","[warning 4]"],"reset48":[{"l":"Hour 0–6","n":"[protocol]"},{"l":"Hour 6–24","n":"..."},{"l":"Hour 24–48","n":"..."}],"testing":[{"l":"[marker]","cadence":"2x/year"},{"l":"...","cadence":"..."}]}}}`;

    // ── 8 · Brain Optimization ────────────────────────────────
    case 8: return h + `SECTION 08 — BRAIN OPTIMIZATION
Prose (minimum 300 words): cognitive style from Mercury. Strengths and friction in thinking. Ideal learning environment (specific sensory conditions). Neuroplasticity protocol daily + weekly. Peak creative time windows. What this brain should never do with justification.

Return: {"blocks":[...],"tile":{"mind":{"signature":{"label":"[cognitive archetype label]","plain":"[1 clear sentence]","expert":"[1 sentence with Mercury placement]"},"strengths":[{"l":"[cognitive strength]","n":"01"},{"l":"...","n":"02"},{"l":"...","n":"03"},{"l":"...","n":"04"},{"l":"...","n":"05"}],"friction":["[friction point 1]","[friction point 2]","[friction point 3]"],"windows":[{"time":"[HH:MM – HH:MM]","label":"[window name]","note":"[what to do]"},{"time":"...","label":"...","note":"..."},{"time":"...","label":"...","note":"..."}],"never":["[never do 1]","[never do 2]","[never do 3]"]}}}`;

    // ── 9 · Strengths, Weaknesses & Shadow ───────────────────
    case 9: return h + `SECTION 09 — STRENGTHS, WEAKNESSES & SHADOW SIDES
Prose (minimum 400 words, blocks only): 10 weaknesses each with title/source/manifestation/solution. Shadow sides: escapism patterns, martyr/victim loop, shadow manipulation tactics, early warning signs. What happens when 2+ shadow patterns combine.

Also generate the tile with exactly 15 strengths as structured data.

Return: {"blocks":[...],"tile":{"strengths":[{"title":"[strength name]","tag":"Strength · 01 of 15","blurb":"[2-3 sentences]","practice":["[specific action]","[specific action]"],"activated":"[what activates this strength]","source":["[placement e.g. Sun in Aries]"]},{"title":"...","tag":"Strength · 02 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]},{"title":"...","tag":"Strength · 03 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]},{"title":"...","tag":"Strength · 04 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]},{"title":"...","tag":"Strength · 05 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]},{"title":"...","tag":"Strength · 06 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]},{"title":"...","tag":"Strength · 07 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]},{"title":"...","tag":"Strength · 08 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]},{"title":"...","tag":"Strength · 09 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]},{"title":"...","tag":"Strength · 10 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]},{"title":"...","tag":"Strength · 11 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]},{"title":"...","tag":"Strength · 12 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]},{"title":"...","tag":"Strength · 13 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]},{"title":"...","tag":"Strength · 14 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]},{"title":"...","tag":"Strength · 15 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]}]}}`;

    // ── 10 · Career & Life Mission ────────────────────────────
    case 10: return h + `SECTION 10 — CAREER & LIFE MISSION
Prose (minimum 400 words): North Node analysis (mission, karmic direction, toward/away). Saturn cycle timeline with ages. Current life phase meaning. Worst possible careers and why (minimum 3, each with placement justification). Optimal work environment specific to this chart.

Also return structured tile for the 10 best careers — each with astrological justification.

Return: {"blocks":[...],"tile":{"careers":[{"n":"01","title":"[career]","sub":"[sub-role or specialty]","plain":"[1 accessible sentence]","expert":"[1 sentence with placement justification]","sources":["[placement]","[placement]"],"practice":["[action to move toward this]","[action]"]},{"n":"02","title":"...","sub":"...","plain":"...","expert":"...","sources":["..."],"practice":["..."]},{"n":"03","title":"...","sub":"...","plain":"...","expert":"...","sources":["..."],"practice":["..."]},{"n":"04","title":"...","sub":"...","plain":"...","expert":"...","sources":["..."],"practice":["..."]},{"n":"05","title":"...","sub":"...","plain":"...","expert":"...","sources":["..."],"practice":["..."]},{"n":"06","title":"...","sub":"...","plain":"...","expert":"...","sources":["..."],"practice":["..."]},{"n":"07","title":"...","sub":"...","plain":"...","expert":"...","sources":["..."],"practice":["..."]},{"n":"08","title":"...","sub":"...","plain":"...","expert":"...","sources":["..."],"practice":["..."]},{"n":"09","title":"...","sub":"...","plain":"...","expert":"...","sources":["..."],"practice":["..."]},{"n":"10","title":"...","sub":"...","plain":"...","expert":"...","sources":["..."],"practice":["..."]}],"career_mission":{"plain":"[1 clear mission statement]","expert":"[1 sentence with North Node placement]"}}}`;

    // ── 11 · Relationships ────────────────────────────────────
    case 11: return h + `SECTION 11 — RELATIONSHIPS & SOCIAL LIFE
Prose (minimum 350 words): ideal partner profile from 7H and ruler. Attachment style and healing path. Love languages (give/receive). Red flags to recognize. Friendship patterns and social energy management. How many close relationships this chart sustains.

Return: {"blocks":[...],"tile":{"love":{"blueprint":{"plain":"[1 sentence on love style]","expert":"[1 sentence with 7H placement]"},"needs":[{"l":"[need]","sub":"[why from chart]"},{"l":"...","sub":"..."},{"l":"...","sub":"..."},{"l":"...","sub":"..."}],"activates":["[what opens this person up]","...","..."],"depletes":["[what shuts this person down]","...","..."],"compatibility":[{"sign":"[sign]","glyph":"[glyph]","score":"High","note":"[specific reason]"},{"sign":"...","glyph":"...","score":"High","note":"..."},{"sign":"...","glyph":"...","score":"Medium","note":"..."},{"sign":"...","glyph":"...","score":"Low","note":"..."},{"sign":"...","glyph":"...","score":"Low","note":"..."}]}}}`;

    // ── 12 · Moon Calendar & Year Cycles ─────────────────────
    case 12: return h + `SECTION 12 — MOON CALENDAR (next 4 weeks) & ANNUAL CYCLES
Prose (minimum 250 words): how this person should use the moon cycles based on their chart. What the current solar year means for them.

Also return 12 months starting this month and the 4 key year windows as tile data.

Return: {"blocks":[...],"tile":{"year_months":[{"m":"[3-letter month]","y":[2-digit year],"theme":"[theme]","color":"#1f2125","energy":[1-10],"business":[1-10],"body":[1-10],"love":[1-10],"transit":"[key transit]","plain":"[1 sentence]","expert":"[1 sentence with transit detail]"},{"m":"...","y":0,"theme":"...","color":"#1f2125","energy":0,"business":0,"body":0,"love":0,"transit":"...","plain":"...","expert":"..."},{"m":"...","y":0,"theme":"...","color":"#1f2125","energy":0,"business":0,"body":0,"love":0,"transit":"...","plain":"...","expert":"..."},{"m":"...","y":0,"theme":"...","color":"#1f2125","energy":0,"business":0,"body":0,"love":0,"transit":"...","plain":"...","expert":"..."},{"m":"...","y":0,"theme":"...","color":"#1f2125","energy":0,"business":0,"body":0,"love":0,"transit":"...","plain":"...","expert":"..."},{"m":"...","y":0,"theme":"...","color":"#1f2125","energy":0,"business":0,"body":0,"love":0,"transit":"...","plain":"...","expert":"..."},{"m":"...","y":0,"theme":"...","color":"#1f2125","energy":0,"business":0,"body":0,"love":0,"transit":"...","plain":"...","expert":"..."},{"m":"...","y":0,"theme":"...","color":"#1f2125","energy":0,"business":0,"body":0,"love":0,"transit":"...","plain":"...","expert":"..."},{"m":"...","y":0,"theme":"...","color":"#1f2125","energy":0,"business":0,"body":0,"love":0,"transit":"...","plain":"...","expert":"..."},{"m":"...","y":0,"theme":"...","color":"#1f2125","energy":0,"business":0,"body":0,"love":0,"transit":"...","plain":"...","expert":"..."},{"m":"...","y":0,"theme":"...","color":"#1f2125","energy":0,"business":0,"body":0,"love":0,"transit":"...","plain":"...","expert":"..."},{"m":"...","y":0,"theme":"...","color":"#1f2125","energy":0,"business":0,"body":0,"love":0,"transit":"...","plain":"...","expert":"..."}],"year_windows":[{"label":"Best money window","range":"[Month – Month YYYY]","detail":"[why]"},{"label":"Best love window","range":"...","detail":"..."},{"label":"Avoid big decisions","range":"...","detail":"..."},{"label":"Best rest window","range":"...","detail":"..."}]}}
year_months: exactly 12 consecutive months starting this month.`;

    // ── 13 · Superhuman Protocols ─────────────────────────────
    case 13: return h + `SECTION 13 — SUPERHUMAN PROTOCOLS
Prose (minimum 350 words): cold/heat therapy specific to this nervous system (temperatures, durations, timing). Light protocol morning/day/evening/night. 4 breathing techniques for activation/stress-relief/vagus/creativity with exact steps. Blood panel: exact markers 2x/year with target ranges.

Also return the 7 daily rituals and 4 seasonal rituals as tile data.

Return: {"blocks":[...],"tile":{"rituals_days":[{"day":"Monday","label":"[ritual name]","ruler":"☽","ritual":"[ritual description]","detail":"[why this day for this chart]"},{"day":"Tuesday","label":"...","ruler":"♂","ritual":"...","detail":"..."},{"day":"Wednesday","label":"...","ruler":"☿","ritual":"...","detail":"..."},{"day":"Thursday","label":"...","ruler":"♃","ritual":"...","detail":"..."},{"day":"Friday","label":"...","ruler":"♀","ritual":"...","detail":"..."},{"day":"Saturday","label":"...","ruler":"♄","ritual":"...","detail":"..."},{"day":"Sunday","label":"...","ruler":"☉","ritual":"...","detail":"..."}],"rituals_seasonal":[{"label":"New Moon","cadence":"Monthly","detail":"[specific ritual for this chart]"},{"label":"Full Moon","cadence":"Monthly","detail":"..."},{"label":"Solstice","cadence":"Twice yearly","detail":"..."},{"label":"Solar Return","cadence":"Yearly","detail":"..."}]}}`;

    // ── 14 · Chinese Astrology ────────────────────────────────
    case 14: return h + `SECTION 14 — CHINESE ASTROLOGY & TCM
Prose (minimum 300 words): detailed character analysis of the animal+element combination. Health implications — which organs/tissues/emotions governed, imbalances to watch. Next 4 years forecast with themes. TCM nutrition recommendations including herbal allies.

Return: {"blocks":[...],"tile":{"chinese":{"animal":"[animal]","element":"[element]","polarity":"[Yang or Yin]","range":"[birth year range for this animal]","archetype":{"plain":"[1 sentence]","expert":"[1 sentence with TCM detail]"},"traits":["[trait 1]","[trait 2]","[trait 3]","[trait 4]","[trait 5]"],"tcm":[{"organ":"[organ]","el":"[element]","note":"[implication]"},{"organ":"...","el":"...","note":"..."},{"organ":"...","el":"...","note":"..."}],"emotions":[{"e":"[imbalanced emotion]","o":"[balanced expression]"},{"e":"...","o":"..."}],"years":[{"y":"2026","name":"[year animal]","tone":"strong","n":"[what this year means for this person]"},{"y":"2027","name":"...","tone":"soft","n":"..."},{"y":"2028","name":"...","tone":"hard","n":"..."},{"y":"2029","name":"...","tone":"soft","n":"..."},{"y":"2030","name":"...","tone":"strong","n":"..."}]}}}`;

    // ── 15 · Annual Cycles & Saturn ───────────────────────────
    case 15: return h + `SECTION 15 — ANNUAL CYCLES & SATURN
Prose (minimum 350 words): current major transits and what they mean RIGHT NOW for this person. Jupiter transit analysis current + upcoming. Saturn phase — which cycle, what it demands. Next 12-month highlights with approximate dates. Current life phase archetype and how to work with it.

Return: {"blocks":[...]}`;

    // ── 16 · Closing synthesis ────────────────────────────────
    case 16: return `${birthCtx(p)}
CHART: ${chartSummary}
Write in ${p.language}. This is the closing synthesis. Every line must be specific to this exact chart.
Block types: ["h","heading"] ["p","paragraph"] ["ol",["item",...]] ["ul",["item",...]]

CLOSING FORMULA — THE SYNTHESIS:
Generate these 5 blocks in order:
1. ["h","Daily Non-Negotiables"] + ["ol", [exactly 5 items — each a specific daily practice grounded in a named placement, not generic]]
2. ["h","Never Do"] + ["ol", [exactly 5 items — each with astrological AND physiological justification in the item text]]
3. ["h","The One Core Practice"] + ["p", the single most transformative practice for this specific chart and why]
4. ["h","Greatest Unused Potential"] + ["p", synthesize the whole chart's highest unrealized possibility]
5. ["p", one closing poetic metaphor capturing the essence of this person's chart]

Return: {"blocks":[...]}`;

    default: throw new Error(`Unknown section: ${section}`);
  }
}
