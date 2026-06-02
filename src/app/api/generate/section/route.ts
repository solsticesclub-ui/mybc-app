export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { createServiceClient } from "@/lib/supabase/server";
import {
  callClaude,
  promptSection0,
  promptSection,
  chartSummaryFromData,
  SECTION_MAX_TOKENS,
} from "@/lib/generate-prompts";
import { NextRequest, NextResponse } from "next/server";
import type { ReportData, Block } from "@/lib/types";

export async function POST(request: NextRequest) {
  const { token, section } = await request.json();
  if (!token || section == null) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: user } = await supabase.from("users").select("*").eq("token", token).single();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const maxTokens = SECTION_MAX_TOKENS[section as number] ?? 4000;

  // ── Section 0: generates chart structured data, no prior report needed ──
  if (section === 0) {
    try {
      const raw = await callClaude(promptSection0(user), maxTokens);
      const chartData = JSON.parse(raw) as Pick<ReportData, "chart_signs" | "chart_distribution" | "today_default">;

      const { data: existing } = await supabase
        .from("reports")
        .select("user_token")
        .eq("user_token", token)
        .maybeSingle();

      let dbErr;
      if (existing) {
        ({ error: dbErr } = await supabase
          .from("reports")
          .update({ generation_status: "section_0", data: { ...chartData, report_content: {} } })
          .eq("user_token", token));
      } else {
        ({ error: dbErr } = await supabase
          .from("reports")
          .insert({ user_token: token, generation_status: "section_0", data: { ...chartData, report_content: {} } }));
      }
      if (dbErr) throw new Error(`DB save failed: ${dbErr.message}`);

      return NextResponse.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      // best-effort status update — update if row exists, insert if not
      const { data: existingOnErr } = await supabase
        .from("reports").select("user_token").eq("user_token", token).maybeSingle();
      if (existingOnErr) {
        await supabase.from("reports").update({ generation_status: "failed" }).eq("user_token", token);
      } else {
        await supabase.from("reports").insert({ user_token: token, generation_status: "failed" });
      }
      return NextResponse.json({ error: `Section 0 error: ${message}` }, { status: 500 });
    }
  }

  // ── Sections 1–16: require chart data from section 0 ──────────────────
  const { data: report } = await supabase
    .from("reports")
    .select("data")
    .eq("user_token", token)
    .single();

  if (!report?.data) {
    return NextResponse.json({ error: "Chart data missing — run section 0 first" }, { status: 404 });
  }

  const chartSummary = chartSummaryFromData(report.data as ReportData);
  const sectionKey = String(section).padStart(2, "0");
  const isLast = section === 16;

  try {
    const raw = await callClaude(promptSection(section as number, user, chartSummary), maxTokens);
    const result = JSON.parse(raw) as { blocks: Block[]; tile?: Record<string, unknown> };

    // Atomic JSONB merge via Supabase function — no read-then-write race
    const { error: dbErr } = await supabase.rpc("save_report_section", {
      p_user_token:  token,
      p_section_key: sectionKey,
      p_blocks:      result.blocks,
      p_tile:        result.tile ?? {},
      p_status:      isLast ? "complete" : `section_${section}`,
    });
    if (dbErr) throw new Error(`DB save failed: ${dbErr.message}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase.from("reports").update({ generation_status: "failed" }).eq("user_token", token);
    return NextResponse.json({ error: `Section ${section} error: ${message}` }, { status: 500 });
  }
}
