"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useNav } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";
import type { Block } from "@/lib/types";

// contentKey = the key in report_content where this chapter's prose is stored
// (matches the generation section number, NOT the display number)
const CODEX_SECTIONS = [
  { n: "01", title: "Your chart",          sub: "Natal map + element distribution",  view: "chart",     contentKey: null  },
  { n: "02", title: "Body & appearance",   sub: "Constitution · type · care",         view: "body",      contentKey: "01"  },
  { n: "03", title: "Nervous system",      sub: "Sensitivity · stress · recovery",    view: null,        contentKey: "02"  },
  { n: "04", title: "Daily protocol",      sub: "Morning · day · evening",            view: "daily",     contentKey: "03"  },
  { n: "05", title: "Expression",          sub: "Communication · conflict · voice",   view: "mind",      contentKey: "04"  },
  { n: "06", title: "Nutrition",           sub: "What to eat · what to avoid",        view: "nutrition", contentKey: "05"  },
  { n: "07", title: "Sport & movement",    sub: "How your body wants to move",        view: "sport",     contentKey: "06"  },
  { n: "08", title: "Gut health",          sub: "Microbiome · timing · stress",       view: "gut",       contentKey: "07"  },
  { n: "09", title: "Mind & cognition",    sub: "Thinking style · focus · learning",  view: null,        contentKey: "08"  },
  { n: "10", title: "Strengths & shadow",  sub: "15 strengths · 10 weak spots",       view: "strengths", contentKey: "09"  },
  { n: "11", title: "Career & mission",    sub: "Top 10 paths · what to avoid",       view: "career",    contentKey: "10"  },
  { n: "12", title: "Relationships",       sub: "Patterns · compatibility",           view: "love",      contentKey: "11"  },
  { n: "13", title: "Moon calendar",       sub: "52 weeks · daily scores",            view: "moon",      contentKey: "12"  },
  { n: "14", title: "Rituals & protocols", sub: "Anchors across the week",            view: "rituals",   contentKey: "13"  },
  { n: "15", title: "Chinese astrology",   sub: "BaZi · animal · element",            view: "chinese",   contentKey: "14"  },
  { n: "16", title: "Annual cycles",       sub: "Current transits · Saturn phase",    view: "year",      contentKey: "15"  },
  { n: "17", title: "Your synthesis",      sub: "Core practices · greatest potential",view: null,        contentKey: "16"  },
];

function parseInlineEm(s: string) {
  if (!s || !s.includes("/")) return s;
  const parts = s.split(/\/([^/]+?)\//g);
  return parts.map((p, i) => i % 2 === 1 ? <em key={i}>{p}</em> : p);
}

// Claude sometimes prefixes list items with "item" from the prompt template — strip it
function cleanItem(s: string): string {
  return s.replace(/^item\s*/i, "");
}

function ReportBlock({ block }: { block: Block }) {
  const [type, content] = block;
  if (type === "h") return <h3 className="report-h3">{content as string}</h3>;
  if (type === "p") return <p>{parseInlineEm(content as string)}</p>;
  if (type === "note") return <p className="report-note">{parseInlineEm(content as string)}</p>;
  if (type === "ul") return <ul className="report-ul">{(content as string[]).map((it, i) => <li key={i}>{parseInlineEm(cleanItem(it))}</li>)}</ul>;
  if (type === "ol") return <ol className="report-ol">{(content as string[]).map((it, i) => <li key={i}>{parseInlineEm(cleanItem(it))}</li>)}</ol>;
  if (type === "dl") return (
    <dl className="report-dl">
      {(content as [string, string][]).map(([k, v], i) => (
        <div key={i} className="report-dl-row"><dt>{k}</dt><dd>{parseInlineEm(v)}</dd></div>
      ))}
    </dl>
  );
  return null;
}

export default function ReportPage() {
  const router = useRouter();
  const nav = useNav();
  const { report, profile } = useApp();
  const reportContent = report.data!.report_content ?? {};
  const [openCh, setOpenCh] = useState<string | null>(null);
  const chapter = openCh ? CODEX_SECTIONS.find((s) => s.n === openCh) : null;

  if (chapter) {
    const key = chapter.contentKey;
    const isChart = chapter.n === "01";
    const planets = report.data?.chart_planets ?? [];
    const blocks: Block[] = key && reportContent[key]?.length
      ? reportContent[key]
      : isChart ? [] : [["p", "(This chapter is still being written.)"]];

    return (
      <div className="page">
        <SectionHeader onBack={() => setOpenCh(null)} backLabel="Report" eyebrow={`Chapter ${chapter.n}`} title={chapter.title} />
        <div className="report-prose">
          <div className="report-chapter-sub">{chapter.sub}</div>
          {isChart && planets.length > 0 && (
            <>
              <h3 className="report-h3">Planetary positions</h3>
              <dl className="report-dl">
                {planets.map((p) => (
                  <div key={p.planet} className="report-dl-row">
                    <dt>{p.planet}</dt>
                    <dd>{p.degree} {p.sign}{p.retrograde ? " ℞" : ""} · House {p.house}{p.note ? ` — ${p.note}` : ""}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          {blocks.map((b, i) => <ReportBlock key={i} block={b} />)}
          {chapter.view && (
            <button className="report-open-tile" onClick={() => router.push(nav(chapter.view!))}>
              <span className="k">Open the quick view</span>
              <span className="v">{chapter.title} →</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Report" title="What this is" />
      <div className="report-prose">
        <p>The home screen is the <em>door</em>. This is the <em>complete</em> report of you.</p>
        <p>{CODEX_SECTIONS.length} chapters, written from the chart cast for {profile.name} on {profile.birth_date} at {profile.birth_time} in {profile.birth_place}.</p>
        <p className="report-chapters-lede">Open any chapter to read it.</p>
        <ol className="report-chapters">
          {CODEX_SECTIONS.map((s) => (
            <li key={s.n}>
              <button className="report-chapter-row" onClick={() => setOpenCh(s.n)}>
                <span className="n">{s.n}</span>
                <span className="body">
                  <span className="title">{s.title}</span>
                  <span className="sub">{s.sub}</span>
                </span>
                <span className="meta">→</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
