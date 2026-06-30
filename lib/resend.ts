import { Resend } from "resend";
import { ShippingNotificationEmail } from "@/components/email-template";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const DEFAULT_FROM = "thelittlemart <onboarding@resend.dev>";

/**
 * Order / transactional emails via Resend.
 * Order confirmation, payment failed, and pickup reminders use SMTP — see lib/order-mail.ts.
 * Shipping/tracking notifications stay on Resend.
 */
export function getTransactionalFromEmail(): string {
  return (
    process.env.RESEND_TRANSACTIONAL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    DEFAULT_FROM
  );
}

/**
 * Marketing / newsletter sends (broadcasts, promos).
 * Prefer RESEND_MARKETING_FROM e.g. "thelittlemart <hello@yourdomain.com>".
 * Newsletter list signup uses contacts API only; use this when sending marketing email from code.
 */
export function getMarketingFromEmail(): string {
  return (
    process.env.RESEND_MARKETING_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    DEFAULT_FROM
  );
}

/** Optional reply-to for transactional mail (e.g. support@) when From is noreply@. */
export function getTransactionalReplyTo(): string | undefined {
  const value =
    process.env.RESEND_TRANSACTIONAL_REPLY_TO?.trim() ||
    process.env.RESEND_REPLY_TO?.trim();
  return value || undefined;
}

function transactionalSendFields(): { from: string; replyTo?: string } {
  const from = getTransactionalFromEmail();
  const replyTo = getTransactionalReplyTo();
  return replyTo ? { from, replyTo } : { from };
}

/**
 * Split "John Doe" into firstName "John", lastName "Doe".
 * Single name goes to firstName.
 */
function splitName(name: string | null): { firstName?: string; lastName?: string } {
  if (!name || typeof name !== "string") return {};
  const trimmed = name.trim();
  if (!trimmed) return {};
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

/**
 * Add or update a contact in Resend (your email list).
 * Only runs when RESEND_API_KEY is set. Skips placeholder emails (e.g. stack-xxx@user.local).
 * Used for Stack Auth users on sign-in/sync, on order, and for newsletter signups.
 * Resend now uses "segments" (not audiences). Pass segmentId or audienceId (legacy) so the
 * contact is added to a list; otherwise the contact is created but not in any segment.
 * @param audienceId - Optional Resend audience/segment ID (legacy env RESEND_AUDIENCE_ID).
 * @param segmentId - Optional Resend segment ID (preferred; RESEND_SEGMENT_ID).
 */
export async function addContactToResend(params: {
  email: string;
  name?: string | null;
  audienceId?: string | null;
  segmentId?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) return { ok: true }; // no-op when Resend not configured
  const { email, name, audienceId, segmentId } = params;
  const normalized = email?.trim().toLowerCase();
  if (!normalized || normalized.endsWith("@user.local")) return { ok: true };

  const { firstName, lastName } = splitName(name ?? null);

  // Resend API: use segments to add contact to a list (audienceId treated as segment for compatibility)
  const segmentIds = [segmentId, audienceId].filter((id): id is string => Boolean(id?.trim()));
  const segments = segmentIds.length > 0
    ? segmentIds.map((id) => ({ id: id.trim() }))
    : undefined;

  try {
    const { error } = await resend.contacts.create({
      email: normalized,
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      unsubscribed: false,
      ...(segments?.length ? { segments } : {}),
    });
    if (error) {
      // Resend may return "already exists" – contact is still in list
      if (error.message?.toLowerCase().includes("already exists")) return { ok: true };
      // API key restricted to "send only" cannot use contacts API – skip without failing
      const errMsg = error.message ?? "";
      const restricted = (error as { name?: string }).name === "restricted_api_key" ||
        errMsg.toLowerCase().includes("restricted") ||
        (error as { statusCode?: number }).statusCode === 401;
      if (restricted) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Resend: API key is send-only; contacts not updated. Use a full-access key to add contacts.");
        }
        return { ok: true };
      }
      // Network / temporary errors – don't fail the main flow
      if (errMsg.includes("could not be resolved") || errMsg.includes("Unable to fetch")) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Resend: temporary error (", errMsg, "). Contact not added.");
        }
        return { ok: true };
      }
      console.error("Resend add contact error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    // Don't fail sign-in/checkout if Resend is down or key restricted
    if (process.env.NODE_ENV !== "production") {
      console.warn("Resend add contact exception:", err);
    }
    return { ok: true };
  }
}

export type OrderSummaryItem = { name: string; quantity: number; price: number };
export type OrderSummaryAddress = {
  type?: "pickup" | "shipping";
  fullName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
};

export async function sendShippingNotificationEmail(params: {
  to: string;
  orderNumber: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  items?: OrderSummaryItem[];
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("Resend: shipping notification not sent (RESEND_API_KEY not set).");
    }
    return { ok: true };
  }
  const normalizedTo = params.to?.trim().toLowerCase();
  if (!normalizedTo || normalizedTo.endsWith("@user.local")) return { ok: true };
  if (!params.trackingNumber?.trim() && !params.trackingUrl?.trim()) {
    return { ok: false, error: "Tracking number or URL is required" };
  }

  try {
    const { error } = await resend.emails.send({
      ...transactionalSendFields(),
      to: normalizedTo,
      subject: `Your order ${params.orderNumber} has shipped – thelittlemart`,
      react: ShippingNotificationEmail({
        orderNumber: params.orderNumber,
        trackingNumber: params.trackingNumber,
        trackingUrl: params.trackingUrl,
        items: params.items?.map((i) => ({ name: i.name, quantity: i.quantity })),
      }),
    });
    if (error) {
      console.error("Resend shipping notification error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("Resend shipping notification exception:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Send a marketing email (newsletter, promo). Uses RESEND_MARKETING_FROM.
 * Newsletter signup itself only adds contacts; use this when sending from the app.
 */
export async function sendMarketingEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("Resend: marketing email not sent (RESEND_API_KEY not set).");
    }
    return { ok: true };
  }

  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const normalized = recipients
    .map((e) => e?.trim().toLowerCase())
    .filter((e) => e && !e.endsWith("@user.local"));
  if (normalized.length === 0) return { ok: true };

  try {
    const { error } = await resend.emails.send({
      from: getMarketingFromEmail(),
      to: normalized,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error("Resend marketing email error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("Resend marketing email exception:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
