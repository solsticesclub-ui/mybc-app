/**
 * /api/generate/start — called by the generating page after subscription activates.
 * Auth-protected via Supabase session (no internal secret needed).
 * Requires Vercel Pro for the 300s maxDuration.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check subscription is active
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub || sub.status !== "active") {
    return NextResponse.json({ error: "No active subscription" }, { status: 403 });
  }

  // Check report isn't already complete or in progress
  const { data: report } = await supabase
    .from("reports")
    .select("generation_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (report?.generation_status === "complete") {
    return NextResponse.json({ status: "already_complete" });
  }

  const inProgress = ["generating_chart", "generating_health", "generating_protocols", "generating_mission"].includes(
    report?.generation_status ?? ""
  );
  if (inProgress) {
    return NextResponse.json({ status: "already_running" });
  }

  // Delegate to the main generate handler using the internal secret
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${appUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    body: JSON.stringify({ userId: user.id }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }

  return NextResponse.json({ status: "complete" });
}
