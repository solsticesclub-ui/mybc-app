import { createHmac, timingSafeEqual } from "crypto";

export function buildCheckoutUrl(opts: {
  token: string;
  email: string;
  name: string;
  appUrl: string;
}): string {
  const base = process.env.LEMONSQUEEZY_CHECKOUT_URL!;
  const redirectUrl = `${opts.appUrl}/app/${opts.token}/generating`;
  const params = new URLSearchParams({
    "checkout[email]": opts.email,
    "checkout[name]": opts.name,
    "checkout[custom][user_token]": opts.token,
    "checkout[redirect]": redirectUrl,
  });
  return `${base}?${params.toString()}`;
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !process.env.LEMONSQUEEZY_WEBHOOK_SECRET) return false;
  const hmac = createHmac("sha256", process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
  const digest = hmac.update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}
