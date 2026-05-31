export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { callClaude, promptStep1, chartSummaryFromData } from "@/lib/generate-prompts";
import { NextResponse } from "next/server";
import type { ReportData } from "@/lib/types";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 404 });

  await supabase.from("reports").upsert(
    { user_id: user.id, generation_status: "generating_chart" },
    { onConflict: "user_id" }
  );

  const raw = await callClaude(promptStep1(profile));
  const structured = JSON.parse(raw) as Omit<ReportData, "report_content">;

  await supabase.from("reports").update({
    generation_status: "generating_health",
    data: { ...structured, report_content: {} },
  }).eq("user_id", user.id);

  return NextResponse.json({ ok: true, chartSummary: chartSummaryFromData({ ...structured, report_content: {} }) });
}
