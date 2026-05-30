export const dynamic = "force-dynamic";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { userId, email } = await request.json();
  if (!userId || !email) {
    return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
  }

  // Find or create Stripe customer
  const supabase = await createServiceClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  let customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { supabase_user_id: userId } });
    customerId = customer.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${appUrl}/generating?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/onboarding`,
    metadata: { supabase_user_id: userId },
    subscription_data: { metadata: { supabase_user_id: userId } },
  });

  return NextResponse.json({ url: session.url });
}
