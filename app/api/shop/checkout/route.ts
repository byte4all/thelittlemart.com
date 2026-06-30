import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserAndSync } from "@/lib/auth";
import { addContactToResend } from "@/lib/resend";
import { createBill } from "@/lib/billplz";
import { roundTo2 } from "@/lib/currency";
import {
  buildStoredFulfillmentAddress,
  calcDeliveryFee,
  type FulfillmentAddressInput,
  type FulfillmentMethod,
} from "@/lib/fulfillment";
import { getPickupScheduleConfig } from "@/lib/pickup-schedule-store";
import { validatePickupSlot } from "@/lib/pickup-schedule";

function generateOrderNumber(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/** Resolve items to { slug, quantity } using slug or product id */
async function resolveItems(
  items: { slug?: string; id?: string; quantity: number }[]
): Promise<{ slug: string; quantity: number }[]> {
  const bySlug = items.filter((i) => i.slug && i.quantity > 0);
  if (bySlug.length === items.length) {
    return bySlug.map((i) => ({ slug: i.slug!, quantity: i.quantity }));
  }
  const ids = items.filter((i) => i.id && i.quantity > 0).map((i) => String(i.id));
  if (ids.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true, slug: true },
  });
  const byId = new Map(products.map((p) => [p.id, p.slug]));
  return items
    .filter((i) => (i.id && byId.get(String(i.id))) || i.slug)
    .map((i) => ({
      slug: (i.slug ?? byId.get(String(i.id)))!,
      quantity: i.quantity,
    }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      shippingAddress,
      items: rawItems,
      fulfillmentMethod: rawFulfillmentMethod,
      pickupScheduledAt: rawPickupScheduledAt,
    } = body as {
      shippingAddress: FulfillmentAddressInput;
      items: { slug?: string; id?: string; quantity: number }[];
      fulfillmentMethod?: FulfillmentMethod;
      pickupScheduledAt?: string;
    };

    const fulfillmentMethod: FulfillmentMethod =
      rawFulfillmentMethod === "pickup" ? "pickup" : "shipping";

    const dbUser = await getAuthUserAndSync(request);
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "Please sign in to checkout." },
        { status: 401 }
      );
    }
    const userId = dbUser.id;

    if (!shippingAddress || !rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Contact details and items are required" },
        { status: 400 }
      );
    }

    if (!shippingAddress.fullName?.trim() || !shippingAddress.phone?.trim()) {
      return NextResponse.json(
        { success: false, error: "Full name and phone are required" },
        { status: 400 }
      );
    }

    if (fulfillmentMethod === "shipping") {
      if (!shippingAddress.address?.trim()) {
        return NextResponse.json(
          { success: false, error: "Shipping address is required" },
          { status: 400 }
        );
      }
      const zipRaw = typeof shippingAddress.zip === "string" ? shippingAddress.zip : "";
      const zipNum = parseInt(zipRaw.replace(/\D/g, "").slice(0, 5), 10);
      if (Number.isNaN(zipNum) || zipNum < 50000 || zipNum > 60000) {
        return NextResponse.json(
          {
            success: false,
            error: "We only deliver to Kuala Lumpur. Postcode must be between 50000 and 60000.",
          },
          { status: 400 }
        );
      }
    }

    let pickupScheduledAt: Date | undefined;
    if (fulfillmentMethod === "pickup") {
      if (!rawPickupScheduledAt?.trim()) {
        return NextResponse.json(
          { success: false, error: "Please select a pickup date and time." },
          { status: 400 }
        );
      }
      const config = await getPickupScheduleConfig();
      const orderAt = new Date();
      const validation = validatePickupSlot(rawPickupScheduledAt.trim(), orderAt, config);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error ?? "Invalid pickup slot" },
          { status: 400 }
        );
      }
      pickupScheduledAt = new Date(rawPickupScheduledAt.trim());
    }

    const items = await resolveItems(rawItems);
    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid items" },
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
          {
            success: false,
            error: `Insufficient stock for ${product.name}. Available: ${product.quantity}`,
          },
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
    const shipping = calcDeliveryFee(subtotalRounded, fulfillmentMethod);
    const total = roundTo2(subtotalRounded + tax + shipping);
    const orderNumber = generateOrderNumber();
    const storedAddress = buildStoredFulfillmentAddress(
      fulfillmentMethod,
      shippingAddress
    );

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          status: "PENDING",
          subtotal: subtotalRounded,
          total,
          tax,
          shipping,
          shippingAddress: storedAddress as object,
          paymentStatus: "PENDING",
          paymentMethod: "billplz",
          userId,
          ...(pickupScheduledAt && { pickupScheduledAt }),
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

      return newOrder;
    });

    const collectionId = process.env.BILLPLZ_COLLECTION_ID;
    // Callback URL must be reachable by Billplz: set BILLPLZ_CALLBACK_BASE_URL in production (e.g. https://www.thelittlemart.com).
    // In Billplz dashboard enable "Basic Callback URL" or "X Signature Callback URL" for the collection.
    const callbackBase =
      process.env.BILLPLZ_CALLBACK_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const callbackUrl = `${callbackBase.replace(/\/$/, "")}/api/webhooks/billplz`;
    const redirectUrl = `${callbackBase.replace(/\/$/, "")}/checkout/success?order=${order.id}`;

    if (!collectionId) {
      console.error("Billplz: BILLPLZ_COLLECTION_ID is not set");
      return NextResponse.json(
        { success: false, error: "Payment is not configured" },
        { status: 500 }
      );
    }

    const fullName =
      (shippingAddress as { fullName?: string }).fullName ||
      (dbUser?.name ?? "Customer");
    const email = dbUser?.email ?? "noreply@thelittlemart.com";
    const mobile = (shippingAddress as { phone?: string }).phone ?? undefined;

    const amountSen = Math.round(Number(order.total) * 100);
    if (amountSen < 1) {
      return NextResponse.json(
        { success: false, error: "Order total must be at least RM 0.01" },
        { status: 400 }
      );
    }

    const bill = await createBill({
      collectionId,
      amount: amountSen,
      email,
      name: fullName.slice(0, 100),
      description: `Order ${order.orderNumber} - Thelittlemart`,
      callbackUrl,
      redirectUrl,
      reference1: order.id,
      reference1Label: "Order ID",
      mobile,
    });

    if (!bill) {
      return NextResponse.json(
        { success: false, error: "Failed to create payment bill" },
        { status: 500 }
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { billplzBillId: bill.id },
    });

    if (dbUser) {
      addContactToResend({ email: dbUser.email, name: dbUser.name }).catch((err) =>
        console.error("Resend sync after checkout:", err)
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      billUrl: bill.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to checkout" },
      { status: 500 }
    );
  }
}
