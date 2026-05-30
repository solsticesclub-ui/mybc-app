import { createHmac, timingSafeEqual } from "crypto";

/**
 * Build a LemonSqueezy checkout URL by appending pre-fill params
 * to the existing checkout buy link. No API key required.
 *
 * LS passes checkout[custom] fields back in webhook meta.custom_data.
 */
export function buildCheckoutUrl(opts: {
  userId: string;
  email: string;
  name: string;
}): string {
  const base = process.env.LEMONSQUEEZY_CHECKOUT_URL!;
  const params = new URLSearchParams({
    "checkout[email]": opts.email,
    "checkout[name]": opts.name,
    "checkout[custom][supabase_user_id]": opts.userId,
  });
  return `${base}?${params.toString()}`;
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.LEMONSQUEEZY_WEBHOOK_SECRET) return false;
  const hmac = createHmac("sha256", process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
  const digest = hmac.update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}
