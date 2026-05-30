export const dynamic = "force-dynamic";

import { buildCheckoutUrl } from "@/lib/lemonsqueezy";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { userId, email, name } = await request.json();
  if (!userId || !email) {
    return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
  }

  try {
    const url = buildCheckoutUrl({ userId, email, name: name ?? email });
    return NextResponse.json({ url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not create checkout" }, { status: 500 });
  }
}
