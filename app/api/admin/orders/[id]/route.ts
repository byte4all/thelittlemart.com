import { NextResponse } from "next/server";
import type { PickupReminderRule } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "../../_utils";

const orderInclude = {
  user: {
    select: {
      name: true,
      email: true,
    },
  },
  items: {
    include: {
      product: {
        select: {
          name: true,
          thumbnail: true,
          price: true,
        },
      },
    },
  },
} as const;

const PICKUP_REMINDER_RULES: PickupReminderRule[] = [
  "MANUAL",
  "TWENTY_FOUR_HOURS_BEFORE",
  "NIGHT_BEFORE_MIDNIGHT",
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdminApi(request);
  if (forbidden) return forbidden;

  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdminApi(request);
  if (forbidden) return forbidden;

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      paymentStatus,
      trackingNumber,
      trackingUrl,
      pickupScheduledAt,
      pickupReminderRule,
    } = body as {
      status?: string;
      paymentStatus?: string;
      trackingNumber?: string | null;
      trackingUrl?: string | null;
      pickupScheduledAt?: string | null;
      pickupReminderRule?: PickupReminderRule;
    };

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (trackingNumber !== undefined) {
      updateData.trackingNumber =
        typeof trackingNumber === "string" ? trackingNumber.trim() || null : null;
    }
    if (trackingUrl !== undefined) {
      updateData.trackingUrl =
        typeof trackingUrl === "string" ? trackingUrl.trim() || null : null;
    }
    if (pickupScheduledAt !== undefined) {
      if (pickupScheduledAt === null || pickupScheduledAt === "") {
        updateData.pickupScheduledAt = null;
      } else {
        const parsed = new Date(pickupScheduledAt);
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json(
            { success: false, error: "Invalid pickup date/time" },
            { status: 400 }
          );
        }
        updateData.pickupScheduledAt = parsed;
      }
    }
    if (pickupReminderRule !== undefined) {
      if (!PICKUP_REMINDER_RULES.includes(pickupReminderRule)) {
        return NextResponse.json(
          { success: false, error: "Invalid pickup reminder rule" },
          { status: 400 }
        );
      }
      updateData.pickupReminderRule = pickupReminderRule;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: orderInclude,
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
