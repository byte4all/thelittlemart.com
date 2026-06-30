import type {
  OrderNotificationStatus,
  OrderNotificationTrigger,
  OrderNotificationType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const NOTIFICATION_TYPES: OrderNotificationType[] = [
  "ORDER_CONFIRMATION",
  "PAYMENT_FAILED",
  "SHIPPING_TRACKING",
  "PICKUP_REMINDER",
];

export type NotificationSummaryEntry = {
  status: OrderNotificationStatus | null;
  lastAt: string | null;
  trigger: OrderNotificationTrigger | null;
};

export type NotificationSummary = Record<OrderNotificationType, NotificationSummaryEntry>;

const emptySummary = (): NotificationSummary =>
  Object.fromEntries(
    NOTIFICATION_TYPES.map((type) => [
      type,
      { status: null, lastAt: null, trigger: null },
    ])
  ) as NotificationSummary;

export async function logOrderNotification(params: {
  orderId: string;
  type: OrderNotificationType;
  status: OrderNotificationStatus;
  trigger?: OrderNotificationTrigger;
  recipientEmail?: string | null;
  error?: string | null;
}): Promise<void> {
  await prisma.orderNotification.create({
    data: {
      orderId: params.orderId,
      type: params.type,
      status: params.status,
      trigger: params.trigger ?? "AUTO",
      recipientEmail: params.recipientEmail ?? null,
      error: params.error ?? null,
    },
  });
}

export async function getLatestNotification(
  orderId: string,
  type: OrderNotificationType
) {
  return prisma.orderNotification.findFirst({
    where: { orderId, type },
    orderBy: { createdAt: "desc" },
  });
}

export async function hasSuccessfulAutoSend(
  orderId: string,
  type: OrderNotificationType
): Promise<boolean> {
  const row = await prisma.orderNotification.findFirst({
    where: {
      orderId,
      type,
      status: "SENT",
      trigger: "AUTO",
    },
  });
  return Boolean(row);
}

export async function getNotificationSummaryForOrder(
  orderId: string
): Promise<NotificationSummary> {
  const rows = await prisma.orderNotification.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });

  const summary = emptySummary();
  for (const type of NOTIFICATION_TYPES) {
    const latest = rows.find((r) => r.type === type);
    if (latest) {
      summary[type] = {
        status: latest.status,
        lastAt: latest.createdAt.toISOString(),
        trigger: latest.trigger,
      };
    }
  }
  return summary;
}

export async function getNotificationHistoryForOrder(orderId: string) {
  return prisma.orderNotification.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
}

export function inferSummaryFromOrderTimestamps(order: {
  paymentStatus: string;
  trackingEmailSentAt: Date | null;
  paymentFailedEmailSentAt: Date | null;
  pickupReminderSentAt: Date | null;
}): Partial<NotificationSummary> {
  const partial: Partial<NotificationSummary> = {};

  if (order.paymentStatus === "COMPLETED") {
    partial.ORDER_CONFIRMATION = {
      status: "SENT",
      lastAt: null,
      trigger: null,
    };
  }
  if (order.trackingEmailSentAt) {
    partial.SHIPPING_TRACKING = {
      status: "SENT",
      lastAt: order.trackingEmailSentAt.toISOString(),
      trigger: null,
    };
  }
  if (order.paymentFailedEmailSentAt) {
    partial.PAYMENT_FAILED = {
      status: "SENT",
      lastAt: order.paymentFailedEmailSentAt.toISOString(),
      trigger: null,
    };
  }
  if (order.pickupReminderSentAt) {
    partial.PICKUP_REMINDER = {
      status: "SENT",
      lastAt: order.pickupReminderSentAt.toISOString(),
      trigger: null,
    };
  }

  return partial;
}

export function mergeSummary(
  fromLog: NotificationSummary,
  inferred: Partial<NotificationSummary>
): NotificationSummary {
  const merged = { ...fromLog };
  for (const type of NOTIFICATION_TYPES) {
    if (!merged[type].status && inferred[type]?.status) {
      merged[type] = inferred[type]!;
    }
  }
  return merged;
}
