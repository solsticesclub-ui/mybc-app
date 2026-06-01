export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: users } = await supabase
    .from("users")
    .select("token, name, status")
    .eq("email", email.trim().toLowerCase())
    .order("created_at", { ascending: false });

  if (!users || users.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return NextResponse.json({
    accounts: users.map((u) => ({
      name: u.name,
      status: u.status,
      url: `${appUrl}/app/${u.token}/hub`,
    })),
  });
}
