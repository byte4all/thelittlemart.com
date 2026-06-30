import { NextRequest, NextResponse } from "next/server";
import type { OrderNotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isPickupAddress } from "@/lib/fulfillment";
import {
  inferSummaryFromOrderTimestamps,
  mergeSummary,
  NOTIFICATION_TYPES,
  type NotificationSummary,
} from "@/lib/notification-log";
import { requireAdminApi } from "../_utils";

export type NotificationFilter =
  | "all"
  | "missing_confirmation"
  | "missing_tracking"
  | "missing_pickup_reminder"
  | "has_failures";

function buildSummaryFromNotifications(
  order: {
    paymentStatus: string;
    trackingEmailSentAt: Date | null;
    paymentFailedEmailSentAt: Date | null;
    pickupReminderSentAt: Date | null;
    notifications: Array<{
      type: OrderNotificationType;
      status: string;
      trigger: string;
      createdAt: Date;
      error: string | null;
      recipientEmail: string | null;
    }>;
  }
): NotificationSummary {
  const fromLog: NotificationSummary = Object.fromEntries(
    NOTIFICATION_TYPES.map((type) => [
      type,
      { status: null, lastAt: null, trigger: null },
    ])
  ) as NotificationSummary;

  for (const type of NOTIFICATION_TYPES) {
    const latest = order.notifications.find((n) => n.type === type);
    if (latest) {
      fromLog[type] = {
        status: latest.status as NotificationSummary[typeof type]["status"],
        lastAt: latest.createdAt.toISOString(),
        trigger: latest.trigger as NotificationSummary[typeof type]["trigger"],
      };
    }
  }

  return mergeSummary(
    fromLog,
    inferSummaryFromOrderTimestamps(order)
  );
}

function matchesFilter(
  filter: NotificationFilter,
  order: {
    paymentStatus: string;
    shippingAddress: unknown;
    pickupScheduledAt: Date | null;
    notifications: Array<{ type: OrderNotificationType; status: string }>;
  },
  summary: NotificationSummary
): boolean {
  const isPickup = isPickupAddress(order.shippingAddress);
  const isShipping = !isPickup;

  switch (filter) {
    case "all":
      return true;
    case "missing_confirmation":
      return (
        order.paymentStatus === "COMPLETED" &&
        summary.ORDER_CONFIRMATION.status !== "SENT"
      );
    case "missing_tracking":
      return (
        order.paymentStatus === "COMPLETED" &&
        isShipping &&
        summary.SHIPPING_TRACKING.status !== "SENT"
      );
    case "missing_pickup_reminder":
      return (
        order.paymentStatus === "COMPLETED" &&
        isPickup &&
        Boolean(order.pickupScheduledAt) &&
        summary.PICKUP_REMINDER.status !== "SENT"
      );
    case "has_failures":
      return order.notifications.some((n) => n.status === "FAILED");
    default:
      return true;
  }
}

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminApi(request);
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get("filter") || "all") as NotificationFilter;
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const orders = await prisma.order.findMany({
      include: {
        user: { select: { email: true, name: true } },
        notifications: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    let rows = orders.map((order) => {
      const addr = order.shippingAddress as { type?: string } | null;
      const summary = buildSummaryFromNotifications(order);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.user?.email ?? null,
        customerName: order.user?.name ?? null,
        paymentStatus: order.paymentStatus,
        fulfillmentType: addr?.type === "pickup" ? "pickup" : "shipping",
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        pickupScheduledAt: order.pickupScheduledAt?.toISOString() ?? null,
        createdAt: order.createdAt.toISOString(),
        summary,
        latestNotifications: order.notifications.slice(0, 3).map((n) => ({
          id: n.id,
          type: n.type,
          status: n.status,
          trigger: n.trigger,
          recipientEmail: n.recipientEmail,
          error: n.error,
          createdAt: n.createdAt.toISOString(),
        })),
      };
    });

    if (search) {
      rows = rows.filter(
        (r) =>
          r.orderNumber.toLowerCase().includes(search) ||
          (r.customerEmail?.toLowerCase().includes(search) ?? false) ||
          (r.customerName?.toLowerCase().includes(search) ?? false)
      );
    }

    if (filter !== "all") {
      rows = rows.filter((r) => {
        const order = orders.find((o) => o.id === r.id)!;
        return matchesFilter(filter, order, r.summary);
      });
    }

    const total = rows.length;
    const start = (page - 1) * limit;
    const paginated = rows.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      orders: paginated,
      pagination: { page, limit, total },
    });
  } catch (error) {
    console.error("GET /api/admin/notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
