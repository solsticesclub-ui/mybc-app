export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { createServiceClient } from "@/lib/supabase/server";
import { callClaude, promptStep1, chartSummaryFromData } from "@/lib/generate-prompts";
import { NextRequest, NextResponse } from "next/server";
import type { ReportData } from "@/lib/types";

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: user } = await supabase.from("users").select("*").eq("token", token).single();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.from("reports").upsert(
    { user_token: token, generation_status: "generating_chart" },
    { onConflict: "user_token" }
  );

  const raw = await callClaude(promptStep1(user));
  const structured = JSON.parse(raw) as Omit<ReportData, "report_content">;

  await supabase.from("reports").update({
    generation_status: "generating_health",
    data: { ...structured, report_content: {} },
  }).eq("user_token", token);

  return NextResponse.json({
    ok: true,
    chartSummary: chartSummaryFromData({ ...structured, report_content: {} }),
  });
}
