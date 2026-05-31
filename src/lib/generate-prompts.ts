// Shared prompt builders and Claude caller for the 4-step generation pipeline

import Anthropic from "@anthropic-ai/sdk";
import type { ReportData } from "./types";

export const SYSTEM = `You are an expert astrologer, biohacker, TCM practitioner, and human optimization coach.
You generate exhaustive, deeply personalized reports. Never be generic — every claim must be grounded in a specific placement.
Speak directly to the person ("you").
Return ONLY valid JSON — no markdown fences, no commentary outside the JSON object.`;

export async function callClaude(prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 6000,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  return raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
}

export function birthCtx(p: { name: string; birth_date: string; birth_time: string; birth_place: string; language: string }) {
  return `PERSON: ${p.name}
DATE OF BIRTH: ${p.birth_date}
TIME OF BIRTH: ${p.birth_time}
PLACE OF BIRTH: ${p.birth_place}
REPORT LANGUAGE: ${p.language}
TODAY'S DATE: ${new Date().toISOString().slice(0, 10)}`;
}

export function chartSummaryFromData(data: ReportData): string {
  const placed = data.chart_signs
    .filter((s) => s.planets.length > 0)
    .map((s) => `${s.planets.join(", ")} in ${s.sign}`)
    .join("; ");
  const el = data.chart_distribution.elements.map((e) => `${e.l} ${e.v}%`).join(", ");
  return `Placements: ${placed}. Elements: ${el}. ${data.chart_distribution.summary.expert}`;
}

// ── Step 1: structured app data ────────────────────────────────
export function promptStep1(p: ReturnType<typeof birthCtx> extends string ? Parameters<typeof birthCtx>[0] : never) {
  return `${birthCtx(p)}

Generate ALL structured app data as a single JSON object. Write in ${p.language}. Be specific — every value grounded in a placement.

Return this exact JSON shape:

{
  "chart_signs": [
    {"sign":"Aries","glyph":"♈","planets":[],"count":0},
    {"sign":"Taurus","glyph":"♉","planets":[],"count":0},
    {"sign":"Gemini","glyph":"♊","planets":[],"count":0},
    {"sign":"Cancer","glyph":"♋","planets":[],"count":0},
    {"sign":"Leo","glyph":"♌","planets":[],"count":0},
    {"sign":"Virgo","glyph":"♍","planets":[],"count":0},
    {"sign":"Libra","glyph":"♎","planets":[],"count":0},
    {"sign":"Scorpio","glyph":"♏","planets":[],"count":0},
    {"sign":"Sagittarius","glyph":"♐","planets":[],"count":0},
    {"sign":"Capricorn","glyph":"♑","planets":[],"count":0},
    {"sign":"Aquarius","glyph":"♒","planets":[],"count":0},
    {"sign":"Pisces","glyph":"♓","planets":[],"count":0}
  ],
  "chart_distribution":{
    "elements":[{"l":"Fire","v":35,"gloss":"..."},{"l":"Earth","v":5,"gloss":"..."},{"l":"Air","v":40,"gloss":"..."},{"l":"Water","v":20,"gloss":"..."}],
    "modes":[{"l":"Cardinal","v":45,"gloss":"..."},{"l":"Fixed","v":30,"gloss":"..."},{"l":"Mutable","v":25,"gloss":"..."}],
    "summary":{"plain":"...","expert":"..."}
  },
  "today_default":{"moonSign":"...","do":"...","avoid":"...","energy":7},
  "daily_protocol":{
    "morning":{"label":"Morning","start":"06:30","intro":{"plain":"...","expert":"..."},"items":[{"time":"06:30","action":"...","sub":"...","source":"..."}]},
    "day":{"label":"Day","start":"09:30","intro":{"plain":"...","expert":"..."},"items":[{"time":"09:30","action":"...","sub":"...","source":"..."}]},
    "evening":{"label":"Evening","start":"20:00","intro":{"plain":"...","expert":"..."},"items":[{"time":"20:00","action":"...","sub":"...","source":"..."}]}
  },
  "strengths":[{"title":"Title\\nWord","tag":"Strength · 01 of 15","blurb":"...","practice":["..."],"activated":"...","source":["..."]}],
  "careers":[{"n":"01","title":"...","sub":"...","plain":"...","expert":"...","sources":["..."],"practice":["..."]}],
  "career_mission":{"plain":"...","expert":"..."},
  "body":{"constitution":"...","blurb":{"plain":"...","expert":"..."},"signals":[{"l":"...","v":"High"}],"regions":[{"id":"gut","label":"...","priority":"High","note":"..."}],"practices":["..."]},
  "year_months":[{"m":"Jun","y":26,"theme":"...","color":"#1f2125","energy":7,"business":6,"body":7,"love":7,"transit":"...","plain":"...","expert":"..."}],
  "year_windows":[{"label":"Best money window","range":"...","detail":"..."},{"label":"Best love window","range":"...","detail":"..."},{"label":"Avoid big decisions","range":"...","detail":"..."},{"label":"Best rest window","range":"...","detail":"..."}],
  "love":{"blueprint":{"plain":"...","expert":"..."},"needs":[{"l":"...","sub":"..."}],"activates":["..."],"depletes":["..."],"compatibility":[{"sign":"...","glyph":"...","score":"High","note":"..."}]},
  "nutrition":{"principle":{"plain":"...","expert":"..."},"groups":[{"label":"Eat freely","tone":"eat","items":["..."]},{"label":"In moderation","tone":"limit","items":["..."]},{"label":"Avoid","tone":"avoid","items":["..."]}],"rhythm":[{"time":"...","what":"..."}]},
  "rituals_days":[{"day":"Monday","label":"...","ruler":"☽","ritual":"...","detail":"..."},{"day":"Tuesday","label":"...","ruler":"♂","ritual":"...","detail":"..."},{"day":"Wednesday","label":"...","ruler":"☿","ritual":"...","detail":"..."},{"day":"Thursday","label":"...","ruler":"♃","ritual":"...","detail":"..."},{"day":"Friday","label":"...","ruler":"♀","ritual":"...","detail":"..."},{"day":"Saturday","label":"...","ruler":"♄","ritual":"...","detail":"..."},{"day":"Sunday","label":"...","ruler":"☉","ritual":"...","detail":"..."}],
  "rituals_seasonal":[{"label":"New moon","cadence":"Monthly","detail":"..."},{"label":"Full moon","cadence":"Monthly","detail":"..."},{"label":"Solstice","cadence":"Twice yearly","detail":"..."},{"label":"Solar return","cadence":"Yearly","detail":"..."}],
  "mind":{"signature":{"label":"...","plain":"...","expert":"..."},"strengths":[{"l":"...","n":"01"}],"friction":["..."],"windows":[{"time":"06:30 – 09:00","label":"Capture","note":"..."}],"never":["..."]},
  "sport":{"philosophy":{"plain":"...","expert":"..."},"best":[{"l":"...","n":"..."}],"avoid":["..."],"week":[{"d":"Mon","l":"...","m":"50 min","n":"..."},{"d":"Tue","l":"...","m":"45 min","n":"..."},{"d":"Wed","l":"...","m":"60 min","n":"..."},{"d":"Thu","l":"...","m":"45 min","n":"..."},{"d":"Fri","l":"...","m":"60 min","n":"..."},{"d":"Sat","l":"...","m":"90 min","n":"..."},{"d":"Sun","l":"...","m":"rest","n":"..."}]},
  "chinese":{"animal":"...","element":"...","polarity":"Yang","range":"...","archetype":{"plain":"...","expert":"..."},"traits":["..."],"tcm":[{"organ":"...","el":"...","note":"..."}],"emotions":[{"e":"...","o":"..."}],"years":[{"y":"2026","name":"...","tone":"strong","n":"..."},{"y":"2027","name":"...","tone":"soft","n":"..."},{"y":"2028","name":"...","tone":"hard","n":"..."},{"y":"2029","name":"...","tone":"soft","n":"..."},{"y":"2030","name":"...","tone":"strong","n":"..."}]},
  "gut":{"principle":{"plain":"...","expert":"..."},"rituals":[{"time":"...","what":"..."}],"warnings":["..."],"reset48":[{"l":"...","n":"..."}],"testing":[{"l":"...","cadence":"..."}]}
}

Rules: chart_signs must have exact Placidus placements. strengths = exactly 15. careers = exactly 5. year_months = exactly 12 starting this month. daily_protocol = at least 5 items per phase. sport.week = exactly 7 days.`;
}

// ── Step 2: health & body prose (sections 01, 02, 04, 07, 08) ──
export function promptStep2(p: Parameters<typeof birthCtx>[0], chartSummary: string) {
  return `${birthCtx(p)}
CHART: ${chartSummary}
Write in ${p.language}. Return JSON:
{"sections":{"01":[<blocks>],"02":[<blocks>],"04":[<blocks>],"07":[<blocks>],"08":[<blocks>]}}
Blocks: ["h","heading"] ["p","paragraph"] ["note","note"] ["ul",["item",...]] ["ol",["item",...]] ["dl",[["term","def"],...]]
Italic: /text/

SECTION 01 — PHYSICAL APPEARANCE & BODY TYPE: body type/height/face from ASC+Sun+Moon, first impression, energetic presence in element, sensitive body zones by sign, optimal trained body type (specific), physical vulnerabilities.
SECTION 02 — NERVOUS SYSTEM: type and HSP level, full neurotransmitter profile (Serotonin/Dopamine/GABA/Acetylcholine/Noradrenaline — tendencies, risks, depleters), where stress stores physically, warning signs of overload in order, daily discharge rituals minute-specific (morning/midday/evening/weekly), top energy drains.
SECTION 04 — EXPRESSION & COMMUNICATION: Mercury placement communication style, strongest expression form, what blocks it, how most persuasive, conflict handling (do and don't), when to stay silent.
SECTION 07 — GUT HEALTH: why #1 priority for this chart, gut-brain-emotion connection specific to this person, daily rituals with exact timing, warning signs gut is off, 48h emergency reset protocol, long-term testing.
SECTION 08 — BRAIN OPTIMIZATION: cognitive style (Mercury), strengths and friction points, ideal learning environment, neuroplasticity protocol daily+weekly, peak creative windows, what this brain should never do.
Minimum 200 words per section.`;
}

// ── Step 3: protocols prose (sections 03, 05, 06, 13) ──────────
export function promptStep3(p: Parameters<typeof birthCtx>[0], chartSummary: string) {
  return `${birthCtx(p)}
CHART: ${chartSummary}
Write in ${p.language}. Return JSON:
{"sections":{"03":[<blocks>],"05":[<blocks>],"06":[<blocks>],"13":[<blocks>]}}
Same block types as before. Italic: /text/

SECTION 03 — DAILY PROTOCOL: Morning minute-by-minute (wake time + why, water, breathing technique+duration, movement type, journaling prompts, light protocol, fasting+first meal). Daytime (ultradian rhythm, peak focus windows with times, peak social windows, mandatory breaks, never-do list). Evening (digital sunset time+why, heat/water ritual, sleep setup temp/darkness/sound, sleep time+duration). Full supplement stack: Tier 1 essential (name+dose+timing+why chart-specific), Tier 2 important, Tier 3 optimization, never without supervision.
SECTION 05 — NUTRITION: Core principles, fasting window, macros with justification. Top 10 foods each for nervous system/gut/brain/hormones/skin. Foods to avoid with astrological+physiological reason. Addiction risks (direct). Full example day meal plan with times.
SECTION 06 — SPORT: Philosophy (Mars+Jupiter+Saturn). Optimal sports (specific+justified). Counterproductive sports+why. Full 7-day training week: sport type, duration, structure, recovery, astrological justification.
SECTION 13 — SUPERHUMAN PROTOCOLS: Cold/heat specific to this nervous system. Light protocol morning/day/evening/night. 4 breathing techniques (activation/stress-relief/vagus/creativity). New Moon ritual. Full Moon ritual. Blood panel — exact markers 2x/year with target ranges. Annual energy map month-by-month.
Minimum 200 words per section.`;
}

// ── Step 4: mission & cycles prose (sections 09–12, 15, closing)
export function promptStep4(p: Parameters<typeof birthCtx>[0], chartSummary: string) {
  return `${birthCtx(p)}
CHART: ${chartSummary}
Write in ${p.language}. Return JSON:
{
  "sections":{"09":[<blocks>],"10":[<blocks>],"11":[<blocks>],"12":[<blocks>],"15":[<blocks>]},
  "closing":{
    "daily5":["...","...","...","...","..."],
    "never5":["...","...","...","...","..."],
    "core_practice":"...",
    "greatest_potential":"...",
    "metaphor":"..."
  }
}
Same block types. Italic: /text/

SECTION 09 — STRENGTHS/WEAKNESSES/SHADOW: 15 strengths (title, source, in practice, activates). 10 weaknesses (title, source, manifestation, solution). Shadow: escapism patterns, martyr/victim loop, shadow manipulation, early warning signs. When 2+ signs appear together.
SECTION 10 — CAREER & MISSION: Top 10 careers with justification. North Node analysis (mission, karmic direction, toward/away). Saturn timeline with ages. Current life phase. Worst careers. Optimal work environment.
SECTION 11 — RELATIONSHIPS: Ideal partner profile (7H). Compatibility high/low with explanation. Attachment style + healing. Love languages (give/receive). Red flags. Friendship + social energy.
SECTION 12 — MOON CALENDAR (4 weeks from today): Every 1-2 day window: date range, moon sign+phase, scores 1-10 (Energy/Business/Body/Social), recommendation, avoid. Cover full 4 weeks.
SECTION 15 — ANNUAL CYCLES & SATURN: Current transits meaning RIGHT NOW. Jupiter analysis current+upcoming. Saturn phase. Next 12 months highlights with dates. Life phase archetype.
CLOSING: daily5 = 5 daily non-negotiables (specific to this chart). never5 = 5 things to never do (astrological+physiological). core_practice = the one thing that changes everything. greatest_potential = synthesize the whole chart. metaphor = one closing poetic sentence.
Minimum 200 words per section.`;
}
