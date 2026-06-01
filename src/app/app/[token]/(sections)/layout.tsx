import { notFound, redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import type { Report, UserProfile } from "@/lib/types";
import AppShell from "./AppShell";

export default async function SectionsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" && token === "demo") {
    const { DEMO_REPORT, DEMO_PROFILE } = await import("@/lib/demo-data");
    return (
      <AppShell token="demo" report={DEMO_REPORT} profile={DEMO_PROFILE} isDemo>
        {children}
      </AppShell>
    );
  }

  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("token", token)
    .single();

  if (!user) notFound();

  if (user.status === "pending" || user.status === "past_due") {
    redirect(`/app/${token}/generating`);
  }

  if (user.status === "cancelled") {
    redirect(`/app/${token}/generating?cancelled=1`);
  }

  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("user_token", token)
    .maybeSingle();

  const inProgress = ["pending", "generating_chart", "generating_health", "generating_protocols", "generating_mission"].includes(
    report?.generation_status ?? ""
  );
  if (!report || inProgress) redirect(`/app/${token}/generating`);
  if (report.generation_status === "failed") redirect(`/app/${token}/generating?error=1`);

  const profile: UserProfile = {
    token: user.token,
    email: user.email,
    name: user.name,
    birth_date: user.birth_date,
    birth_time: user.birth_time,
    birth_place: user.birth_place,
    language: user.language,
    status: user.status,
    created_at: user.created_at,
  };

  return (
    <AppShell token={token} report={report as Report} profile={profile}>
      {children}
    </AppShell>
  );
}
