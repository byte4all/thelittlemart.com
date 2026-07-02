import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "../../../../_utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdminApi(request);
  if (forbidden) return forbidden;

  try {
    const { id: categoryId } = await params;
    const body = await request.json();
    const items = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "items array is required" },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (typeof item?.productId !== "string" || typeof item?.sortOrder !== "number") {
        return NextResponse.json(
          { success: false, error: "Each item needs productId and sortOrder" },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    const productIds = items.map((item: { productId: string }) => item.productId);
    const links = await prisma.productCategory.findMany({
      where: { categoryId, productId: { in: productIds } },
      select: { productId: true },
    });

    if (links.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more products are not in this category" },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      items.map((item: { productId: string; sortOrder: number }) =>
        prisma.productCategory.update({
          where: {
            productId_categoryId: {
              productId: item.productId,
              categoryId,
            },
          },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering category products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reorder products" },
      { status: 500 }
    );
  }
}
