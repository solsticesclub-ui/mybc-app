export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: users, error } = await supabase
    .from("users")
    .select("token, name, email, birth_date, birth_place, language, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: reports } = await supabase
    .from("reports")
    .select("user_token, generation_status, generated_at");

  const reportMap = Object.fromEntries((reports ?? []).map((r) => [r.user_token, r]));

  const rows = (users ?? []).map((u) => ({
    ...u,
    generation_status: reportMap[u.token]?.generation_status ?? "no report",
    generated_at: reportMap[u.token]?.generated_at ?? null,
  }));

  return NextResponse.json({ users: rows });
}
