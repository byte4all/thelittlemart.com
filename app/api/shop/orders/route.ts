import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserAndSync } from "@/lib/auth";
import { addContactToResend } from "@/lib/resend";
import { roundTo2 } from "@/lib/currency";

/** GET: list orders (payments) for the current user. */
export async function GET(request: Request) {
  try {
    const user = await getAuthUserAndSync(request);
    if (!user) {
      return NextResponse.json({ error: "Please sign in to view orders." }, { status: 401 });
    }
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: { include: { product: { select: { name: true, slug: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    const data = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      total: Number(o.total),
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((i) => ({
        productName: i.product.name,
        quantity: i.quantity,
        price: Number(i.price),
      })),
    }));
    return NextResponse.json({ orders: data });
  } catch (error) {
    console.error("GET /api/shop/orders error:", error);
    return NextResponse.json(
      { error: "Failed to load orders." },
      { status: 500 }
    );
  }
}

function generateOrderNumber(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shippingAddress, items, userId: bodyUserId } = body as {
      shippingAddress: { fullName?: string; address?: string; city?: string; state?: string; zip?: string; country?: string; phone?: string };
      items: { slug: string; quantity: number }[];
      userId?: string;
    };

    // Sync Stack user to DB and use our user id for the order (or use body userId for backwards compatibility)
    const dbUser = await getAuthUserAndSync(request);
    const userId = dbUser?.id ?? bodyUserId ?? null;

    if (!shippingAddress || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Shipping address and items are required" },
        { status: 400 }
      );
    }

    const productSlugs = items.map((i) => i.slug);
    const products = await prisma.product.findMany({
      where: { slug: { in: productSlugs }, isActive: true },
    });
    const productBySlug = new Map(products.map((p) => [p.slug, p]));

    let subtotal = 0;
    const orderItems: { productId: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      const product = productBySlug.get(item.slug);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.slug}` },
          { status: 400 }
        );
      }
      if (item.quantity < 1) {
        return NextResponse.json(
          { success: false, error: `Invalid quantity for ${product.name}` },
          { status: 400 }
        );
      }
      if (product.quantity < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}. Available: ${product.quantity}` },
          { status: 400 }
        );
      }
      const price = Number(product.price);
      const lineTotal = roundTo2(price * item.quantity);
      subtotal += lineTotal;
      orderItems.push({ productId: product.id, quantity: item.quantity, price });
    }

    const tax = 0;
    const subtotalRounded = roundTo2(subtotal);
    const shipping = subtotalRounded >= 85 ? 0 : 8;
    const total = roundTo2(subtotalRounded + tax + shipping);
    const orderNumber = generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          status: "PENDING",
          subtotal: subtotalRounded,
          total,
          tax,
          shipping,
          shippingAddress: shippingAddress as object,
          paymentStatus: "PENDING",
          userId,
        },
      });

      for (const oi of orderItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: oi.productId,
            quantity: oi.quantity,
            price: oi.price,
          },
        });
      }

      for (const item of items) {
        const product = productBySlug.get(item.slug)!;
        await tx.product.update({
          where: { id: product.id },
          data: { quantity: product.quantity - item.quantity },
        });
      }

      return newOrder;
    });

    // Add ordering user to Resend email list when logged in (fire-and-forget)
    if (dbUser) {
      addContactToResend({ email: dbUser.email, name: dbUser.name }).catch((err) =>
        console.error("Resend sync after order:", err)
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
