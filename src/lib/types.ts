export interface UserProfile {
  id: string;
  name: string;
  birth_date: string;       // ISO date string "YYYY-MM-DD"
  birth_time: string;       // "HH:MM"
  birth_place: string;
  birth_lat: number | null;
  birth_lng: number | null;
  language: string;         // e.g. "English", "French"
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: "active" | "past_due" | "canceled" | "trialing" | "incomplete";
  current_period_end: string | null;
  created_at: string;
}

// ── Report content types ──────────────────────────────────────

export type BlockType = "h" | "p" | "note" | "ul" | "ol" | "dl";
export type Block =
  | ["h", string]
  | ["p", string]
  | ["note", string]
  | ["ul", string[]]
  | ["ol", string[]]
  | ["dl", [string, string][]];

export interface DailyItem {
  time: string;
  action: string;
  sub: string;
  source: string;
}

export interface DailyPhase {
  label: string;
  start: string;
  intro: { plain: string; expert: string };
  items: DailyItem[];
}

export interface ChartSign {
  sign: string;
  glyph: string;
  planets: string[];
  count: number;
}

export interface DistributionItem {
  l: string;
  v: number;
  gloss: string;
}

export interface Strength {
  title: string;
  tag: string;
  blurb: string;
  practice: string[];
  activated: string;
  source: string[];
}

export interface Career {
  n: string;
  title: string;
  sub: string;
  plain: string;
  expert: string;
  sources: string[];
  practice: string[];
}

export interface MoonDay {
  date: string;        // ISO string
  phase: number;       // 0..1
  phaseName: string;
  scores: { Energy: number; Business: number; Body: number; Social: number };
}

export interface YearMonth {
  m: string;
  y: number;
  theme: string;
  color: string;
  energy: number;
  business: number;
  body: number;
  love: number;
  transit: string;
  plain: string;
  expert: string;
}

export interface CompatibilityEntry {
  sign: string;
  glyph: string;
  score: string;
  note: string;
}

// ── Master report shape stored in the DB ──────────────────────

export interface ReportData {
  // Chart data
  chart_signs: ChartSign[];
  chart_distribution: {
    elements: DistributionItem[];
    modes: DistributionItem[];
    summary: { plain: string; expert: string };
  };

  // Section quick-view data (structured)
  daily_protocol: Record<string, DailyPhase>;
  today_default: { moonSign: string; do: string; avoid: string; energy: number };
  strengths: Strength[];
  careers: Career[];
  career_mission: { plain: string; expert: string };
  body: {
    constitution: string;
    blurb: { plain: string; expert: string };
    signals: { l: string; v: string }[];
    regions: { id: string; label: string; priority: string; note: string }[];
    practices: string[];
  };
  year_months: YearMonth[];
  year_windows: { label: string; range: string; detail: string }[];
  love: {
    blueprint: { plain: string; expert: string };
    needs: { l: string; sub: string }[];
    activates: string[];
    depletes: string[];
    compatibility: CompatibilityEntry[];
  };
  nutrition: {
    principle: { plain: string; expert: string };
    groups: { label: string; tone: string; items: string[] }[];
    rhythm: { time: string; what: string }[];
  };
  rituals_days: {
    day: string; label: string; ruler: string;
    ritual: string; detail: string;
  }[];
  rituals_seasonal: { label: string; cadence: string; detail: string }[];
  mind: {
    signature: { label: string; plain: string; expert: string };
    strengths: { l: string; n: string }[];
    friction: string[];
    windows: { time: string; label: string; note: string }[];
    never: string[];
  };
  sport: {
    philosophy: { plain: string; expert: string };
    best: { l: string; n: string }[];
    avoid: string[];
    week: { d: string; l: string; m: string; n: string }[];
  };
  chinese: {
    animal: string; element: string; polarity: string;
    range: string;
    archetype: { plain: string; expert: string };
    traits: string[];
    tcm: { organ: string; el: string; note: string }[];
    emotions: { e: string; o: string }[];
    years: { y: string; name: string; tone: string; n: string }[];
  };
  gut: {
    principle: { plain: string; expert: string };
    rituals: { time: string; what: string }[];
    warnings: string[];
    reset48: { l: string; n: string }[];
    testing: { l: string; cadence: string }[];
  };

  // Full prose report (15 chapters)
  report_content: Record<string, Block[]>;
}

export interface Report {
  id: string;
  user_id: string;
  generation_status: "pending" | "generating" | "complete" | "failed";
  data: ReportData | null;
  generated_at: string | null;
  created_at: string;
}
