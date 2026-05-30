export const dynamic = "force-dynamic";
export const maxDuration = 300;

import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { ReportData, Block } from "@/lib/types";

// ── Auth guard ────────────────────────────────────────────────
function isAuthorized(request: NextRequest) {
  return request.headers.get("x-internal-secret") === process.env.SUPABASE_SERVICE_ROLE_KEY;
}

// ── Claude helper ─────────────────────────────────────────────
const SYSTEM = `You are an expert astrologer, biohacker, TCM practitioner, and human optimization coach.
You generate exhaustive, deeply personalized reports. Never be generic — every claim must be grounded in a specific placement.
Speak directly to the person ("you").
Return ONLY valid JSON — no markdown fences, no commentary outside the JSON object.`;

async function callClaude(prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  return (msg.content[0] as { type: string; text: string }).text.trim();
}

async function parseJSON<T>(raw: string): Promise<T> {
  // Strip any accidental markdown fences
  const clean = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  return JSON.parse(clean) as T;
}

// ── Birth context header (injected into every prompt) ─────────
function ctx(p: { name: string; birth_date: string; birth_time: string; birth_place: string; language: string }) {
  return `PERSON: ${p.name}
DATE OF BIRTH: ${p.birth_date}
TIME OF BIRTH: ${p.birth_time}
PLACE OF BIRTH: ${p.birth_place}
REPORT LANGUAGE: ${p.language}
TODAY'S DATE: ${new Date().toISOString().slice(0, 10)}`;
}

// ══════════════════════════════════════════════════════════════
// CALL 1 — Structured app data (JSON)
// Powers all 15 quick-view tiles in the app
// ══════════════════════════════════════════════════════════════
function promptStructured(p: Parameters<typeof ctx>[0]) {
  return `${ctx(p)}

Using ONLY the birth data above, generate ALL of the following structured data as a single JSON object.
Be exhaustive and specific — never generic. Write in ${p.language}.

Return exactly this JSON shape (fill every value):

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
  "chart_distribution": {
    "elements": [
      {"l":"Fire","v":35,"gloss":"inspiration, drive, expression"},
      {"l":"Earth","v":5,"gloss":"matter, body, structure"},
      {"l":"Air","v":40,"gloss":"thought, ideas, communication"},
      {"l":"Water","v":20,"gloss":"feeling, intuition, memory"}
    ],
    "modes": [
      {"l":"Cardinal","v":45,"gloss":"initiating, starting, leading"},
      {"l":"Fixed","v":30,"gloss":"sustaining, building, holding"},
      {"l":"Mutable","v":25,"gloss":"adaptable, responsive, fluid"}
    ],
    "summary": {"plain":"...","expert":"..."}
  },
  "today_default": {
    "moonSign": "<current moon sign based on today's date>",
    "do": "<3-5 word action prompt specific to this person>",
    "avoid": "<3-5 word avoidance specific to this person>",
    "energy": 7
  },
  "daily_protocol": {
    "morning": {
      "label":"Morning","start":"06:30",
      "intro":{"plain":"...","expert":"..."},
      "items":[{"time":"06:30","action":"...","sub":"...","source":"..."}]
    },
    "day": {
      "label":"Day","start":"09:30",
      "intro":{"plain":"...","expert":"..."},
      "items":[{"time":"09:30","action":"...","sub":"...","source":"..."}]
    },
    "evening": {
      "label":"Evening","start":"20:00",
      "intro":{"plain":"...","expert":"..."},
      "items":[{"time":"20:00","action":"...","sub":"...","source":"..."}]
    }
  },
  "strengths": [
    {"title":"Title\\nWord","tag":"Strength · 01 of 15","blurb":"...","practice":["...","..."],"activated":"...","source":["☉ Sun ♊ 10H"]}
  ],
  "careers": [
    {"n":"01","title":"...","sub":"...","plain":"...","expert":"...","sources":["..."],"practice":["...","..."]}
  ],
  "career_mission": {"plain":"...","expert":"..."},
  "body": {
    "constitution":"...",
    "blurb":{"plain":"...","expert":"..."},
    "signals":[{"l":"...","v":"High"}],
    "regions":[{"id":"gut","label":"...","priority":"High","note":"..."}],
    "practices":["..."]
  },
  "year_months": [
    {"m":"Jun","y":26,"theme":"...","color":"#1f2125","energy":7,"business":6,"body":7,"love":7,"transit":"...","plain":"...","expert":"..."}
  ],
  "year_windows": [
    {"label":"Best money window","range":"...","detail":"..."},
    {"label":"Best love window","range":"...","detail":"..."},
    {"label":"Avoid big decisions","range":"...","detail":"..."},
    {"label":"Best rest window","range":"...","detail":"..."}
  ],
  "love": {
    "blueprint":{"plain":"...","expert":"..."},
    "needs":[{"l":"...","sub":"..."}],
    "activates":["..."],
    "depletes":["..."],
    "compatibility":[{"sign":"Capricorn","glyph":"♑","score":"High","note":"..."}]
  },
  "nutrition": {
    "principle":{"plain":"...","expert":"..."},
    "groups":[
      {"label":"Eat freely","tone":"eat","items":["..."]},
      {"label":"In moderation","tone":"limit","items":["..."]},
      {"label":"Avoid","tone":"avoid","items":["..."]}
    ],
    "rhythm":[{"time":"On waking","what":"..."}]
  },
  "rituals_days": [
    {"day":"Monday","label":"...","ruler":"☽","ritual":"...","detail":"..."},
    {"day":"Tuesday","label":"...","ruler":"♂","ritual":"...","detail":"..."},
    {"day":"Wednesday","label":"...","ruler":"☿","ritual":"...","detail":"..."},
    {"day":"Thursday","label":"...","ruler":"♃","ritual":"...","detail":"..."},
    {"day":"Friday","label":"...","ruler":"♀","ritual":"...","detail":"..."},
    {"day":"Saturday","label":"...","ruler":"♄","ritual":"...","detail":"..."},
    {"day":"Sunday","label":"...","ruler":"☉","ritual":"...","detail":"..."}
  ],
  "rituals_seasonal": [
    {"label":"New moon","cadence":"Monthly","detail":"..."},
    {"label":"Full moon","cadence":"Monthly","detail":"..."},
    {"label":"Solstice","cadence":"Twice yearly","detail":"..."},
    {"label":"Solar return","cadence":"Yearly","detail":"..."}
  ],
  "mind": {
    "signature":{"label":"...","plain":"...","expert":"..."},
    "strengths":[{"l":"...","n":"01"}],
    "friction":["..."],
    "windows":[{"time":"06:30 – 09:00","label":"Capture","note":"..."}],
    "never":["..."]
  },
  "sport": {
    "philosophy":{"plain":"...","expert":"..."},
    "best":[{"l":"...","n":"..."}],
    "avoid":["..."],
    "week":[
      {"d":"Mon","l":"...","m":"50 min","n":"..."},
      {"d":"Tue","l":"...","m":"45 min","n":"..."},
      {"d":"Wed","l":"...","m":"60 min","n":"..."},
      {"d":"Thu","l":"...","m":"45 min","n":"..."},
      {"d":"Fri","l":"...","m":"60 min","n":"..."},
      {"d":"Sat","l":"...","m":"90 min","n":"..."},
      {"d":"Sun","l":"...","m":"rest","n":"..."}
    ]
  },
  "chinese": {
    "animal":"...","element":"...","polarity":"Yang",
    "range":"...","archetype":{"plain":"...","expert":"..."},
    "traits":["..."],
    "tcm":[{"organ":"...","el":"...","note":"..."}],
    "emotions":[{"e":"...","o":"..."}],
    "years":[{"y":"2026","name":"...","tone":"strong","n":"..."}]
  },
  "gut": {
    "principle":{"plain":"...","expert":"..."},
    "rituals":[{"time":"On waking","what":"..."}],
    "warnings":["..."],
    "reset48":[{"l":"...","n":"..."}],
    "testing":[{"l":"...","cadence":"..."}]
  }
}

Rules:
- chart_signs: place Sun, Moon, ASC, MC, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, NN, SN in their correct signs using Placidus
- strengths: exactly 15 entries, all specific to this chart
- careers: exactly 5 entries
- year_months: exactly 12 entries starting from this month cycling forward
- daily_protocol: at least 6 items per phase
- mind.strengths: at least 7 entries
- sport.week: exactly 7 entries (Mon–Sun)
- chinese.years: exactly 5 entries (2026–2030)`;
}

// ══════════════════════════════════════════════════════════════
// CALL 2 — Prose: Body & Health (sections 01, 02, 04, 07, 08)
// ══════════════════════════════════════════════════════════════
function promptHealth(p: Parameters<typeof ctx>[0], chartSummary: string) {
  return `${ctx(p)}

CHART SUMMARY:
${chartSummary}

Write in ${p.language}. Be exhaustive and specific — every claim grounded in a placement.
Return a JSON object with this shape:

{
  "sections": {
    "01": [<blocks>],
    "02": [<blocks>],
    "04": [<blocks>],
    "07": [<blocks>],
    "08": [<blocks>]
  }
}

Block types: ["h","heading"] ["p","paragraph"] ["note","footnote"] ["ul",["item",...]] ["ol",["item",...]] ["dl",[["term","definition"],...]]
Wrap italic text in /slashes/.

Cover all of the following for each section:

SECTION 01 — PHYSICAL APPEARANCE & BODY TYPE
- Body type, height tendency, facial features based on ASC, Sun, Moon
- First impression on strangers
- Energetic body presence when in their element
- Sensitive body zones by sign rulership
- Optimal trained body type (specific, not generic)
- Physical vulnerabilities

SECTION 02 — NERVOUS SYSTEM — DEEP ANALYSIS
- Nervous system type and sensitivity level (HSP spectrum position)
- Full neurotransmitter profile: Serotonin, Dopamine, GABA, Acetylcholine, Noradrenaline
- Where stress is physically stored
- Warning signs of overload (in order of appearance)
- Daily mandatory discharge rituals (morning / midday / evening / weekly — minute-specific)
- Top energy drains and nervous system enemies

SECTION 04 — EXPRESSION & COMMUNICATION
- Natural communication style (Mercury sign/house)
- Strongest form of expression
- What blocks authentic expression
- How this person is most persuasive
- How to handle conflict (and how not to)
- When to stay silent

SECTION 07 — GUT HEALTH
- Why gut health is the #1 priority for this chart
- The gut-brain-emotion connection for this person specifically
- Daily gut rituals with exact timing
- Warning signs the gut is out of balance
- Emergency 48-hour reset protocol
- Long-term testing recommendations

SECTION 08 — BRAIN OPTIMIZATION
- Cognitive style based on Mercury placement
- Strengths and friction points in thinking
- Ideal learning environment (specific conditions)
- Neuroplasticity protocol (daily / weekly)
- Peak creative time windows
- What this brain should never do

Minimum 300 words equivalent per section.`;
}

// ══════════════════════════════════════════════════════════════
// CALL 3 — Prose: Protocols & Living (sections 03, 05, 06, 13)
// ══════════════════════════════════════════════════════════════
function promptProtocols(p: Parameters<typeof ctx>[0], chartSummary: string) {
  return `${ctx(p)}

CHART SUMMARY:
${chartSummary}

Write in ${p.language}. Be exhaustive and specific. Return:

{
  "sections": {
    "03": [<blocks>],
    "05": [<blocks>],
    "06": [<blocks>],
    "13": [<blocks>]
  }
}

Block types: ["h","heading"] ["p","paragraph"] ["note","footnote"] ["ul",["item",...]] ["ol",["item",...]] ["dl",[["term","definition"],...]]
Wrap italic text in /slashes/.

SECTION 03 — ENERGY: COMPLETE DAILY PROTOCOL
Morning protocol (minute-by-minute): optimal wake time + justification, first 5 min routine, water protocol, breathing exercise (specific technique + duration), movement type (specific to Mars/Sun), journaling prompts (Moon sign specific), light protocol, fasting window and first meal timing.
Daytime protocol: ultradian rhythm and optimal work cycle length, peak concentration windows with times, peak social energy windows, mandatory rest breaks, what to never do during the day for this type.
Evening protocol: digital sunset time and why, heat/water ritual details, sleep setup (temperature, darkness, sound), optimal sleep time and duration.
Full supplement stack:
- Tier 1 — Absolutely essential (name, dose, timing, why chart-specific)
- Tier 2 — Very important
- Tier 3 — Optimization
- Never without medical supervision

SECTION 05 — NUTRITION — COMPLETELY EXHAUSTIVE
Core nutritional principles, optimal fasting window, macronutrient split with justification.
Top 10 foods for: nervous system, gut, brain, hormones/energy, skin/hair/eyes.
Foods and substances to absolutely avoid — with astrological AND physiological explanation.
Addiction risks specific to this chart (be direct). Full example optimal day meal plan with times.

SECTION 06 — SPORT & MOVEMENT — WEEKLY PLAN
Sport philosophy (Mars sign + house, Jupiter/Saturn positions). Optimal sports (specific, justified). Counterproductive sports and why. Full 7-day training week with: sport type, duration, specific structure, recovery notes, astrological justification.

SECTION 13 — SUPERHUMAN PROTOCOLS
Cold/heat therapy protocol specific to this nervous system type. Light protocol (morning/day/evening/night). Breathing techniques: 4 specific techniques (activation / stress relief / vagus / creativity). New Moon ritual. Full Moon ritual. Blood panel — exact markers 2x/year with target ranges. Annual energy map: month-by-month optimal phases.

Minimum 300 words equivalent per section.`;
}

// ══════════════════════════════════════════════════════════════
// CALL 4 — Prose: Mission & Cycles (sections 09–12, 15, closing)
// ══════════════════════════════════════════════════════════════
function promptMission(p: Parameters<typeof ctx>[0], chartSummary: string) {
  return `${ctx(p)}

CHART SUMMARY:
${chartSummary}

Write in ${p.language}. Be exhaustive and specific. Return:

{
  "sections": {
    "09": [<blocks>],
    "10": [<blocks>],
    "11": [<blocks>],
    "12": [<blocks>],
    "15": [<blocks>]
  },
  "closing": {
    "daily5": ["...", "...", "...", "...", "..."],
    "never5": ["...", "...", "...", "...", "..."],
    "core_practice": "...",
    "greatest_potential": "...",
    "metaphor": "..."
  }
}

Block types: ["h","heading"] ["p","paragraph"] ["note","footnote"] ["ul",["item",...]] ["ol",["item",...]] ["dl",[["term","definition"],...]]
Wrap italic text in /slashes/.

SECTION 09 — STRENGTHS, WEAKNESSES & SHADOW SIDES
List exactly 15 strengths, each with: title, astrological source, what it looks like in practice, what activates it.
List exactly 10 weaknesses, each with: title, source, how it manifests, specific solution/integration path.
Shadow sides: escapism patterns, martyr/victim patterns, shadow manipulation patterns, early warning signs. When 2+ warning signs appear together.

SECTION 10 — CAREER & LIFE MISSION
Top 10 best careers with astrological justification for each. North Node analysis: life mission, karmic direction. Saturn cycle timeline (past + upcoming) with ages. Current life phase and its meaning. Worst possible careers and why. Optimal work environment.

SECTION 11 — RELATIONSHIPS & SOCIAL LIFE
Ideal partner profile based on 7th house. Highest compatibility signs with explanation. Most challenging signs. Attachment style and healing path. Love languages (giving and receiving). Red flags to recognize. Friendship patterns and social energy management.

SECTION 12 — MOON CALENDAR (next 4 weeks from today's date)
For each 1-2 day period provide: date range, moon sign and phase, energy scores 1-10 for Energy/Business/Body/Social, specific recommendation, what to avoid. Cover the full 4 weeks.

SECTION 15 — ANNUAL CYCLES & SATURN
Current major transits and what they mean RIGHT NOW. Jupiter transit analysis (current + upcoming). Saturn phase analysis. Next 12-month highlights with approximate dates. Current life phase archetype.

CLOSING FORMULA:
- daily5: 5 things to do DAILY (specific to this chart)
- never5: 5 things to NEVER do (with astrological and physiological justification)
- core_practice: the One Core Practice that changes everything for this chart
- greatest_potential: greatest unused potential (synthesize the whole chart)
- metaphor: a single closing poetic metaphor that captures this person's essence

Minimum 300 words equivalent per prose section.`;
}

// ── Chart summary for prompt context ─────────────────────────
function buildChartSummary(data: Omit<ReportData, "report_content">): string {
  const placed = data.chart_signs
    .filter((s) => s.planets.length > 0)
    .map((s) => `${s.planets.join(", ")} in ${s.sign}`)
    .join("; ");
  const el = data.chart_distribution.elements.map((e) => `${e.l} ${e.v}%`).join(", ");
  return `Placements: ${placed}. Elements: ${el}. ${data.chart_distribution.summary.expert}`;
}

// ── Prose block types for TS ──────────────────────────────────
type SectionsMap = Record<string, Block[]>;

// ══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const supabase = await createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const p = {
    name: profile.name,
    birth_date: profile.birth_date,
    birth_time: profile.birth_time,
    birth_place: profile.birth_place,
    language: profile.language ?? "English",
  };

  async function setStatus(status: string) {
    await supabase.from("reports").update({ generation_status: status }).eq("user_id", userId);
  }

  try {
    // ── Call 1: Structured data ──────────────────────────────
    await setStatus("generating_chart");
    const raw1 = await callClaude(promptStructured(p));
    const structured = await parseJSON<Omit<ReportData, "report_content">>(raw1);

    // Save partial so user can see progress
    await supabase.from("reports").upsert({
      user_id: userId,
      generation_status: "generating_health",
      data: { ...structured, report_content: {} },
    }, { onConflict: "user_id" });

    const chartSummary = buildChartSummary(structured);

    // ── Call 2: Health & body prose ──────────────────────────
    const raw2 = await callClaude(promptHealth(p, chartSummary));
    const health = await parseJSON<{ sections: SectionsMap }>(raw2);

    await supabase.from("reports").update({
      generation_status: "generating_protocols",
      data: { ...structured, report_content: { ...health.sections } },
    }).eq("user_id", userId);

    // ── Call 3: Protocols & living prose ─────────────────────
    const raw3 = await callClaude(promptProtocols(p, chartSummary));
    const protocols = await parseJSON<{ sections: SectionsMap }>(raw3);

    await supabase.from("reports").update({
      generation_status: "generating_mission",
      data: { ...structured, report_content: { ...health.sections, ...protocols.sections } },
    }).eq("user_id", userId);

    // ── Call 4: Mission & cycles prose ───────────────────────
    const raw4 = await callClaude(promptMission(p, chartSummary));
    const mission = await parseJSON<{
      sections: SectionsMap;
      closing: {
        daily5: string[];
        never5: string[];
        core_practice: string;
        greatest_potential: string;
        metaphor: string;
      };
    }>(raw4);

    // Build closing as a section "16" for display in the report
    const closingBlocks: Block[] = [
      ["h", "The 5 things to do every day"],
      ["ol", mission.closing.daily5],
      ["h", "The 5 things to never do"],
      ["ol", mission.closing.never5],
      ["h", "The one core practice"],
      ["p", mission.closing.core_practice],
      ["h", "Greatest unused potential"],
      ["p", mission.closing.greatest_potential],
      ["p", mission.closing.metaphor],
    ];

    const reportContent: SectionsMap = {
      ...health.sections,
      ...protocols.sections,
      ...mission.sections,
      "16": closingBlocks,
    };

    const finalData: ReportData = { ...structured, report_content: reportContent };

    await supabase.from("reports").update({
      generation_status: "complete",
      data: finalData,
      generated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Generation error:", err);
    await supabase.from("reports").update({
      generation_status: "failed",
    }).eq("user_id", userId);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
