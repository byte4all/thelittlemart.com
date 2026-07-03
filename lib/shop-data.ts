import type { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

const productInclude = {
  productCategories: {
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
  },
  brand: { select: { id: true, name: true, slug: true } },
  reviews: {
    select: { rating: true },
  },
} as const;

const categoryOrderBy = [
  { sortOrder: "asc" as const },
  { name: "asc" as const },
];

export type ProductsListOptions = {
  category?: string;
  brand?: string;
  featured?: boolean;
  bestSellers?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  order?: "asc" | "desc";
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  size?: string;
};

type CategoryContext = {
  id: string;
  parentId: string | null;
  listMode: "MANUAL" | "ROLLUP";
  children: { id: string }[];
};

function buildBaseWhere(options: ProductsListOptions): Prisma.ProductWhereInput {
  const { brand, featured, bestSellers, minPrice, maxPrice, color, size } = options;
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (brand?.trim()) {
    where.brand = { slug: brand.trim() };
  }
  if (featured === true) {
    where.isFeatured = true;
  }
  if (bestSellers === true) {
    where.isBestSeller = true;
  }
  if (minPrice != null && !Number.isNaN(minPrice)) {
    where.price = {
      ...(typeof where.price === "object" && where.price !== null ? where.price : {}),
      gte: minPrice,
    };
  }
  if (maxPrice != null && !Number.isNaN(maxPrice)) {
    where.price = {
      ...(typeof where.price === "object" && where.price !== null ? where.price : {}),
      lte: maxPrice,
    };
  }

  const andParts: Prisma.ProductWhereInput[] = [];
  if (color?.trim()) {
    andParts.push({
      OR: [
        { color: { equals: color.trim(), mode: "insensitive" } },
        { availableColors: { has: color.trim() } },
      ],
    });
  }
  if (size?.trim()) {
    andParts.push({
      OR: [
        { size: { equals: size.trim(), mode: "insensitive" } },
        { availableSizes: { has: size.trim() } },
      ],
    });
  }
  if (andParts.length > 0) {
    where.AND = andParts;
  }

  return where;
}

function buildCategoryWhere(
  categorySlug: string,
  cat: CategoryContext | null
): Prisma.ProductWhereInput {
  if (!cat) {
    return {
      productCategories: {
        some: { category: { slug: categorySlug } },
      },
    };
  }

  if (cat.parentId) {
    return {
      productCategories: {
        some: { categoryId: cat.id },
      },
    };
  }

  if (cat.listMode === "MANUAL") {
    return {
      productCategories: {
        some: { categoryId: cat.id },
      },
    };
  }

  const categoryIds = [cat.id, ...cat.children.map((ch) => ch.id)];
  return {
    productCategories: {
      some: { categoryId: { in: categoryIds } },
    },
  };
}

async function resolveCategoryContext(
  prisma: PrismaClient,
  categorySlug: string
): Promise<CategoryContext | null> {
  const cat = await prisma.category.findFirst({
    where: { slug: categorySlug },
    select: {
      id: true,
      parentId: true,
      listMode: true,
      children: {
        select: { id: true },
        orderBy: categoryOrderBy,
      },
    },
  });
  return cat;
}

/** Curated product order for a category slug (manual / rollup / subcategory). */
export async function getOrderedProductIdsForCategory(
  prisma: PrismaClient,
  categorySlug: string
): Promise<string[]> {
  const cat = await resolveCategoryContext(prisma, categorySlug);
  if (!cat) return [];

  if (cat.parentId) {
    const rows = await prisma.productCategory.findMany({
      where: { categoryId: cat.id },
      orderBy: { sortOrder: "asc" },
      select: { productId: true },
    });
    return rows.map((r) => r.productId);
  }

  if (cat.listMode === "MANUAL") {
    const rows = await prisma.productCategory.findMany({
      where: { categoryId: cat.id },
      orderBy: { sortOrder: "asc" },
      select: { productId: true },
    });
    return rows.map((r) => r.productId);
  }

  const seen = new Set<string>();
  const result: string[] = [];

  const children = await prisma.category.findMany({
    where: { parentId: cat.id },
    orderBy: categoryOrderBy,
    select: { id: true },
  });

  for (const child of children) {
    const childRows = await prisma.productCategory.findMany({
      where: { categoryId: child.id },
      orderBy: { sortOrder: "asc" },
      select: { productId: true },
    });
    for (const row of childRows) {
      if (!seen.has(row.productId)) {
        seen.add(row.productId);
        result.push(row.productId);
      }
    }
  }

  // Keep direct parent-category assignments after subcategory blocks so
  // rollup always follows subcategory placement first.
  const parentRows = await prisma.productCategory.findMany({
    where: { categoryId: cat.id },
    orderBy: { sortOrder: "asc" },
    select: { productId: true },
  });
  for (const row of parentRows) {
    if (!seen.has(row.productId)) {
      seen.add(row.productId);
      result.push(row.productId);
    }
  }

  return result;
}

/** Curated global order for /shop (all categories). */
async function getOrderedProductIdsForAllCategories(
  prisma: PrismaClient
): Promise<string[]> {
  const seen = new Set<string>();
  const result: string[] = [];

  const mains = await prisma.category.findMany({
    where: { parentId: null },
    select: { slug: true },
    orderBy: categoryOrderBy,
  });

  for (const main of mains) {
    const ids = await getOrderedProductIdsForCategory(prisma, main.slug);
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        result.push(id);
      }
    }
  }

  return result;
}

function reorderProductsByIds<T extends { id: string }>(
  products: T[],
  orderedIds: string[]
): T[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return orderedIds
    .map((id) => byId.get(id))
    .filter((p): p is T => p != null);
}

/** Brand slugs in first-seen order along category → subcategory → product sort. */
async function getOrderedBrandSlugs(
  prisma: PrismaClient,
  categorySlug?: string
): Promise<string[]> {
  const orderedProductIds = categorySlug
    ? await getOrderedProductIdsForCategory(prisma, categorySlug)
    : await getOrderedProductIdsForAllCategories(prisma);

  if (orderedProductIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: {
      id: { in: orderedProductIds },
      isActive: true,
      brandId: { not: null },
    },
    select: {
      id: true,
      brand: { select: { slug: true } },
    },
  });

  const brandSlugByProductId = new Map(
    products.map((p) => [p.id, p.brand?.slug])
  );
  const seen = new Set<string>();
  const result: string[] = [];

  for (const productId of orderedProductIds) {
    const slug = brandSlugByProductId.get(productId);
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      result.push(slug);
    }
  }

  return result;
}

function orderBrandsBySlugs<T extends { slug: string; name: string }>(
  brands: T[],
  orderedSlugs: string[]
): T[] {
  const bySlug = new Map(brands.map((b) => [b.slug, b]));
  const ordered: T[] = [];
  const used = new Set<string>();

  for (const slug of orderedSlugs) {
    const brand = bySlug.get(slug);
    if (brand) {
      ordered.push(brand);
      used.add(slug);
    }
  }

  const remainder = brands
    .filter((b) => !used.has(b.slug))
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...ordered, ...remainder];
}

export async function getProductsList(
  prisma: PrismaClient,
  options: ProductsListOptions = {}
) {
  const {
    category,
    limit,
    offset = 0,
    sortBy = "createdAt",
    order = "desc",
  } = options;

  const baseWhere = buildBaseWhere(options);
  const catContext = category ? await resolveCategoryContext(prisma, category) : null;

  if (category) {
    const categoryWhere = buildCategoryWhere(category, catContext);
    baseWhere.AND = [
      ...(Array.isArray(baseWhere.AND) ? baseWhere.AND : baseWhere.AND ? [baseWhere.AND] : []),
      categoryWhere,
    ];
  }

  const useManualOrder = sortBy === "manual";

  const priceRangePromise = prisma.product.aggregate({
    where: { isActive: true },
    _min: { price: true },
    _max: { price: true },
  });

  if (useManualOrder) {
    const orderedIds = category
      ? await getOrderedProductIdsForCategory(prisma, category)
      : await getOrderedProductIdsForAllCategories(prisma);
    if (orderedIds.length === 0) {
      const priceRange = await priceRangePromise;
      return {
        products: [],
        total: 0,
        priceRange: {
          min: priceRange._min.price != null ? Number(priceRange._min.price) : 0,
          max: priceRange._max.price != null ? Number(priceRange._max.price) : 250,
        },
      };
    }

    const matching = await prisma.product.findMany({
      where: { ...baseWhere, id: { in: orderedIds } },
      select: { id: true },
    });
    const matchingSet = new Set(matching.map((p) => p.id));
    const filteredOrderedIds = orderedIds.filter((id) => matchingSet.has(id));
    const total = filteredOrderedIds.length;
    const pageIds = filteredOrderedIds.slice(offset, limit != null ? offset + limit : undefined);

    const productsRaw =
      pageIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: pageIds } },
            include: productInclude,
          })
        : [];

    const products = reorderProductsByIds(productsRaw, pageIds);
    const priceRange = await priceRangePromise;

    return {
      products,
      total,
      priceRange: {
        min: priceRange._min.price != null ? Number(priceRange._min.price) : 0,
        max: priceRange._max.price != null ? Number(priceRange._max.price) : 250,
      },
    };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sortBy === "price"
      ? { price: order }
      : sortBy === "name"
        ? { name: order }
        : { createdAt: order };

  const [products, total, priceRange] = await Promise.all([
    prisma.product.findMany({
      where: baseWhere,
      include: productInclude,
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.product.count({ where: baseWhere }),
    priceRangePromise,
  ]);

  return {
    products,
    total,
    priceRange: {
      min: priceRange._min.price != null ? Number(priceRange._min.price) : 0,
      max: priceRange._max.price != null ? Number(priceRange._max.price) : 250,
    },
  };
}

export async function getFilters(
  prisma: PrismaClient,
  options: { category?: string } = {}
) {
  const categorySlug = options.category?.trim() || undefined;

  const [categories, brands, orderedBrandSlugs, priceRange, productsForAttrs] =
    await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        children: {
          select: { id: true, name: true, slug: true },
          orderBy: categoryOrderBy,
        },
      },
      orderBy: categoryOrderBy,
    }),
    prisma.brand.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    getOrderedBrandSlugs(prisma, categorySlug),
    prisma.product.aggregate({
      where: { isActive: true },
      _min: { price: true },
      _max: { price: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        color: true,
        availableColors: true,
        size: true,
        availableSizes: true,
      },
    }),
  ]);

  const priceMin = priceRange._min.price != null ? Number(priceRange._min.price) : 0;
  const priceMax = priceRange._max.price != null ? Number(priceRange._max.price) : 250;
  const colorSet = new Set<string>();
  const sizeSet = new Set<string>();
  for (const p of productsForAttrs) {
    if (p.color?.trim()) colorSet.add(p.color.trim());
    if (p.size?.trim()) sizeSet.add(p.size.trim());
    if (Array.isArray(p.availableColors))
      p.availableColors.forEach((c) => c?.trim() && colorSet.add(c.trim()));
    if (Array.isArray(p.availableSizes))
      p.availableSizes.forEach((s) => s?.trim() && sizeSet.add(s.trim()));
  }
  const categoriesHierarchical: { name: string; slug: string; children: { name: string; slug: string }[] }[] = categories.map((c) => ({
    name: c.name,
    slug: c.slug,
    children: (c.children ?? []).map((ch) => ({ name: ch.name, slug: ch.slug })),
  }));

  const brandOptions = brands.map((b) => ({ name: b.name, slug: b.slug }));
  const orderedBrandOptions =
    categorySlug && orderedBrandSlugs.length > 0
      ? orderBrandsBySlugs(
          brandOptions.filter((b) => orderedBrandSlugs.includes(b.slug)),
          orderedBrandSlugs
        )
      : orderBrandsBySlugs(brandOptions, orderedBrandSlugs);

  return {
    categories: categoriesHierarchical,
    brands: orderedBrandOptions,
    priceRange: { min: priceMin, max: Math.max(priceMax, priceMin) },
    colors: Array.from(colorSet).sort(),
    sizes: Array.from(sizeSet).sort(),
  };
}

export async function getProductBySlugOrId(
  prisma: PrismaClient,
  slugOrId: string
) {
  const product = await prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [{ slug: slugOrId }, { id: slugOrId }],
    },
    include: productInclude,
  });
  return product;
}

const productDetailInclude = {
  productCategories: {
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
  },
  brand: { select: { id: true, name: true } },
  reviews: {
    include: {
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

/** URL-safe slug from name: alphanumeric and hyphens only, collapse/trim dashes. */
function toNameSlug(name: string | null | undefined, fallback: string): string {
  if (!name?.trim()) return fallback;
  const slug = name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || fallback;
}

/** All active product paths with category for URLs like /shop/{categorySlug}/{productSlug}. */
export async function getAllProductPaths(prisma: PrismaClient) {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      productCategories: {
        take: 1,
        select: { category: { select: { slug: true } } },
      },
    },
  });
  return rows.map((p) => {
    const categorySlug =
      p.productCategories?.[0]?.category?.slug?.trim() || "shop";
    return {
      id: p.id,
      slug: p.slug,
      nameSlug: toNameSlug(p.name, p.slug || p.id),
      categorySlug,
    };
  });
}

/** Single product with categories and full reviews for product page. */
export async function getProductDetail(prisma: PrismaClient, slugOrId: string) {
  const product = await prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [{ slug: slugOrId }, { id: slugOrId }],
    },
    include: productDetailInclude,
  });
  return product;
}

/** Latest reviews for homepage Happy Customers section. */
export async function getReviews(prisma: PrismaClient, limit = 12) {
  const rows = await prisma.review.findMany({
    take: Math.max(limit * 3, limit),
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
    },
  });
  return rows
    .map((r) => {
      const content = (r.comment || r.title || "").trim();
      return {
        id: r.id,
        user: r.user?.name || "Customer",
        content,
        rating: r.rating,
        date: r.createdAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };
    })
    .filter((r) => r.content.length > 0)
    .slice(0, limit);
}
