import * as React from "react";
import {
  BRAND,
  BRAND_ACCENT,
  BORDER,
  SUCCESS,
  TEXT,
  TEXT_MUTED,
  emailButton,
  emailLayout,
} from "@/lib/email-brand";
import { SITE_NAME } from "@/lib/seo";

export type OrderConfirmationProps = {
  orderNumber: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  subtotal?: number;
  discountAmount?: number;
  promoCode?: string | null;
  shipping?: number;
  shippingAddress?: {
    type?: "pickup" | "shipping";
    fullName?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
  } | null;
};

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain HTML for SMTP (avoids react-dom/server in Next.js bundles). */
export function orderConfirmationEmailHtml(props: OrderConfirmationProps): string {
  const {
    orderNumber,
    items,
    total,
    subtotal,
    discountAmount = 0,
    promoCode,
    shipping = 0,
    shippingAddress: address,
  } = props;

  const lines = items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid ${BORDER}">${escapeHtml(i.name)}</td><td style="padding:8px 0;border-bottom:1px solid ${BORDER}">${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid ${BORDER}">RM ${Number(i.price).toFixed(2)}</td><td style="padding:8px 0;border-bottom:1px solid ${BORDER}">RM ${(i.quantity * Number(i.price)).toFixed(2)}</td></tr>`
    )
    .join("");

  const addressBlock =
    address && (address.fullName || address.address)
      ? `<h3 style="margin:24px 0 8px;font-size:16px;color:${TEXT}">${address.type === "pickup" ? "Pickup location" : "Shipping address"}</h3>
    <p style="margin:0;color:${TEXT_MUTED};line-height:1.6">
      ${escapeHtml(address.fullName ?? "")}<br/>
      ${escapeHtml(address.address ?? "")}<br/>
      ${[address.city, address.state, address.zip].filter(Boolean).join(", ")}<br/>
      ${escapeHtml(address.country ?? "")}
      ${address.phone ? `<br/>${escapeHtml(address.phone)}` : ""}
    </p>`
      : "";

  const bodyHtml = `
  <h2 style="margin:0 0 12px;font-size:22px;color:${BRAND}">Thank you for your order</h2>
  <p style="margin:0 0 16px;color:${TEXT_MUTED};line-height:1.6">Your payment has been received. Order reference: <strong style="color:${TEXT}">${escapeHtml(orderNumber)}</strong></p>
  <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">
    <thead><tr style="border-bottom:2px solid ${BRAND};text-align:left">
      <th style="padding:8px 0;color:${TEXT_MUTED}">Item</th><th style="padding:8px 0;color:${TEXT_MUTED}">Qty</th><th style="padding:8px 0;color:${TEXT_MUTED}">Unit</th><th style="padding:8px 0;color:${TEXT_MUTED}">Subtotal</th>
    </tr></thead><tbody>${lines}</tbody></table>
  ${
    subtotal != null
      ? `<p style="margin-top:16px;font-size:14px;color:${TEXT_MUTED}">Subtotal: RM ${Number(subtotal).toFixed(2)}</p>`
      : ""
  }
  ${
    discountAmount > 0
      ? `<p style="margin:4px 0;font-size:14px;color:${SUCCESS}">Promo${promoCode ? ` (${escapeHtml(promoCode)})` : ""}: -RM ${Number(discountAmount).toFixed(2)}</p>`
      : ""
  }
  ${
    shipping > 0
      ? `<p style="margin:4px 0;font-size:14px;color:${TEXT_MUTED}">Shipping: RM ${Number(shipping).toFixed(2)}</p>`
      : shipping === 0 && subtotal != null
        ? `<p style="margin:4px 0;font-size:14px;color:${TEXT_MUTED}">Shipping: FREE</p>`
        : ""
  }
  <p style="margin-top:16px;font-size:18px;color:${TEXT}"><strong>Total: RM ${Number(total).toFixed(2)}</strong></p>
  ${addressBlock}`;

  return emailLayout({
    title: `Order ${escapeHtml(orderNumber)}`,
    bodyHtml,
  });
}

export type PaymentFailedProps = {
  orderNumber: string;
  total: number;
  shopUrl: string;
  supportUrl: string;
};

export function paymentFailedEmailHtml(props: PaymentFailedProps): string {
  const { orderNumber, total, shopUrl, supportUrl } = props;
  const bodyHtml = `
  <h2 style="margin:0 0 12px;font-size:22px;color:${BRAND}">Payment not received</h2>
  <p style="margin:0 0 16px;color:${TEXT_MUTED};line-height:1.6">We could not confirm payment for order <strong style="color:${TEXT}">${escapeHtml(orderNumber)}</strong> (RM ${Number(total).toFixed(2)}).</p>
  <p style="margin:0;color:${TEXT_MUTED};line-height:1.6">Your order was not completed. You can place a new order or contact us if you believe payment was made.</p>
  <p style="margin-top:20px;font-size:14px">
    <a href="${escapeHtml(shopUrl)}" style="color:${BRAND};font-weight:600">Continue shopping</a>
    &nbsp;·&nbsp;
    <a href="${escapeHtml(supportUrl)}" style="color:${BRAND};font-weight:600">Customer support</a>
  </p>`;

  return emailLayout({
    title: `Payment not received – ${escapeHtml(orderNumber)}`,
    bodyHtml,
  });
}

export type PickupReminderProps = {
  orderNumber: string;
  pickupAtLabel: string;
  locationName: string;
  locationAddress: string;
  mapsUrl: string;
};

export function pickupReminderEmailHtml(props: PickupReminderProps): string {
  const { orderNumber, pickupAtLabel, locationName, locationAddress, mapsUrl } = props;
  const bodyHtml = `
  <h2 style="margin:0 0 12px;font-size:22px;color:${BRAND}">Pickup reminder</h2>
  <p style="margin:0 0 8px;color:${TEXT_MUTED}">Order reference: <strong style="color:${TEXT}">${escapeHtml(orderNumber)}</strong></p>
  <p style="margin:0 0 16px;color:${TEXT}">Scheduled pickup: <strong>${escapeHtml(pickupAtLabel)}</strong></p>
  <h3 style="margin:24px 0 8px;font-size:16px;color:${TEXT}">Pickup location</h3>
  <p style="margin:0;color:${TEXT_MUTED};line-height:1.6"><strong style="color:${TEXT}">${escapeHtml(locationName)}</strong><br/>${escapeHtml(locationAddress)}</p>
  ${emailButton(escapeHtml(mapsUrl), "Open in Google Maps")}`;

  return emailLayout({
    title: `Pickup reminder – ${escapeHtml(orderNumber)}`,
    bodyHtml,
  });
}

export type ShippingNotificationProps = {
  orderNumber: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  items?: { name: string; quantity: number }[];
};

export function shippingNotificationEmailHtml(props: ShippingNotificationProps): string {
  const { orderNumber, trackingNumber, trackingUrl, items } = props;
  const itemsBlock =
    items && items.length > 0
      ? `<h3 style="margin:24px 0 8px;font-size:16px;color:${TEXT}">Items in this shipment</h3>
      <ul style="margin:0;padding-left:20px;color:${TEXT_MUTED};line-height:1.8">
        ${items.map((i) => `<li>${escapeHtml(i.name)} × ${i.quantity}</li>`).join("")}
      </ul>`
      : "";

  const bodyHtml = `
  <h2 style="margin:0 0 12px;font-size:22px;color:${BRAND}">Your order has shipped</h2>
  <p style="margin:0 0 8px;color:${TEXT_MUTED}">Order reference: <strong style="color:${TEXT}">${escapeHtml(orderNumber)}</strong></p>
  ${
    trackingNumber
      ? `<p style="margin:0 0 8px;color:${TEXT}">Tracking number: <strong>${escapeHtml(trackingNumber)}</strong></p>`
      : ""
  }
  ${trackingUrl ? emailButton(escapeHtml(trackingUrl), "Track your parcel") : ""}
  ${itemsBlock}`;

  return emailLayout({
    title: `Order ${escapeHtml(orderNumber)} shipped`,
    bodyHtml,
  });
}

/**
 * Order confirmation email template for Resend (react option).
 */
export function OrderConfirmationEmail(props: OrderConfirmationProps) {
  const {
    orderNumber,
    items,
    total,
    subtotal,
    discountAmount,
    promoCode,
    shipping,
    shippingAddress,
  } = props;
  const address = shippingAddress;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Order {escapeHtml(orderNumber)}</title>
      </head>
      <body style={{ fontFamily: "sans-serif", maxWidth: 560, margin: "0 auto", padding: 24, color: TEXT }}>
        <div
          style={{
            height: 6,
            borderRadius: "8px 8px 0 0",
            background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_ACCENT} 100%)`,
            marginBottom: 24,
          }}
        />
        <h2 style={{ margin: "0 0 16px", color: BRAND }}>Thank you for your order</h2>
        <p style={{ color: TEXT_MUTED }}>
          Your payment has been received. Order reference:{" "}
          <strong style={{ color: TEXT }}>{escapeHtml(orderNumber)}</strong>
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${BRAND}`, textAlign: "left" }}>
              <th style={{ padding: "8px 0", color: TEXT_MUTED }}>Item</th>
              <th style={{ padding: "8px 0", color: TEXT_MUTED }}>Qty</th>
              <th style={{ padding: "8px 0", color: TEXT_MUTED }}>Unit price</th>
              <th style={{ padding: "8px 0", color: TEXT_MUTED }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx}>
                <td style={{ padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
                  {escapeHtml(i.name)}
                </td>
                <td style={{ padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>{i.quantity}</td>
                <td style={{ padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
                  RM {Number(i.price).toFixed(2)}
                </td>
                <td style={{ padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
                  RM {(i.quantity * Number(i.price)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subtotal != null && (
          <p style={{ marginTop: 16, fontSize: 14, color: TEXT_MUTED }}>
            Subtotal: RM {Number(subtotal).toFixed(2)}
          </p>
        )}
        {discountAmount != null && discountAmount > 0 && (
          <p style={{ margin: "4px 0", fontSize: 14, color: SUCCESS }}>
            Promo{promoCode ? ` (${escapeHtml(promoCode)})` : ""}: -RM{" "}
            {Number(discountAmount).toFixed(2)}
          </p>
        )}
        {shipping != null && (
          <p style={{ margin: "4px 0", fontSize: 14, color: TEXT_MUTED }}>
            Shipping: {shipping > 0 ? `RM ${Number(shipping).toFixed(2)}` : "FREE"}
          </p>
        )}
        <p style={{ marginTop: 16, fontSize: 18, color: TEXT }}>
          <strong>Total: RM {Number(total).toFixed(2)}</strong>
        </p>
        {address && (address.fullName || address.address) && (
          <>
            <h3 style={{ marginTop: 24, color: TEXT }}>
              {address.type === "pickup" ? "Pickup location" : "Shipping address"}
            </h3>
            <p style={{ margin: 0, color: TEXT_MUTED }}>
              {escapeHtml(address.fullName ?? "")}
              <br />
              {escapeHtml(address.address ?? "")}
              <br />
              {[address.city, address.state, address.zip].filter(Boolean).join(", ")}
              <br />
              {escapeHtml(address.country ?? "")}
              {address.phone ? (
                <>
                  <br />
                  {escapeHtml(address.phone)}
                </>
              ) : null}
            </p>
          </>
        )}
        <p style={{ marginTop: 24, color: TEXT_MUTED, fontSize: 14 }}>— {SITE_NAME}</p>
      </body>
    </html>
  );
}

export function ShippingNotificationEmail(props: ShippingNotificationProps) {
  const { orderNumber, trackingNumber, trackingUrl, items } = props;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Order {escapeHtml(orderNumber)} shipped</title>
      </head>
      <body style={{ fontFamily: "sans-serif", maxWidth: 560, margin: "0 auto", padding: 24, color: TEXT }}>
        <div
          style={{
            height: 6,
            borderRadius: "8px 8px 0 0",
            background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_ACCENT} 100%)`,
            marginBottom: 24,
          }}
        />
        <h2 style={{ margin: "0 0 16px", color: BRAND }}>Your order has shipped</h2>
        <p style={{ color: TEXT_MUTED }}>
          Order reference: <strong style={{ color: TEXT }}>{escapeHtml(orderNumber)}</strong>
        </p>
        {trackingNumber ? (
          <p>
            Tracking number: <strong>{escapeHtml(trackingNumber)}</strong>
          </p>
        ) : null}
        {trackingUrl ? (
          <p style={{ marginTop: 16 }}>
            <a href={trackingUrl} style={{ color: BRAND, fontWeight: 600 }}>
              Track your parcel
            </a>
          </p>
        ) : null}
        {items && items.length > 0 ? (
          <>
            <h3 style={{ marginTop: 24, color: TEXT }}>Items in this shipment</h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: TEXT_MUTED }}>
              {items.map((i, idx) => (
                <li key={idx}>
                  {escapeHtml(i.name)} × {i.quantity}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p style={{ marginTop: 24, color: TEXT_MUTED, fontSize: 14 }}>— {SITE_NAME}</p>
      </body>
    </html>
  );
}

export function PaymentFailedEmail(props: PaymentFailedProps) {
  const { orderNumber, total, shopUrl, supportUrl } = props;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Payment not received – {escapeHtml(orderNumber)}</title>
      </head>
      <body style={{ fontFamily: "sans-serif", maxWidth: 560, margin: "0 auto", padding: 24, color: TEXT }}>
        <div
          style={{
            height: 6,
            borderRadius: "8px 8px 0 0",
            background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_ACCENT} 100%)`,
            marginBottom: 24,
          }}
        />
        <h2 style={{ margin: "0 0 16px", color: BRAND }}>Payment not received</h2>
        <p style={{ color: TEXT_MUTED }}>
          We could not confirm payment for order <strong style={{ color: TEXT }}>{escapeHtml(orderNumber)}</strong>{" "}
          (RM {Number(total).toFixed(2)}).
        </p>
        <p style={{ color: TEXT_MUTED }}>
          Your order was not completed. You can place a new order or contact us if you believe payment was made.
        </p>
        <p style={{ marginTop: 16 }}>
          <a href={shopUrl} style={{ color: BRAND, fontWeight: 600 }}>
            Continue shopping
          </a>
          {" · "}
          <a href={supportUrl} style={{ color: BRAND, fontWeight: 600 }}>
            Customer support
          </a>
        </p>
        <p style={{ marginTop: 24, color: TEXT_MUTED, fontSize: 14 }}>— {SITE_NAME}</p>
      </body>
    </html>
  );
}

export function PickupReminderEmail(props: PickupReminderProps) {
  const { orderNumber, pickupAtLabel, locationName, locationAddress, mapsUrl } = props;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Pickup reminder – {escapeHtml(orderNumber)}</title>
      </head>
      <body style={{ fontFamily: "sans-serif", maxWidth: 560, margin: "0 auto", padding: 24, color: TEXT }}>
        <div
          style={{
            height: 6,
            borderRadius: "8px 8px 0 0",
            background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_ACCENT} 100%)`,
            marginBottom: 24,
          }}
        />
        <h2 style={{ margin: "0 0 16px", color: BRAND }}>Pickup reminder</h2>
        <p style={{ color: TEXT_MUTED }}>
          Order reference: <strong style={{ color: TEXT }}>{escapeHtml(orderNumber)}</strong>
        </p>
        <p>
          Scheduled pickup: <strong>{escapeHtml(pickupAtLabel)}</strong>
        </p>
        <h3 style={{ marginTop: 24, color: TEXT }}>Pickup location</h3>
        <p style={{ margin: 0, color: TEXT_MUTED }}>
          <strong style={{ color: TEXT }}>{escapeHtml(locationName)}</strong>
          <br />
          {escapeHtml(locationAddress)}
        </p>
        <p style={{ marginTop: 16 }}>
          <a href={mapsUrl} style={{ color: BRAND, fontWeight: 600 }}>
            Open in Google Maps
          </a>
        </p>
        <p style={{ marginTop: 24, color: TEXT_MUTED, fontSize: 14 }}>— {SITE_NAME}</p>
      </body>
    </html>
  );
}
