import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserAndSync } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserAndSync(request);
    if (!user) {
      return NextResponse.json({ success: true, items: [] });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                reviews: { select: { rating: true } },
                brand: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }

    const formattedItems = cart.items.map((item) => ({
      ...item.product,
      quantity: item.quantity,
      availableQuantity: item.product.quantity,
      brand: item.product.brand?.name ?? undefined,
    }));

    return NextResponse.json({ success: true, items: formattedItems });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUserAndSync(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Read raw body so we can gracefully handle empty or malformed JSON without throwing.
    const raw = await request.text();
    let items: { slug: string; quantity: number }[] = [];
    if (raw && raw.trim().length > 0) {
      try {
        const parsed = JSON.parse(raw) as {
          items?: { slug: string; quantity: number }[];
        };
        if (Array.isArray(parsed.items)) {
          items = parsed.items;
        }
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid JSON body" },
          { status: 400 }
        );
      }
    }

    // If no items provided, treat as "clear cart" rather than error.
    const slugs = items.map((i) => i.slug).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { slug: { in: slugs } },
    });
    const productBySlug = new Map(products.map((p) => [p.slug, p]));

    let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
      });
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    for (const item of items) {
      const product = productBySlug.get(item.slug);
      if (!product || item.quantity < 1) continue;
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: item.quantity,
          userId: user.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving cart:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save cart" },
      { status: 500 }
    );
  }
}
