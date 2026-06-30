import * as React from "react";

export type OrderConfirmationProps = {
  orderNumber: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
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

/**
 * Order confirmation email template for Resend (react option).
 * Used when payment is successful (Billplz callback) via POST /api/send.
 */
export function OrderConfirmationEmail(props: OrderConfirmationProps) {
  const { orderNumber, items, total, shippingAddress } = props;
  const address = shippingAddress;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Order {escapeHtml(orderNumber)}</title>
      </head>
      <body style={{ fontFamily: "sans-serif", maxWidth: 560, margin: "0 auto", padding: 24, color: "#111" }}>
        <h2 style={{ margin: "0 0 16px" }}>Thank you for your order</h2>
        <p>
          Your payment has been received. Order reference: <strong>{escapeHtml(orderNumber)}</strong>
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              <th style={{ padding: "8px 0" }}>Item</th>
              <th style={{ padding: "8px 0" }}>Qty</th>
              <th style={{ padding: "8px 0" }}>Unit price</th>
              <th style={{ padding: "8px 0" }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx}>
                <td style={{ padding: "8px 0" }}>{escapeHtml(i.name)}</td>
                <td style={{ padding: "8px 0" }}>{i.quantity}</td>
                <td style={{ padding: "8px 0" }}>RM {Number(i.price).toFixed(2)}</td>
                <td style={{ padding: "8px 0" }}>RM {(i.quantity * Number(i.price)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 16, fontSize: 18 }}>
          <strong>Total: RM {Number(total).toFixed(2)}</strong>
        </p>
        {address && (address.fullName || address.address) && (
          <>
            <h3 style={{ marginTop: 24 }}>
              {address.type === "pickup" ? "Pickup location" : "Shipping address"}
            </h3>
            <p style={{ margin: 0, color: "#374151" }}>
              {escapeHtml(address.fullName ?? "")}
              <br />
              {escapeHtml(address.address ?? "")}
              <br />
              {[address.city, address.state, address.zip].filter(Boolean).join(", ")}
              <br />
              {escapeHtml(address.country ?? "")}
              {address.phone ? <><br />{escapeHtml(address.phone)}</> : null}
            </p>
          </>
        )}
        <p style={{ marginTop: 24, color: "#6b7280", fontSize: 14 }}>— thelittlemart </p>
      </body>
    </html>
  );
}

export type ShippingNotificationProps = {
  orderNumber: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  items?: { name: string; quantity: number }[];
};

export function ShippingNotificationEmail(props: ShippingNotificationProps) {
  const { orderNumber, trackingNumber, trackingUrl, items } = props;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Order {escapeHtml(orderNumber)} shipped</title>
      </head>
      <body style={{ fontFamily: "sans-serif", maxWidth: 560, margin: "0 auto", padding: 24, color: "#111" }}>
        <h2 style={{ margin: "0 0 16px" }}>Your order has shipped</h2>
        <p>
          Order reference: <strong>{escapeHtml(orderNumber)}</strong>
        </p>
        {trackingNumber ? (
          <p>
            Tracking number: <strong>{escapeHtml(trackingNumber)}</strong>
          </p>
        ) : null}
        {trackingUrl ? (
          <p style={{ marginTop: 16 }}>
            <a href={trackingUrl} style={{ color: "#2563eb" }}>Track your parcel</a>
          </p>
        ) : null}
        {items && items.length > 0 ? (
          <>
            <h3 style={{ marginTop: 24 }}>Items in this shipment</h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#374151" }}>
              {items.map((i, idx) => (
                <li key={idx}>
                  {escapeHtml(i.name)} × {i.quantity}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p style={{ marginTop: 24, color: "#6b7280", fontSize: 14 }}>— thelittlemart</p>
      </body>
    </html>
  );
}

export type PaymentFailedProps = {
  orderNumber: string;
  total: number;
  shopUrl: string;
  supportUrl: string;
};

export function PaymentFailedEmail(props: PaymentFailedProps) {
  const { orderNumber, total, shopUrl, supportUrl } = props;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Payment not received – {escapeHtml(orderNumber)}</title>
      </head>
      <body style={{ fontFamily: "sans-serif", maxWidth: 560, margin: "0 auto", padding: 24, color: "#111" }}>
        <h2 style={{ margin: "0 0 16px" }}>Payment not received</h2>
        <p>
          We could not confirm payment for order <strong>{escapeHtml(orderNumber)}</strong> (RM{" "}
          {Number(total).toFixed(2)}).
        </p>
        <p style={{ color: "#374151" }}>
          Your order was not completed. You can place a new order or contact us if you believe payment was made.
        </p>
        <p style={{ marginTop: 16 }}>
          <a href={shopUrl} style={{ color: "#2563eb" }}>Continue shopping</a>
          {" · "}
          <a href={supportUrl} style={{ color: "#2563eb" }}>Customer support</a>
        </p>
        <p style={{ marginTop: 24, color: "#6b7280", fontSize: 14 }}>— thelittlemart</p>
      </body>
    </html>
  );
}

export type PickupReminderProps = {
  orderNumber: string;
  pickupAtLabel: string;
  locationName: string;
  locationAddress: string;
  mapsUrl: string;
};

export function PickupReminderEmail(props: PickupReminderProps) {
  const { orderNumber, pickupAtLabel, locationName, locationAddress, mapsUrl } = props;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Pickup reminder – {escapeHtml(orderNumber)}</title>
      </head>
      <body style={{ fontFamily: "sans-serif", maxWidth: 560, margin: "0 auto", padding: 24, color: "#111" }}>
        <h2 style={{ margin: "0 0 16px" }}>Pickup reminder</h2>
        <p>
          Order reference: <strong>{escapeHtml(orderNumber)}</strong>
        </p>
        <p>
          Scheduled pickup: <strong>{escapeHtml(pickupAtLabel)}</strong>
        </p>
        <h3 style={{ marginTop: 24 }}>Pickup location</h3>
        <p style={{ margin: 0, color: "#374151" }}>
          <strong>{escapeHtml(locationName)}</strong>
          <br />
          {escapeHtml(locationAddress)}
        </p>
        <p style={{ marginTop: 16 }}>
          <a href={mapsUrl} style={{ color: "#2563eb" }}>Open in Google Maps</a>
        </p>
        <p style={{ marginTop: 24, color: "#6b7280", fontSize: 14 }}>— thelittlemart</p>
      </body>
    </html>
  );
}
