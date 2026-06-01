export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("status")
    .eq("token", token)
    .single();

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: report } = await supabase
    .from("reports")
    .select("generation_status")
    .eq("user_token", token)
    .maybeSingle();

  return NextResponse.json({
    userStatus: user.status,
    reportStatus: report?.generation_status ?? null,
  });
}
