import { prisma } from "@/lib/prisma";

const POSITIVE_COMMENTS = [
  "Using this towel every day. It was nice from the first use. Very smooth and super nice to use after a shower.",
  "Premium feel and classy. Took it to the beach and it dried good, not just small. Actually good size.",
  "Feels very smooth on the skin. Doesn't irritate the skin at all. Love it after a shower.",
  "Super nice to use after a shower. Premium feel and dries good. Smooth on the skin.",
  "Classy at the beach. Actually good, not just small. Dry good and the skin doesn't irritate.",
  "Very smooth. Nice to use after a shower. Premium feel and doesn't irritate the skin.",
  "People said it was nice and they were right. Feel very smooth, super nice after a shower. Premium feel.",
  "Using their towel at the beach – classy. Dry good, smooth on the skin, doesn't irritate.",
  "It was nice. Feel very smooth, super nice to use after a shower. Premium feel, classy.",
  "Actually good, not just small. Dries good, smoothly. The skin doesn't irritate. Love it.",
  "Super nice to use after a shower. Premium feel. Smooth on the skin, doesn't irritate the skin.",
  "Using this towel daily. Very smooth, nice after shower. Premium feel, dries good.",
  "Classy at the beach. Actually good size, dry good. Smoothly on the skin, doesn't irritate.",
  "Feel very smooth. Super nice after a shower. Premium feel. Skin doesn't irritate.",
  "Nice towel. Using it at the beach – classy. Dry good, smooth, doesn't irritate the skin.",
  "Very smooth and super nice to use after a shower. Premium feel. Actually good, not small.",
  "Dries good, smooth on the skin. Doesn't irritate the skin. Nice after a shower.",
  "Premium feel. Classy at the beach. Actually good size. Smoothly, skin doesn't irritate.",
  "Using their towel – feel very smooth. Super nice after shower. Premium, dry good.",
  "It was nice. Smooth, super nice to use after a shower. Doesn't irritate the skin.",
  "Actually good towel, not just small. Dry good. Smooth on the skin, no irritation.",
  "Super nice after a shower. Premium feel, classy. Very smooth. Skin doesn't irritate.",
  "Feel very smooth. Using it after every shower. Premium feel, dries good, doesn't irritate.",
  "Classy at the beach. Dry good. Smoothly. The skin doesn't irritate. Actually good size.",
  "People said it was nice – they're right. Very smooth, premium feel. Nice after shower.",
  "Using their towel daily. Super nice after a shower. Smooth, dry good, doesn't irritate skin.",
  "Premium feel and very smooth. Nice to use after a shower. Actually good, not small.",
  "Dry good and smooth on the skin. Doesn't irritate the skin. Classy, premium feel.",
  "Super nice to use after a shower. Feel very smooth. Premium feel. Skin doesn't irritate.",
  "Actually good size, not just small. Dries good. Smoothly, doesn't irritate the skin.",
  "Classy at the beach. Very smooth. Super nice after shower. Premium feel, dry good.",
  "It was nice. Smooth, premium feel. Nice after a shower. Doesn't irritate the skin.",
  "Using this towel – feel very smooth. Dry good. Smoothly, skin doesn't irritate.",
  "Premium feel. Super nice after a shower. Actually good, not small. Doesn't irritate skin.",
  "Very smooth and nice. Using after every shower. Classy, dry good. No skin irritation.",
  "Feel very smooth. Premium feel. Super nice after shower. Actually good. Skin doesn't irritate.",
  "Dry good, smooth on the skin. Doesn't irritate the skin. Classy, premium feel.",
  "Super nice to use after a shower. Very smooth. Actually good size. No irritation.",
  "Using their towel – it was nice. Very smooth, premium feel. Nice after shower.",
  "Actually good, not just small. Feel very smooth. Dry good. Doesn't irritate the skin.",
  "Classy at the beach. Super nice after a shower. Premium feel. Smooth, no skin irritation.",
  "People said it was nice. Very smooth, super nice after shower. Premium feel, dry good.",
  "Smoothly. The skin doesn't irritate. Premium feel. Nice to use after a shower.",
  "Using this towel – super nice after shower. Very smooth. Dry good. Doesn't irritate skin.",
  "Premium feel, classy. Actually good size. Very smooth. Skin doesn't irritate.",
  "Feel very smooth. Dry good. Super nice after a shower. Doesn't irritate the skin.",
  "It was nice. Classy at the beach. Actually good. Smooth on skin, no irritation.",
  "Very smooth. Premium feel. Using after every shower. Dry good. Skin doesn't irritate.",
  "Super nice after a shower. Feel very smooth. Actually good, not small. No irritation.",
];

const BAG_COMMENTS = [
  "Great everyday bag. Durable, lightweight, and easy to carry.",
  "Very practical and stylish. Fits my daily essentials perfectly.",
  "Material feels premium and the stitching looks strong.",
  "Comfortable to use all day and easy to clean.",
  "Good size and quality. Exactly what I needed for daily use.",
  "Useful compartments and solid zip quality. Happy with this purchase.",
];

const FOUTA_COMMENTS = [
  "Lightweight and very absorbent. Perfect for beach and travel.",
  "Dries quickly and feels soft on skin. Great quality fouta.",
  "Beautiful texture and easy to pack in a small bag.",
  "Love using this at the pool. Premium feel and good size.",
  "Comfortable, breathable, and dries fast after use.",
  "Stylish and practical. One of my favorite beach essentials.",
];

const COTTON_COMMENTS = [
  "Soft and gentle on skin. Very good quality cotton product.",
  "Absorbent, clean, and practical for daily home use.",
  "Good value and reliable quality. Will buy again.",
  "Perfect for skincare and everyday hygiene needs.",
  "No irritation on sensitive skin. Very comfortable to use.",
  "Convenient pack size and consistent quality in every pack.",
];

const FEMININE_COMMENTS = [
  "Comfortable and reliable protection throughout the day.",
  "Feels gentle and secure with no irritation.",
  "Very easy to use and good absorbency for daily needs.",
  "Quality is excellent and comfort level is very good.",
  "Soft material and dependable performance. Highly recommend.",
  "Confident, comfortable, and practical for regular use.",
];

/** Get or create seed users for reviews (need at least 100 for variety) */
async function getOrCreateSeedUsers(count: number): Promise<string[]> {
  const existing = await prisma.user.findMany({
    take: count,
    select: { id: true },
  });
  const ids = existing.map((u) => u.id);
  if (ids.length >= count) return ids.slice(0, count);

  const toCreate = count - ids.length;
  for (let i = 0; i < toCreate; i++) {
    const email = `reviewer-seed-${Date.now()}-${i}@thelittlemart.local`;
    const name = `Customer ${i + 1}`;
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, name },
      update: {},
      select: { id: true },
    });
    ids.push(user.id);
  }
  return ids;
}

/** Random date between 2023-01-01 and 2026-12-31 for review variety */
function randomReviewDate(): Date {
  const start = new Date("2023-01-01T00:00:00.000Z").getTime();
  const end = new Date("2026-12-31T23:59:59.999Z").getTime();
  return new Date(start + Math.random() * (end - start));
}

export type SeedTowelReviewsOptions = {
  /** If set, seed only this product. Otherwise seed all cotton/feminine products. */
  productId?: string;
};

const DEFAULT_MIN_REVIEWS = 50;
const DEFAULT_MAX_REVIEWS = 100;
const BAG_MIN_REVIEWS = 18;
const BAG_MAX_REVIEWS = 24;
const FOUTA_MIN_REVIEWS = 23;
const FOUTA_MAX_REVIEWS = 44;

const BAG_TERMS = ["bag", "bags", "kiwi-bags"];
const FOUTA_TERMS = ["fouta", "foutas"];
const TOWEL_TERMS = ["towel", "towels", "kiwi-towels"];
const COTTON_TERMS = [
  "cotton",
  "wipes",
  "wipe",
  "tissue",
  "tissues",
  "toilet paper",
  "handkerchief",
  "buds",
];
const FEMININE_TERMS = ["feminine", "tampon", "sanitary", "period"];

function randomIntInclusive(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function detectTerms(product: {
  name: string;
  slug: string;
  productCategories: { category: { name: string; slug: string } }[];
}): string {
  const categoryText = (product.productCategories ?? [])
    .map((pc) => `${pc.category.name} ${pc.category.slug}`)
    .join(" ");
  return `${product.name} ${product.slug} ${categoryText}`.toLowerCase();
}

function reviewRangeForProduct(product: {
  name: string;
  slug: string;
  productCategories: { category: { name: string; slug: string } }[];
}): { min: number; max: number } {
  const text = detectTerms(product);
  const isBag = BAG_TERMS.some((term) => text.includes(term));
  if (isBag) return { min: BAG_MIN_REVIEWS, max: BAG_MAX_REVIEWS };

  const isFouta = FOUTA_TERMS.some((term) => text.includes(term));
  if (isFouta) return { min: FOUTA_MIN_REVIEWS, max: FOUTA_MAX_REVIEWS };

  return { min: DEFAULT_MIN_REVIEWS, max: DEFAULT_MAX_REVIEWS };
}

function commentsForProduct(product: {
  name: string;
  slug: string;
  productCategories: { category: { name: string; slug: string } }[];
}): string[] {
  const text = detectTerms(product);
  const shortName = product.name.trim() || "This product";

  const withName = (pool: string[]) => [
    `${shortName} is excellent. ${pool[0]}`,
    `Love ${shortName}. ${pool[1]}`,
    `${shortName} works very well for daily use.`,
    ...pool,
  ];

  if (BAG_TERMS.some((term) => text.includes(term))) return withName(BAG_COMMENTS);
  if (FOUTA_TERMS.some((term) => text.includes(term))) return withName(FOUTA_COMMENTS);
  if (FEMININE_TERMS.some((term) => text.includes(term))) return withName(FEMININE_COMMENTS);
  if (COTTON_TERMS.some((term) => text.includes(term))) return withName(COTTON_COMMENTS);
  return withName(POSITIVE_COMMENTS);
}

/** Seed positive reviews with category-aware counts (bags: 18–24, foutas: 23–44, others: 50–100). */
export async function seedTowelReviews(options?: SeedTowelReviewsOptions): Promise<{ products: number; reviews: number }> {
  let products: {
    id: string;
    name: string;
    slug: string;
    productCategories: { category: { name: string; slug: string } }[];
  }[];

  if (options?.productId) {
    const product = await prisma.product.findUnique({
      where: { id: options.productId },
      select: {
        id: true,
        name: true,
        slug: true,
        productCategories: {
          include: {
            category: {
              select: { name: true, slug: true },
            },
          },
        },
      },
    });
    products = product ? [product] : [];
  } else {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          ...COTTON_TERMS.map((term) => ({ slug: { contains: term, mode: "insensitive" as const } })),
          ...COTTON_TERMS.map((term) => ({ name: { contains: term, mode: "insensitive" as const } })),
          ...FEMININE_TERMS.map((term) => ({ slug: { contains: term, mode: "insensitive" as const } })),
          ...FEMININE_TERMS.map((term) => ({ name: { contains: term, mode: "insensitive" as const } })),
        ],
      },
      select: { id: true },
    });
    const categoryIds = categories.map((c) => c.id);
    if (categoryIds.length === 0) {
      return { products: 0, reviews: 0 };
    }
    products = await prisma.product.findMany({
      where: {
        productCategories: { some: { categoryId: { in: categoryIds } } },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        productCategories: {
          include: {
            category: {
              select: { name: true, slug: true },
            },
          },
        },
      },
    });
  }

  if (products.length === 0) {
    return { products: 0, reviews: 0 };
  }

  const userIds = await getOrCreateSeedUsers(100);
  let totalReviews = 0;

  for (const product of products) {
    const { min, max } = reviewRangeForProduct(product);
    const reviewCount = randomIntInclusive(min, max);
    const targetAvg = 4.2 + Math.random() * 0.6; // 4.2–4.8
    const p5 = (targetAvg - 4); // fraction that are 5 (e.g. 4.5 avg => 0.5)
    const numFives = Math.round(reviewCount * p5);
    const numFours = reviewCount - numFives;

    const ratings: number[] = [];
    for (let i = 0; i < numFives; i++) ratings.push(5);
    for (let i = 0; i < numFours; i++) ratings.push(4);
    for (let i = ratings.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ratings[i], ratings[j]] = [ratings[j], ratings[i]];
    }

    const comments = [...commentsForProduct(product)];
    while (comments.length < reviewCount) {
      comments.push(comments[comments.length % POSITIVE_COMMENTS.length]);
    }

    const batch = Array.from({ length: reviewCount }, (_, i) => {
      const createdAt = randomReviewDate();
      return {
        productId: product.id,
        userId: userIds[i % userIds.length],
        rating: ratings[i],
        comment: comments[i % comments.length],
        title: null as string | null,
        isVerified: Math.random() > 0.3,
        createdAt,
        updatedAt: createdAt,
      };
    });
    await prisma.review.createMany({ data: batch });
    totalReviews += reviewCount;
  }

  return { products: products.length, reviews: totalReviews };
}
