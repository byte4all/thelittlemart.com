import { NextResponse } from "next/server";
import { getNotificationHistoryForOrder } from "@/lib/notification-log";
import { requireAdminApi } from "../../../_utils";
import { prisma } from "@/lib/prisma";

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
      select: { id: true, orderNumber: true },
    });
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const notifications = await getNotificationHistoryForOrder(id);

    return NextResponse.json({
      success: true,
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        status: n.status,
        trigger: n.trigger,
        recipientEmail: n.recipientEmail,
        error: n.error,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET order notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notification history" },
      { status: 500 }
    );
  }
}
