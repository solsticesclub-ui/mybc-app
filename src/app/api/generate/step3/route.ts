export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { createServiceClient } from "@/lib/supabase/server";
import { callClaude, promptStep3, chartSummaryFromData } from "@/lib/generate-prompts";
import { NextRequest, NextResponse } from "next/server";
import type { ReportData } from "@/lib/types";

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: user } = await supabase.from("users").select("*").eq("token", token).single();
  const { data: report } = await supabase.from("reports").select("data").eq("user_token", token).single();
  if (!user || !report?.data) return NextResponse.json({ error: "Missing data" }, { status: 404 });

  await supabase.from("reports").update({ generation_status: "generating_protocols" }).eq("user_token", token);

  const existingData = report.data as ReportData;
  const raw = await callClaude(promptStep3(user, chartSummaryFromData(existingData)));
  const { sections } = JSON.parse(raw) as { sections: Record<string, unknown[]> };

  await supabase.from("reports").update({
    generation_status: "generating_mission",
    data: { ...existingData, report_content: { ...existingData.report_content, ...sections } },
  }).eq("user_token", token);

  return NextResponse.json({ ok: true });
}
