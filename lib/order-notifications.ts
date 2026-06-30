import type { Order, OrderNotificationType, PickupReminderRule, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  formatPickupAddress,
  getPickupMapsUrl,
  isPickupAddress,
  PICKUP_LOCATION,
} from "@/lib/fulfillment";
import {
  hasSuccessfulAutoSend,
  logOrderNotification,
} from "@/lib/notification-log";
import { sendOrderConfirmationForOrderData } from "@/lib/order-confirmation";
import {
  sendPaymentFailedEmail,
  sendPickupReminderEmail,
  sendShippingNotificationEmail,
} from "@/lib/resend";

const MYT = "Asia/Kuala_Lumpur";

export type OrderForNotification = Order & {
  user: { email: string | null; name: string | null } | null;
  items: Array<{
    quantity: number;
    price: { toString(): string } | number;
    product: { name: string };
    productId?: string;
  }>;
};

export type SendNotificationOpts = {
  force?: boolean;
  trigger?: "AUTO" | "MANUAL";
};

export type SendTrackingEmailOpts = SendNotificationOpts & {
  trackingNumber?: string | null;
  trackingUrl?: string | null;
};

const orderInclude = {
  user: { select: { email: true, name: true } },
  items: { include: { product: { select: { name: true } } } },
} satisfies Prisma.OrderInclude;

export function getCustomerEmail(order: { user: { email: string | null } | null }): string | null {
  const email = order.user?.email?.trim().toLowerCase();
  if (!email || email.endsWith("@user.local")) return null;
  return email;
}

export function isShippingOrder(order: { shippingAddress: unknown }): boolean {
  return !isPickupAddress(order.shippingAddress);
}

function getDatePartsInMyt(date: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MYT,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  return { y, m, d };
}

function dateKey({ y, m, d }: { y: number; m: number; d: number }): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addCalendarDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return dateKey({ y: utc.getUTCFullYear(), m: utc.getUTCMonth() + 1, d: utc.getUTCDate() });
}

export function shouldSendPickupReminder(
  order: Pick<Order, "pickupScheduledAt" | "pickupReminderRule" | "pickupReminderSentAt">,
  now: Date = new Date()
): boolean {
  if (!order.pickupScheduledAt) return false;
  if (order.pickupReminderSentAt) return false;
  if (order.pickupReminderRule === "MANUAL") return false;

  const pickupAt = order.pickupScheduledAt.getTime();
  if (pickupAt <= now.getTime()) return false;

  if (order.pickupReminderRule === "TWENTY_FOUR_HOURS_BEFORE") {
    const windowStart = pickupAt - 24 * 60 * 60 * 1000;
    return now.getTime() >= windowStart && now.getTime() < pickupAt;
  }

  if (order.pickupReminderRule === "NIGHT_BEFORE_MIDNIGHT") {
    const pickupDay = dateKey(getDatePartsInMyt(order.pickupScheduledAt));
    const nightBefore = addCalendarDays(pickupDay, -1);
    const today = dateKey(getDatePartsInMyt(now));
    return today === nightBefore;
  }

  return false;
}

export async function sendOrderConfirmationForOrder(
  orderId: string,
  opts?: SendNotificationOpts
): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });
  if (!order) return { ok: false, error: "Order not found" };
  if (order.paymentStatus !== "COMPLETED") {
    return { ok: false, error: "Order payment is not completed" };
  }

  return sendOrderConfirmationForOrderData(order, {
    trigger: opts?.trigger ?? (opts?.force ? "MANUAL" : "AUTO"),
    force: opts?.force,
  });
}

function resolveTrackingFields(
  order: { trackingNumber: string | null; trackingUrl: string | null },
  opts?: Pick<SendTrackingEmailOpts, "trackingNumber" | "trackingUrl">
): { trackingNumber: string | null; trackingUrl: string | null } {
  const trackingNumber =
    opts?.trackingNumber !== undefined
      ? (typeof opts.trackingNumber === "string" ? opts.trackingNumber.trim() : "") ||
        order.trackingNumber?.trim() ||
        null
      : order.trackingNumber?.trim() || null;
  const trackingUrl =
    opts?.trackingUrl !== undefined
      ? (typeof opts.trackingUrl === "string" ? opts.trackingUrl.trim() : "") ||
        order.trackingUrl?.trim() ||
        null
      : order.trackingUrl?.trim() || null;
  return { trackingNumber, trackingUrl };
}

export async function sendTrackingEmailForOrder(
  orderId: string,
  opts?: SendTrackingEmailOpts
): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> {
  const trigger = opts?.trigger ?? (opts?.force ? "MANUAL" : "AUTO");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });
  if (!order) return { ok: false, error: "Order not found" };

  if (isPickupAddress(order.shippingAddress)) {
    return { ok: false, error: "Tracking email is only for shipping orders" };
  }

  const { trackingNumber, trackingUrl } = resolveTrackingFields(order, opts);
  if (!trackingNumber && !trackingUrl) {
    return { ok: false, error: "Tracking number or URL is required" };
  }

  const trackingProvidedInRequest =
    opts?.trackingNumber !== undefined || opts?.trackingUrl !== undefined;
  if (trackingProvidedInRequest) {
    await prisma.order.update({
      where: { id: order.id },
      data: { trackingNumber, trackingUrl },
    });
  }

  const customerEmail = getCustomerEmail(order);
  if (!customerEmail) {
    await logOrderNotification({
      orderId: order.id,
      type: "SHIPPING_TRACKING",
      status: "SKIPPED",
      trigger,
      error: "No valid customer email",
    });
    return { ok: true, emailSent: false };
  }

  const result = await sendShippingNotificationEmail({
    to: customerEmail,
    orderNumber: order.orderNumber,
    trackingNumber,
    trackingUrl,
    items: order.items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      price: 0,
    })),
  });

  if (!result.ok) {
    await logOrderNotification({
      orderId: order.id,
      type: "SHIPPING_TRACKING",
      status: "FAILED",
      trigger,
      recipientEmail: customerEmail,
      error: result.error,
    });
    return result;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      trackingEmailSentAt: new Date(),
      status: order.status === "SHIPPED" || order.status === "DELIVERED" ? order.status : "SHIPPED",
    },
  });

  await logOrderNotification({
    orderId: order.id,
    type: "SHIPPING_TRACKING",
    status: "SENT",
    trigger,
    recipientEmail: customerEmail,
  });

  return { ok: true, emailSent: true };
}

export async function markOrderFailedAndNotify(
  orderId: string
): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });
  if (!order) return { ok: false, error: "Order not found" };

  if (order.paymentStatus !== "FAILED") {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "FAILED" },
    });
  }

  return sendPaymentFailedEmailForOrder(orderId, { trigger: "AUTO" });
}

export async function sendPaymentFailedEmailForOrder(
  orderId: string,
  opts?: SendNotificationOpts
): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> {
  const trigger = opts?.trigger ?? (opts?.force ? "MANUAL" : "AUTO");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });
  if (!order) return { ok: false, error: "Order not found" };
  if (order.paymentStatus !== "FAILED") {
    return { ok: false, error: "Order payment is not failed" };
  }

  if (!opts?.force && trigger === "AUTO") {
    if (order.paymentFailedEmailSentAt) {
      return { ok: true, emailSent: false };
    }
    const alreadySent = await hasSuccessfulAutoSend(orderId, "PAYMENT_FAILED");
    if (alreadySent) {
      return { ok: true, emailSent: false };
    }
  }

  const customerEmail = getCustomerEmail(order);
  if (!customerEmail) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentFailedEmailSentAt: new Date() },
    });
    await logOrderNotification({
      orderId: order.id,
      type: "PAYMENT_FAILED",
      status: "SKIPPED",
      trigger,
      error: "No valid customer email",
    });
    return { ok: true, emailSent: false };
  }

  const result = await sendPaymentFailedEmail({
    to: customerEmail,
    orderNumber: order.orderNumber,
    total: Number(order.total),
  });

  if (!result.ok) {
    await logOrderNotification({
      orderId: order.id,
      type: "PAYMENT_FAILED",
      status: "FAILED",
      trigger,
      recipientEmail: customerEmail,
      error: result.error,
    });
    return result;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentFailedEmailSentAt: new Date() },
  });

  await logOrderNotification({
    orderId: order.id,
    type: "PAYMENT_FAILED",
    status: "SENT",
    trigger,
    recipientEmail: customerEmail,
  });

  return { ok: true, emailSent: true };
}

export async function sendPickupReminderForOrder(
  orderId: string,
  opts?: SendNotificationOpts
): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> {
  const trigger = opts?.trigger ?? (opts?.force ? "MANUAL" : "AUTO");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });
  if (!order) return { ok: false, error: "Order not found" };

  if (!isPickupAddress(order.shippingAddress)) {
    return { ok: false, error: "Pickup reminder is only for pickup orders" };
  }
  if (!order.pickupScheduledAt) {
    return { ok: false, error: "Pickup date and time are not set" };
  }
  if (order.paymentStatus !== "COMPLETED") {
    return { ok: false, error: "Order payment is not completed" };
  }

  if (!opts?.force && trigger === "AUTO") {
    if (order.pickupReminderSentAt) return { ok: true, emailSent: false };
    const alreadySent = await hasSuccessfulAutoSend(orderId, "PICKUP_REMINDER");
    if (alreadySent) return { ok: true, emailSent: false };
    if (!shouldSendPickupReminder(order)) {
      return { ok: false, error: "Reminder window has not started yet" };
    }
  }

  const customerEmail = getCustomerEmail(order);
  if (!customerEmail) {
    await prisma.order.update({
      where: { id: order.id },
      data: { pickupReminderSentAt: new Date() },
    });
    await logOrderNotification({
      orderId: order.id,
      type: "PICKUP_REMINDER",
      status: "SKIPPED",
      trigger,
      error: "No valid customer email",
    });
    return { ok: true, emailSent: false };
  }

  const result = await sendPickupReminderEmail({
    to: customerEmail,
    orderNumber: order.orderNumber,
    pickupAt: order.pickupScheduledAt,
    locationName: PICKUP_LOCATION.name,
    locationAddress: formatPickupAddress(),
    mapsUrl: getPickupMapsUrl(),
  });

  if (!result.ok) {
    await logOrderNotification({
      orderId: order.id,
      type: "PICKUP_REMINDER",
      status: "FAILED",
      trigger,
      recipientEmail: customerEmail,
      error: result.error,
    });
    return result;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { pickupReminderSentAt: new Date() },
  });

  await logOrderNotification({
    orderId: order.id,
    type: "PICKUP_REMINDER",
    status: "SENT",
    trigger,
    recipientEmail: customerEmail,
  });

  return { ok: true, emailSent: true };
}

export async function sendNotificationForOrder(
  orderId: string,
  type: OrderNotificationType,
  opts?: SendNotificationOpts
): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> {
  const sendOpts: SendNotificationOpts = {
    force: opts?.force ?? true,
    trigger: opts?.trigger ?? "MANUAL",
  };

  switch (type) {
    case "ORDER_CONFIRMATION":
      return sendOrderConfirmationForOrder(orderId, sendOpts);
    case "PAYMENT_FAILED":
      return sendPaymentFailedEmailForOrder(orderId, sendOpts);
    case "SHIPPING_TRACKING":
      return sendTrackingEmailForOrder(orderId, sendOpts);
    case "PICKUP_REMINDER":
      return sendPickupReminderForOrder(orderId, sendOpts);
    default:
      return { ok: false, error: "Unknown notification type" };
  }
}

export async function processDuePickupReminders(): Promise<{
  processed: number;
  sent: number;
  errors: string[];
}> {
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "COMPLETED",
      pickupScheduledAt: { not: null },
      pickupReminderRule: { not: "MANUAL" },
      pickupReminderSentAt: null,
    },
    include: orderInclude,
  });

  const now = new Date();
  let sent = 0;
  const errors: string[] = [];

  for (const order of orders) {
    if (!isPickupAddress(order.shippingAddress)) continue;
    if (!shouldSendPickupReminder(order, now)) continue;

    const result = await sendPickupReminderForOrder(order.id, { trigger: "AUTO" });
    if (result.ok && result.emailSent) {
      sent += 1;
    } else if (!result.ok && result.error) {
      errors.push(`${order.orderNumber}: ${result.error}`);
    }
  }

  return { processed: orders.length, sent, errors };
}

export type { PickupReminderRule };
