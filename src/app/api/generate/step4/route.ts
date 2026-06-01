export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { createServiceClient } from "@/lib/supabase/server";
import { callClaude, promptStep4, chartSummaryFromData } from "@/lib/generate-prompts";
import { NextRequest, NextResponse } from "next/server";
import type { ReportData, Block } from "@/lib/types";

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: user } = await supabase.from("users").select("*").eq("token", token).single();
  const { data: report } = await supabase.from("reports").select("data").eq("user_token", token).single();
  if (!user || !report?.data) return NextResponse.json({ error: "Missing data" }, { status: 404 });

  await supabase.from("reports").update({ generation_status: "generating_mission" }).eq("user_token", token);

  const existingData = report.data as ReportData;
  const raw = await callClaude(promptStep4(user, chartSummaryFromData(existingData)));
  const result = JSON.parse(raw) as {
    sections: Record<string, unknown[]>;
    closing: { daily5: string[]; never5: string[]; core_practice: string; greatest_potential: string; metaphor: string };
  };

  const closingBlocks: Block[] = [
    ["h", "The 5 things to do every day"], ["ol", result.closing.daily5],
    ["h", "The 5 things to never do"],     ["ol", result.closing.never5],
    ["h", "The one core practice"],         ["p", result.closing.core_practice],
    ["h", "Greatest unused potential"],     ["p", result.closing.greatest_potential],
    ["p", result.closing.metaphor],
  ];

  await supabase.from("reports").update({
    generation_status: "complete",
    generated_at: new Date().toISOString(),
    data: {
      ...existingData,
      report_content: {
        ...existingData.report_content,
        ...result.sections,
        "16": closingBlocks,
      },
    },
  }).eq("user_token", token);

  return NextResponse.json({ ok: true });
}
