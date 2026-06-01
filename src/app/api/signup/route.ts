export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, name, birthDate, birthTime, birthPlace, language } = body;

  if (!email || !name || !birthDate || !birthTime || !birthPlace) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: email.trim().toLowerCase(),
      name: name.trim(),
      birth_date: birthDate,
      birth_time: birthTime,
      birth_place: birthPlace.trim(),
      language: language ?? "English",
      status: "active",
    })
    .select("token")
    .single();

  if (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }

  return NextResponse.json({ token: data.token });
}
