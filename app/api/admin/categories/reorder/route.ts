import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "../../_utils";

export async function PATCH(request: Request) {
  const forbidden = await requireAdminApi(request);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const items = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "items array is required" },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (typeof item?.id !== "string" || typeof item?.sortOrder !== "number") {
        return NextResponse.json(
          { success: false, error: "Each item needs id and sortOrder" },
          { status: 400 }
        );
      }
    }

    const ids = items.map((item: { id: string }) => item.id);
    const existing = await prisma.category.findMany({
      where: { id: { in: ids } },
      select: { id: true, parentId: true },
    });

    if (existing.length !== ids.length) {
      return NextResponse.json(
        { success: false, error: "One or more categories not found" },
        { status: 400 }
      );
    }

    const parentIds = new Set(
      existing.map((c) => c.parentId ?? "__root__")
    );
    if (parentIds.size > 1) {
      return NextResponse.json(
        { success: false, error: "All categories must share the same parent scope" },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      items.map((item: { id: string; sortOrder: number }) =>
        prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reorder categories" },
      { status: 500 }
    );
  }
}
