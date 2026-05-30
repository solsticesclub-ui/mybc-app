import { redirect } from "next/navigation";
import type { Report, UserProfile } from "@/lib/types";
import AppShell from "./AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    const { DEMO_REPORT, DEMO_PROFILE } = await import("@/lib/demo-data");
    return (
      <AppShell report={DEMO_REPORT} profile={DEMO_PROFILE} isDemo>
        {children}
      </AppShell>
    );
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub || sub.status !== "active") redirect("/onboarding");

  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const inProgress = ["pending", "generating_chart", "generating_health", "generating_protocols", "generating_mission", "generating"].includes(report?.generation_status ?? "");
  if (!report || inProgress) {
    redirect("/generating");
  }
  if (report.generation_status === "failed") redirect("/generating?error=1");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <AppShell report={report as Report} profile={profile as UserProfile}>
      {children}
    </AppShell>
  );
}
