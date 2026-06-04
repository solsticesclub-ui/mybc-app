export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, birthFullName, birthDate, birthTime, birthPlace, birthLat, birthLng, language } = body;

  if (!email || !birthFullName || !birthDate || !birthTime || !birthPlace || birthLat == null || birthLng == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Derive first name from the full birth name (first word)
  const name = birthFullName.trim().split(/\s+/)[0];

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: email.trim().toLowerCase(),
      name: name.trim(),
      birth_full_name: birthFullName.trim(),
      birth_date: birthDate,
      birth_time: birthTime,
      birth_place: birthPlace.trim(),
      birth_lat: birthLat,
      birth_lng: birthLng,
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
