export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { callClaude, promptStep3, chartSummaryFromData } from "@/lib/generate-prompts";
import { NextResponse } from "next/server";
import type { ReportData } from "@/lib/types";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: report } = await supabase.from("reports").select("data").eq("user_id", user.id).single();
  if (!profile || !report?.data) return NextResponse.json({ error: "Missing data" }, { status: 404 });

  await supabase.from("reports").update({ generation_status: "generating_protocols" }).eq("user_id", user.id);

  const existingData = report.data as ReportData;
  const raw = await callClaude(promptStep3(profile, chartSummaryFromData(existingData)));
  const { sections } = JSON.parse(raw) as { sections: Record<string, unknown[]> };

  await supabase.from("reports").update({
    generation_status: "generating_mission",
    data: { ...existingData, report_content: { ...existingData.report_content, ...sections } },
  }).eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
