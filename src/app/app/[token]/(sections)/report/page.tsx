"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useNav } from "../AppShell";
import SectionHeader from "@/components/ui/SectionHeader";
import type { Block } from "@/lib/types";

const CODEX_SECTIONS = [
  { n: "01", title: "Your chart", sub: "Natal map + element distribution", view: "chart" },
  { n: "02", title: "Strengths & shadows", sub: "15 strengths · 10 weak spots", view: "strengths" },
  { n: "03", title: "Mind", sub: "Cognitive signature + attention", view: "mind" },
  { n: "04", title: "Body", sub: "Constitution · type · care", view: "body" },
  { n: "05", title: "Nutrition", sub: "What to eat · what to avoid", view: "nutrition" },
  { n: "06", title: "Sport & movement", sub: "How your body wants to move", view: "sport" },
  { n: "07", title: "Daily protocol", sub: "Morning · day · evening", view: "daily" },
  { n: "08", title: "Rituals", sub: "Anchors across the week", view: "rituals" },
  { n: "09", title: "Career & mission", sub: "Top 10 paths · what to avoid", view: "career" },
  { n: "10", title: "Love & relationships", sub: "Patterns · compatibility", view: "love" },
  { n: "11", title: "Moon calendar", sub: "52 weeks · daily scores", view: "moon" },
  { n: "12", title: "The year ahead", sub: "12 months · themes · windows", view: "year" },
  { n: "13", title: "Chinese astrology", sub: "BaZi · animal · element", view: "chinese" },
  { n: "14", title: "Gut & digestion", sub: "Microbiome · timing · stress", view: "gut" },
  { n: "15", title: "Appendix · sources", sub: "Methodology · references", view: null },
];

function toStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    // Claude sometimes returns {"plain":"...","expert":"..."} — prefer plain
    const o = v as Record<string, unknown>;
    if (typeof o.plain === "string") return o.plain;
    if (typeof o.expert === "string") return o.expert;
    if (typeof o.text === "string") return o.text;
    return JSON.stringify(v);
  }
  return String(v);
}

function parseInlineEm(raw: unknown) {
  const s = toStr(raw);
  if (!s.includes("/")) return s;
  const parts = s.split(/\/([^/]+?)\//g);
  return parts.map((p, i) => i % 2 === 1 ? <em key={i}>{p}</em> : p);
}

function ReportBlock({ block }: { block: unknown }) {
  if (!Array.isArray(block) || block.length < 2) return null;
  const [type, content] = block as [string, unknown];
  if (type === "h") return <h3 className="report-h3">{toStr(content)}</h3>;
  if (type === "p") return <p>{parseInlineEm(content)}</p>;
  if (type === "note") return <p className="report-note">{parseInlineEm(content)}</p>;
  if (type === "ul") {
    const items = Array.isArray(content) ? content : [content];
    return <ul className="report-ul">{items.map((it, i) => <li key={i}>{parseInlineEm(it)}</li>)}</ul>;
  }
  if (type === "ol") {
    const items = Array.isArray(content) ? content : [content];
    return <ol className="report-ol">{items.map((it, i) => <li key={i}>{parseInlineEm(it)}</li>)}</ol>;
  }
  if (type === "dl") {
    const rows = Array.isArray(content) ? content : [];
    return (
      <dl className="report-dl">
        {rows.map((row, i) => {
          const [k, v] = Array.isArray(row) ? row : [toStr(row), ""];
          return <div key={i} className="report-dl-row"><dt>{toStr(k)}</dt><dd>{parseInlineEm(v)}</dd></div>;
        })}
      </dl>
    );
  }
  return null;
}

export default function ReportPage() {
  const router = useRouter();
  const nav = useNav();
  const { report, profile, mode, setMode } = useApp();
  const reportContent = report.data!.report_content ?? {};
  const [openCh, setOpenCh] = useState<string | null>(null);
  const chapter = openCh ? CODEX_SECTIONS.find((s) => s.n === openCh) : null;

  if (chapter) {
    const blocks: Block[] = reportContent[chapter.n] ?? [["p", "(Chapter content not yet written.)"]];
    return (
      <div className="page">
        <SectionHeader onBack={() => setOpenCh(null)} eyebrow={`Report · Chapter ${chapter.n}`} title={chapter.title} mode={mode} setMode={setMode} />
        <div className="report-prose">
          <div className="report-chapter-sub">{chapter.sub}</div>
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
      <SectionHeader onBack={() => router.push(nav("hub"))} eyebrow="Report" title="What this is" mode={mode} setMode={setMode} />
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
