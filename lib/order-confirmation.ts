import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/order-mail";
import {
  acquireNotificationSendLock,
  hasSuccessfulAutoSend,
  logOrderNotification,
  releaseNotificationSendLock,
} from "@/lib/notification-log";

type OrderWithDetails = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  total: { toString(): string } | number;
  shippingAddress: unknown;
  user: { email: string | null; name: string | null } | null;
  items: Array<{
    productId?: string;
    quantity: number;
    price: { toString(): string } | number;
    product: { name: string };
  }>;
};

type SendConfirmationOpts = {
  transactionId?: string;
  trigger?: "AUTO" | "MANUAL";
  force?: boolean;
};

/**
 * Mark order as paid (CONFIRMED + COMPLETED) and send confirmation email.
 * Used by sync-payment fallback when user lands on success page (webhook may not fire).
 */
export async function markOrderPaidAndSendEmail(
  order: OrderWithDetails,
  opts?: SendConfirmationOpts & { transactionId?: string }
): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> {
  const trigger = opts?.trigger ?? "AUTO";

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: order.id },
        select: { paymentStatus: true },
      });
      if (!current) throw new Error("Order not found");
      if (current.paymentStatus === "COMPLETED") return;

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "COMPLETED",
          status: "CONFIRMED",
          ...(opts?.transactionId && { transactionId: opts.transactionId }),
        },
      });

      const itemsWithProductId = order.items.filter((i) => i.productId && i.quantity > 0) as Array<
        { productId: string; quantity: number }
      >;
      for (const item of itemsWithProductId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }
    });

    return sendOrderConfirmationForOrderData(order, {
      trigger,
      force: opts?.force,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("markOrderPaidAndSendEmail error:", err);
    return { ok: false, error: message };
  }
}

export async function sendOrderConfirmationForOrderData(
  order: OrderWithDetails,
  opts?: { trigger?: "AUTO" | "MANUAL"; force?: boolean }
): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> {
  const trigger = opts?.trigger ?? "AUTO";

  let lockHeld = false;
  if (trigger === "AUTO" && !opts?.force) {
    lockHeld = await acquireNotificationSendLock(order.id, "ORDER_CONFIRMATION");
    if (!lockHeld) {
      return { ok: true, emailSent: false };
    }
    const alreadySent = await hasSuccessfulAutoSend(order.id, "ORDER_CONFIRMATION");
    if (alreadySent) {
      await releaseNotificationSendLock(order.id, "ORDER_CONFIRMATION");
      return { ok: true, emailSent: false };
    }
  }

  try {
  const customerEmail = order.user?.email?.trim().toLowerCase();
  if (!customerEmail || customerEmail.endsWith("@user.local")) {
    await logOrderNotification({
      orderId: order.id,
      type: "ORDER_CONFIRMATION",
      status: "SKIPPED",
      trigger,
      recipientEmail: customerEmail ?? null,
      error: "No valid customer email",
    });
    return { ok: true, emailSent: false };
  }

  const shippingAddress = order.shippingAddress as {
    fullName?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
    type?: "pickup" | "shipping";
  } | null;

  const result = await sendOrderConfirmationEmail({
    to: customerEmail,
    orderNumber: order.orderNumber,
    items: order.items.map((oi) => ({
      name: oi.product.name,
      quantity: oi.quantity,
      price: Number(oi.price),
    })),
    total: Number(order.total),
    shippingAddress: shippingAddress ?? undefined,
  });

  if (!result.ok) {
    await logOrderNotification({
      orderId: order.id,
      type: "ORDER_CONFIRMATION",
      status: "FAILED",
      trigger,
      recipientEmail: customerEmail,
      error: result.error,
    });
    return { ok: false, error: result.error, emailSent: false };
  }

  await logOrderNotification({
    orderId: order.id,
    type: "ORDER_CONFIRMATION",
    status: "SENT",
    trigger,
    recipientEmail: customerEmail,
  });

  return { ok: true, emailSent: true };
  } finally {
    if (lockHeld) {
      await releaseNotificationSendLock(order.id, "ORDER_CONFIRMATION");
    }
  }
}
