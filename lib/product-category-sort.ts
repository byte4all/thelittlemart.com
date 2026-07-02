import type { PrismaClient } from "@prisma/client";

/** Next sortOrder when assigning a product to a category (appends at end). */
export async function nextProductCategorySortOrder(
  prisma: PrismaClient,
  categoryId: string
): Promise<number> {
  const max = await prisma.productCategory.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });
  return (max._max.sortOrder ?? -10) + 10;
}

export async function buildProductCategoryCreates(
  prisma: PrismaClient,
  categoryIds: string[],
  preservedSortOrders: Map<string, number> = new Map()
): Promise<{ categoryId: string; sortOrder: number }[]> {
  const creates: { categoryId: string; sortOrder: number }[] = [];

  for (const categoryId of categoryIds) {
    if (preservedSortOrders.has(categoryId)) {
      creates.push({
        categoryId,
        sortOrder: preservedSortOrders.get(categoryId)!,
      });
      continue;
    }
    const sortOrder = await nextProductCategorySortOrder(prisma, categoryId);
    creates.push({ categoryId, sortOrder });
  }

  return creates;
}

export async function getProductCategorySortOrderMap(
  prisma: PrismaClient,
  productId: string
): Promise<Map<string, number>> {
  const rows = await prisma.productCategory.findMany({
    where: { productId },
    select: { categoryId: true, sortOrder: true },
  });
  return new Map(rows.map((r) => [r.categoryId, r.sortOrder]));
}
