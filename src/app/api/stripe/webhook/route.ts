import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Stripe requires the raw body for signature verification
export const dynamic = "force-dynamic";

async function upsertSubscription(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  sub: Stripe.Subscription
) {
  const userId = sub.metadata?.supabase_user_id;
  if (!userId) return;

  await supabase.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripe_subscription_id: sub.id,
    status: sub.status,
    current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (!userId) break;

      // Retrieve subscription to get full object
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await upsertSubscription(supabase, sub);
      }

      // Create the report row and trigger generation
      await supabase.from("reports").upsert({
        user_id: userId,
        generation_status: "pending",
      }, { onConflict: "user_id" });

      // Fire-and-forget generation (via internal fetch so it runs async)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      fetch(`${appUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY! },
        body: JSON.stringify({ userId }),
      }).catch(() => {});

      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscription(supabase, sub);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
