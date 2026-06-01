export const dynamic = "force-dynamic";

import { verifyWebhookSignature } from "@/lib/lemonsqueezy";
import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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
  const userToken = customData?.user_token;

  if (!userToken) return NextResponse.json({ received: true });

  const data = (event.data as Record<string, unknown>)?.attributes as Record<string, unknown>;
  const supabase = createServiceClient();

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_renewed": {
      const status = ACTIVE_STATUSES.has(data?.status as string)
        ? "active"
        : (data?.status as string) ?? "incomplete";
      const subscriptionId = (event.data as Record<string, unknown>)?.id as string;
      const customerId = data?.customer_id?.toString() ?? null;

      await supabase.from("users").update({
        status,
        ls_customer_id: customerId,
        ls_subscription_id: subscriptionId,
      }).eq("token", userToken);

      if (eventName === "subscription_created" && status === "active") {
        await supabase.from("reports").upsert({
          user_token: userToken,
          generation_status: "pending",
        }, { onConflict: "user_token" });
      }
      break;
    }

    case "subscription_cancelled":
    case "subscription_expired": {
      await supabase.from("users").update({ status: "cancelled" }).eq("token", userToken);
      break;
    }

    case "subscription_payment_failed": {
      await supabase.from("users").update({ status: "past_due" }).eq("token", userToken);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
