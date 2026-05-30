export const dynamic = "force-dynamic";

import { verifyWebhookSignature } from "@/lib/lemonsqueezy";
import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// LemonSqueezy subscription statuses we care about
const ACTIVE_STATUSES = new Set(["active", "on_trial"]);

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = (event.meta as Record<string, unknown>)?.event_name as string;
  const customData = (event.meta as Record<string, unknown>)?.custom_data as Record<string, string> | undefined;
  const userId = customData?.supabase_user_id;

  if (!userId) {
    // Webhook not related to our app users — ignore
    return NextResponse.json({ received: true });
  }

  const data = (event.data as Record<string, unknown>)?.attributes as Record<string, unknown>;
  const supabase = await createServiceClient();

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_renewed": {
      const status = ACTIVE_STATUSES.has(data?.status as string) ? "active" : data?.status as string ?? "incomplete";
      const renewsAt = data?.renews_at as string | null;
      const subscriptionId = (event.data as Record<string, unknown>)?.id as string;
      const customerId = data?.customer_id?.toString() ?? null;

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: customerId,           // reusing the column for LS customer ID
        stripe_subscription_id: subscriptionId,   // reusing the column for LS subscription ID
        status,
        current_period_end: renewsAt ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "stripe_subscription_id" });

      // If this is a new active subscription, create the report row and trigger generation
      if (eventName === "subscription_created" && status === "active") {
        await supabase.from("reports").upsert({
          user_id: userId,
          generation_status: "pending",
        }, { onConflict: "user_id" });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        fetch(`${appUrl}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!,
          },
          body: JSON.stringify({ userId }),
        }).catch(() => {});
      }
      break;
    }

    case "subscription_cancelled":
    case "subscription_expired": {
      await supabase.from("subscriptions").update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
      break;
    }

    case "subscription_payment_failed": {
      await supabase.from("subscriptions").update({
        status: "past_due",
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
