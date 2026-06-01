export const dynamic = "force-dynamic";

import { buildCheckoutUrl } from "@/lib/lemonsqueezy";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { token, email, name } = await request.json();
  if (!token || !email) {
    return NextResponse.json({ error: "Missing token or email" }, { status: 400 });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = buildCheckoutUrl({ token, email, name: name ?? email, appUrl });
    return NextResponse.json({ url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not create checkout" }, { status: 500 });
  }
}
