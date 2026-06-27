import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

/** From address for transactional emails. Use a verified domain in production. */
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Aquaheaven <onboarding@resend.dev>";

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

/**
 * Send order confirmation email (order summary) to the customer.
 * Uses Resend's send API – works with "send only" API keys.
 */
export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderNumber: string;
  items: OrderSummaryItem[];
  total: number;
  shippingAddress?: OrderSummaryAddress | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("Resend: order confirmation not sent (RESEND_API_KEY not set). Set RESEND_API_KEY and RESEND_FROM_EMAIL to send emails.");
    }
    return { ok: true };
  }
  const { to, orderNumber, items, total, shippingAddress } = params;
  const normalizedTo = to?.trim().toLowerCase();
  if (!normalizedTo || normalizedTo.endsWith("@user.local")) return { ok: true };

  const lines = items.map(
    (i) => `<tr><td>${escapeHtml(i.name)}</td><td>${i.quantity}</td><td>RM ${Number(i.price).toFixed(2)}</td><td>RM ${(i.quantity * Number(i.price)).toFixed(2)}</td></tr>`
  ).join("");
  const addressBlock = shippingAddress && (shippingAddress.fullName || shippingAddress.address)
    ? `
    <h3 style="margin-top:24px">${shippingAddress.type === "pickup" ? "Pickup location" : "Shipping address"}</h3>
    <p style="margin:0;color:#374151">
      ${escapeHtml(shippingAddress.fullName ?? "")}<br/>
      ${escapeHtml(shippingAddress.address ?? "")}<br/>
      ${[shippingAddress.city, shippingAddress.state, shippingAddress.zip].filter(Boolean).join(", ")}<br/>
      ${escapeHtml(shippingAddress.country ?? "")}
      ${shippingAddress.phone ? `<br/>${escapeHtml(shippingAddress.phone)}` : ""}
    </p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order ${escapeHtml(orderNumber)}</title></head>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin:0 0 16px">Thank you for your order</h2>
  <p>Your payment has been received. Order reference: <strong>${escapeHtml(orderNumber)}</strong></p>
  <table style="width:100%;border-collapse:collapse;margin-top:16px">
    <thead>
      <tr style="border-bottom:2px solid #e5e7eb;text-align:left">
        <th style="padding:8px 0">Item</th>
        <th style="padding:8px 0">Qty</th>
        <th style="padding:8px 0">Unit price</th>
        <th style="padding:8px 0">Subtotal</th>
      </tr>
    </thead>
    <tbody>${lines}</tbody>
  </table>
  <p style="margin-top:16px;font-size:18px"><strong>Total: RM ${Number(total).toFixed(2)}</strong></p>
  ${addressBlock}
  <p style="margin-top:24px;color:#6b7280;font-size:14px">— Aquaheaven</p>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedTo,
      subject: `Order confirmation ${orderNumber} – Aquaheaven`,
      html,
    });
    if (error) {
      console.error("Resend order confirmation error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("Resend order confirmation exception:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
