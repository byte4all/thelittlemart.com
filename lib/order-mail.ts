import {
  orderConfirmationEmailHtml,
  paymentFailedEmailHtml,
  pickupReminderEmailHtml,
  type OrderConfirmationProps,
} from "@/components/email-template";
import { getBaseUrl } from "@/lib/base-url";
import {
  getOrderNotifyBccForRecipient,
  isSmtpConfigured,
  sendSmtpEmail,
} from "@/lib/smtp";
import type { OrderSummaryAddress, OrderSummaryItem } from "@/lib/resend";

export type { OrderSummaryAddress, OrderSummaryItem };

/**
 * Order notifications (confirmation, payment failed, pickup reminder) via SMTP.
 * Shipping/tracking emails remain on Resend — see lib/resend.ts.
 */

export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderNumber: string;
  items: OrderSummaryItem[];
  total: number;
  shippingAddress?: OrderSummaryAddress | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "Order confirmation not sent: SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, ORDER_MAIL_FROM."
      );
    }
    return { ok: false, error: "SMTP is not configured" };
  }

  const props: OrderConfirmationProps = {
    orderNumber: params.orderNumber,
    items: params.items,
    total: params.total,
    shippingAddress: params.shippingAddress,
  };

  return sendSmtpEmail({
    to: params.to,
    subject: `Order confirmation ${params.orderNumber} – thelittlemart`,
    html: orderConfirmationEmailHtml(props),
    bcc: getOrderNotifyBccForRecipient(params.to),
  });
}

export async function sendPaymentFailedEmail(params: {
  to: string;
  orderNumber: string;
  total: number;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSmtpConfigured()) {
    return { ok: false, error: "SMTP is not configured" };
  }

  const baseUrl = getBaseUrl();

  return sendSmtpEmail({
    to: params.to,
    subject: `Payment not received – order ${params.orderNumber} – thelittlemart`,
    html: paymentFailedEmailHtml({
      orderNumber: params.orderNumber,
      total: params.total,
      shopUrl: `${baseUrl}/shop`,
      supportUrl: `${baseUrl}/customer-support`,
    }),
    bcc: getOrderNotifyBccForRecipient(params.to),
  });
}

export async function sendPickupReminderEmail(params: {
  to: string;
  orderNumber: string;
  pickupAt: Date;
  locationName: string;
  locationAddress: string;
  mapsUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSmtpConfigured()) {
    return { ok: false, error: "SMTP is not configured" };
  }

  const pickupAtLabel = params.pickupAt.toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "full",
    timeStyle: "short",
  });

  return sendSmtpEmail({
    to: params.to,
    subject: `Pickup reminder – order ${params.orderNumber} – thelittlemart`,
    html: pickupReminderEmailHtml({
      orderNumber: params.orderNumber,
      pickupAtLabel,
      locationName: params.locationName,
      locationAddress: params.locationAddress,
      mapsUrl: params.mapsUrl,
    }),
    bcc: getOrderNotifyBccForRecipient(params.to),
  });
}
