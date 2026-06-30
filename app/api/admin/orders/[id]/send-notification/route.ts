import { NextResponse } from "next/server";
import type { OrderNotificationType } from "@prisma/client";
import { requireAdminApi } from "../../../_utils";
import { sendNotificationForOrder } from "@/lib/order-notifications";

const VALID_TYPES: OrderNotificationType[] = [
  "ORDER_CONFIRMATION",
  "PAYMENT_FAILED",
  "SHIPPING_TRACKING",
  "PICKUP_REMINDER",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdminApi(request);
  if (forbidden) return forbidden;

  try {
    const { id } = await params;
    const body = (await request.json()) as { type?: OrderNotificationType };
    const { type } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing notification type" },
        { status: 400 }
      );
    }

    const result = await sendNotificationForOrder(id, type, {
      force: true,
      trigger: "MANUAL",
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Failed to send notification" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      emailSent: result.emailSent ?? false,
    });
  } catch (error) {
    console.error("POST send-notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
