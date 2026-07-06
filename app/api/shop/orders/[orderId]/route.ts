import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserAndSync } from "@/lib/auth";

/** GET: fetch a single order for the current user. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getAuthUserAndSync(request);
    if (!user) {
      return NextResponse.json({ error: "Please sign in to view this order." }, { status: 401 });
    }

    const { orderId } = await params;
    if (!orderId?.trim()) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId.trim() },
      include: {
        items: { include: { product: { select: { name: true, slug: true } } } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const addr = order.shippingAddress as { type?: string } | null;

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: Number(order.total),
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping),
        discountAmount: Number(order.discountAmount),
        promoCode: order.promoCode,
        createdAt: order.createdAt.toISOString(),
        fulfillmentType: addr?.type === "pickup" ? "pickup" : "shipping",
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        pickupScheduledAt: order.pickupScheduledAt?.toISOString() ?? null,
        items: order.items.map((i) => ({
          productName: i.product.name,
          quantity: i.quantity,
          price: Number(i.price),
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/shop/orders/[orderId] error:", error);
    return NextResponse.json({ error: "Failed to load order." }, { status: 500 });
  }
}
