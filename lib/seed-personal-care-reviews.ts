import { prisma } from "@/lib/prisma";

/** Review comments specific to bar soap products */
const SOAP_COMMENTS = [
  "This soap is so luxurious. Leaves my skin clean and lightly scented without being harsh.",
  "Love the lather and the scent. My skin feels soft and never stripped.",
  "Best bar soap I've used. Doesn't dry out my skin and the fragrance is subtle.",
  "Lasts a long time and smells amazing. Will definitely repurchase.",
  "Gentle formula that doesn't irritate. Perfect for daily use.",
  "The bar holds up well in the shower caddy. No mushy residue.",
  "Skin feels nourished after every use. Great for sensitive skin.",
  "Beautiful scent that lingers lightly. Family loves it.",
  "Creamy lather and moisturizing. Replaced my old soap permanently.",
  "Leaves skin smooth and clean. The scent is divine.",
  "No harsh chemicals. My skin has never looked better.",
  "Elegant in the bathroom and performs wonderfully. Highly recommend.",
  "Rich lather, long-lasting bar. Worth every ringgit.",
  "Gentle enough for face and body. One bar does it all.",
  "Skin feels hydrated after showering. No tightness at all.",
  "The fragrance is subtle and sophisticated. Love it.",
  "Quality soap that doesn't dissolve too quickly. Great value.",
  "Leaves skin silky. Perfect for dry skin.",
  "Soap doesn't crack or crumble. Stays solid in the dish.",
  "Refreshing and clean feeling. Will buy again.",
  "Mild and effective. Great for the whole family.",
  "Lathers nicely and rinses clean. No residue.",
  "Skin feels balanced and soft. Excellent daily soap.",
  "The scent is natural and calming. Perfect for evening showers.",
  "Long-lasting bar with a rich, creamy lather. Very pleased.",
  "Doesn't leave a film. Skin breathes after washing.",
  "Gentle formula. Ideal for sensitive or reactive skin.",
  "Elegant packaging and even better performance. A keeper.",
  "Moisturizing without being greasy. Skin feels great.",
  "Clean, fresh scent. Bar soap done right.",
  "Leaves skin feeling clean and cared for. No dryness.",
  "Wonderful lather and a scent that isn't overpowering.",
  "Great for travel – doesn't melt or get messy. Performs well.",
  "Skin feels nourished. Replaced my liquid body wash with this.",
  "Soap holds its shape and lasts weeks. Quality is obvious.",
  "Soft, smooth lather. Perfect for everyday use.",
  "The fragrance is light and pleasant. Doesn't clash with perfume.",
  "Gentle cleansing. My skin thanks me every day.",
  "No synthetic overload. Natural feel and results.",
  "Consistent quality. I keep a few bars in the cupboard.",
  "Leaves skin refreshed and moisturized. Will recommend.",
  "Bar is dense and long-lasting. Lather is rich.",
  "Perfect balance of cleansing and caring. Love it.",
  "Skin never feels stripped. This soap is a staple now.",
  "Elegant and effective. Bathroom feels more luxurious.",
  "Great lather, lovely scent. No complaints.",
  "Suitable for all skin types. Family-approved.",
  "Leaves skin soft and supple. Worth the switch.",
  "The bar doesn't get soggy. Stays neat in the shower.",
  "Clean rinse and a subtle, lasting fragrance. Excellent soap.",
];

/** Review comments specific to body wash / shower gel products */
const BODY_WASH_COMMENTS = [
  "This body wash is so silky. Skin feels clean and hydrated after every shower.",
  "Love the gel texture and the scent. Doesn't dry out my skin at all.",
  "Lathers beautifully and rinses clean. My skin feels soft and smooth.",
  "The fragrance is amazing – not too strong, just right. Will repurchase.",
  "Gentle formula perfect for daily use. No irritation or tightness.",
  "A little goes a long way. Bottle lasts ages. Great value.",
  "Leaves skin moisturized, not stripped. Perfect for dry skin.",
  "Refreshing and invigorating. My morning shower is so much better.",
  "Skin feels nourished and smooth. Replaced my old body wash.",
  "The scent lingers lightly on skin. So nice.",
  "Creamy lather that feels luxurious. Worth every ringgit.",
  "No harsh sulfates. Skin feels balanced and healthy.",
  "Perfect for sensitive skin. No redness or dryness.",
  "Pump dispenser is convenient. Product is top quality.",
  "Leaves skin silky and hydrated. Love the formula.",
  "Fresh, clean scent that isn't overpowering. Daily staple.",
  "Lathers well and rinses off completely. No residue.",
  "Skin feels refreshed and cared for. Highly recommend.",
  "Gentle enough for whole family. We all use it.",
  "The texture is rich and luxurious. Feels like a spa product.",
  "Doesn't strip natural oils. Skin stays soft all day.",
  "Wonderful fragrance. Makes shower time a treat.",
  "Moisturizing and cleansing in one. Perfect.",
  "Skin feels clean and supple. No tightness after shower.",
  "Great for post-workout. Cleans and refreshes effectively.",
  "Lather is abundant and soft. Rinses clean.",
  "Leaves a subtle scent on skin. Love it.",
  "Quality formula. Skin has never felt better.",
  "Gentle and effective. Ideal for everyday use.",
  "The bottle looks good in the shower and performs even better.",
  "Skin feels hydrated and smooth. No need for extra lotion sometimes.",
  "Refreshing scent. Perfect for morning showers.",
  "Doesn't cause breakouts or irritation. Very pleased.",
  "Rich lather, clean rinse. Will buy again.",
  "Leaves skin feeling fresh and moisturized. Excellent product.",
  "Mild formula. Great for sensitive or reactive skin.",
  "The scent is sophisticated and not too sweet. Love it.",
  "Skin feels nourished after every use. Staple in my routine.",
  "Lathers quickly and rinses easily. No waste.",
  "Perfect balance of cleansing and moisturizing. Highly recommend.",
  "Skin stays soft and smooth. Replaced my previous body wash.",
  "Fresh, invigorating feel. Great way to start the day.",
  "Gentle on skin. No dryness or flakiness.",
  "The formula feels premium. Worth the price.",
  "Leaves skin clean and comfortable. No sticky residue.",
  "Wonderful daily body wash. Consistent quality.",
  "Skin feels refreshed and hydrated. Will recommend.",
  "Lather is creamy and luxurious. Rinses clean.",
  "Subtle fragrance that lasts. Perfect for layering with perfume.",
  "Gentle and effective. Family loves it.",
  "Leaves skin silky and cared for. Excellent choice.",
];

/** Review comments specific to shampoo products */
const SHAMPOO_COMMENTS = [
  "This shampoo leaves my hair so clean and soft. Love the lather and scent.",
  "Hair feels nourished and looks shiny after every wash. Will repurchase.",
  "Gentle formula that doesn't strip my hair. Perfect for daily use.",
  "Lathers beautifully and rinses clean. Hair feels light and healthy.",
  "The scent is amazing and lingers lightly. My hair has never looked better.",
  "Cleanses effectively without drying out my scalp. Highly recommend.",
  "Hair feels silky and manageable. No more tangles.",
  "Perfect balance of cleansing and moisturizing. Family approved.",
  "Leaves hair soft, shiny, and easy to style. Worth every ringgit.",
  "Gentle enough for frequent use. Hair stays healthy and vibrant.",
  "The formula is rich and creamy. Rinses out completely.",
  "Hair feels clean and refreshed. No residue or buildup.",
  "Love how my hair feels after using this. Soft and bouncy.",
  "Cleanses thoroughly while keeping hair moisturized. Excellent product.",
  "The fragrance is subtle and pleasant. Hair smells fresh all day.",
  "Hair looks healthier and feels stronger. Will keep buying.",
  "Gentle on scalp. No irritation or itching. Very pleased.",
  "Lathers well with just a small amount. Great value.",
  "Hair is easier to detangle after washing. Love it.",
  "Perfect for daily washing. Doesn't weigh hair down.",
  "The scent is refreshing without being overwhelming. Nice.",
  "Hair feels clean and voluminous. No greasy residue.",
  "Gentle formula suitable for the whole family. Everyone loves it.",
  "Scalp feels refreshed and balanced. Hair looks great.",
  "Rinses clean and leaves hair soft. Highly recommend.",
  "Hair has more shine and bounce. Very happy with this.",
  "Doesn't dry out my hair. Leaves it feeling nourished.",
  "The formula is mild yet effective. Perfect for sensitive scalp.",
  "Hair feels lightweight and fresh. Will buy again.",
  "Great lather, pleasant scent, clean rinse. What more could I ask for?",
  "Hair is softer and more manageable. Excellent shampoo.",
  "Cleanses without stripping natural oils. My hair thanks me.",
  "The bottle lasts a long time. A little goes a long way.",
  "Hair looks healthier with each wash. Very satisfied.",
  "Gentle enough for kids yet effective for adults. Family favorite.",
  "Scalp feels clean and hair feels nourished. Perfect combination.",
  "The fragrance stays in my hair all day. Love it.",
  "Hair is less frizzy and more smooth. Great product.",
  "Lathers nicely and rinses easily. No hassle.",
  "Hair feels refreshed and revitalized. Will recommend.",
  "Gentle cleansing that doesn't irritate. Ideal for daily use.",
  "Hair has natural bounce and shine. Very pleased.",
  "The formula is effective yet gentle. Best shampoo I've tried.",
  "Leaves hair feeling clean and looking beautiful. Excellent.",
  "Hair is softer, shinier, and healthier. Will keep using.",
  "Perfect for fine hair. Adds volume without weighing down.",
  "Scalp feels soothed and hair feels pampered. Love this.",
  "Rinses out completely. No sticky or heavy feeling.",
  "Hair is easier to style after using this. Great shampoo.",
  "Gentle and effective. My go-to shampoo now.",
];

/** Review comments specific to conditioner products */
const CONDITIONER_COMMENTS = [
  "This conditioner makes my hair so soft and silky. Love the results.",
  "Hair is easier to detangle and feels nourished. Will repurchase.",
  "Doesn't weigh hair down. Leaves it light and manageable. Perfect.",
  "The scent is lovely and lingers lightly. Hair feels amazing.",
  "Deep conditioning without the greasy feel. Highly recommend.",
  "Hair looks shinier and healthier after every use. Excellent product.",
  "Perfect for dry or damaged hair. Restores softness and shine.",
  "A little goes a long way. Great value for money.",
  "Hair feels hydrated and smooth. No more frizz.",
  "Gentle formula that works wonders. Family loves it.",
  "Leaves hair silky and easy to comb through. No tangles.",
  "The texture is rich but rinses out clean. Love it.",
  "Hair feels nourished from root to tip. Will keep buying.",
  "Conditions deeply without making hair heavy. Perfect balance.",
  "Scalp feels good and hair looks great. Very pleased.",
  "Hair is softer and more manageable. Worth every ringgit.",
  "The fragrance is subtle and pleasant. Not overpowering.",
  "Restores moisture and adds shine. Excellent conditioner.",
  "Hair feels smooth and looks healthy. Highly recommend.",
  "Perfect for daily use. Doesn't build up or weigh down.",
  "Detangles easily and leaves hair soft. Love this.",
  "Hair has natural bounce and shine. Very satisfied.",
  "Gentle enough for color-treated hair. Works beautifully.",
  "Leaves hair feeling pampered and cared for. Great product.",
  "Rinses out completely. No residue or heavy feeling.",
  "Hair is easier to style after conditioning. Love it.",
  "Nourishes without being too heavy. Perfect for fine hair.",
  "The formula is rich and luxurious. Hair feels amazing.",
  "Adds moisture and shine without greasiness. Excellent.",
  "Hair looks and feels healthier. Will recommend to friends.",
  "Perfect complement to the shampoo. Works wonderfully together.",
  "Leaves hair soft, smooth, and shiny. Very happy.",
  "Conditions deeply and rinses clean. No fuss.",
  "Hair is less frizzy and more manageable. Great results.",
  "The scent is fresh and clean. Lasts all day.",
  "Helps repair dry, damaged hair. Noticeable difference.",
  "Hair feels silky and looks vibrant. Love this conditioner.",
  "Gentle formula suitable for daily use. Excellent quality.",
  "Leaves hair hydrated and healthy-looking. Will buy again.",
  "Perfect for detangling. Makes combing effortless.",
  "Hair has more shine and softness. Very pleased.",
  "Doesn't make hair flat or greasy. Just right.",
  "The texture is creamy and spreads easily. Works great.",
  "Hair feels nourished and protected. Highly recommend.",
  "Adds moisture without weighing hair down. Perfect.",
  "Leaves hair feeling soft and looking beautiful. Excellent.",
  "Hair is more manageable and less tangled. Love it.",
  "Restores natural shine and softness. Great conditioner.",
  "Gentle and effective. My hair has never felt better.",
  "Rinses cleanly and leaves hair silky. Will keep using.",
];

/** Known scent/fragrance/ingredient terms to extract from product name + description */
const SCENT_AND_INGREDIENT_TERMS = [
  "lavender", "almond", "shea", "coconut", "vanilla", "citrus", "lemon", "orange", "rose", "jasmine",
  "mint", "eucalyptus", "ocean", "fresh", "floral", "honey", "milk", "olive", "bergamot", "sandalwood",
  "ylang", "neroli", "chamomile", "green tea", "peach", "apricot", "cucumber", "aloe", "oat", "magnolia",
  "sea salt", "verbena", "cedar", "amber", "musk", "iris", "violet", "pomegranate", "ginger", "white tea",
  "cotton", "clean", "sensitive", "baby", "petal", "blossom", "herb", "natural", "sweet", "soft",
  "pine", "marine", "camellia", "argan", "macadamia", "cherry", "linden", "cranberry",
];

type ProductType = "soap" | "body_wash" | "shampoo" | "conditioner" | "generic";

interface ProductTraits {
  type: ProductType;
  /** First/main scent word found (e.g. "lavender") for use in comments */
  scent: string | null;
  /** All matching scent/ingredient words from name + description */
  scentWords: string[];
  /** Product name trimmed, for use in "Love [name]..." comments */
  productName: string;
  /** Short name (e.g. first 2–3 words) for brevity in comments */
  shortName: string;
  color: string | null;
}

function getProductTraits(
  name: string,
  slug: string,
  description: string | null,
  color: string | null
): ProductTraits {
  const n = name.toLowerCase();
  const s = slug.toLowerCase();
  const d = (description || "").toLowerCase();
  const text = `${n} ${s} ${d}`;

  let type: ProductType = "generic";

  // Shampoo detection (must come before body_wash since some shampoos contain "wash")
  if (/\bshampoo\b|shampoing/.test(n) || /shampoo|shampoing/.test(s)) {
    type = "shampoo";
  }
  // Conditioner detection
  else if (/\bconditioner\b|après-shampoo|apres-shampoo/.test(n) || /conditioner|apres-shampoo/.test(s)) {
    type = "conditioner";
  }
  // Soap detection
  else if (/\bsoap\b|bar-soap|bar soap/.test(n) || /\bsoap\b|bar-soap/.test(s)) {
    type = "soap";
  }
  // Body wash detection
  else if (/\bbody wash|shower gel|wash\b|gel\b/.test(n) || /body-wash|wash|gel/.test(s)) {
    type = "body_wash";
  }

  const scentWords: string[] = [];
  for (const term of SCENT_AND_INGREDIENT_TERMS) {
    if (text.includes(term)) scentWords.push(term);
  }
  const scent = scentWords[0] || null;
  const shortName = name.trim().split(/\s+/).slice(0, 3).join(" ").trim() || name;
  return {
    type,
    scent,
    scentWords,
    productName: name.trim(),
    shortName,
    color: color?.trim() || null,
  };
}

/** Base comment pools by product type (no product-specific wording) */
function getBasePoolForType(type: ProductType): string[] {
  switch (type) {
    case "soap": return SOAP_COMMENTS;
    case "body_wash": return BODY_WASH_COMMENTS;
    case "shampoo": return SHAMPOO_COMMENTS;
    case "conditioner": return CONDITIONER_COMMENTS;
    default: return BODY_WASH_COMMENTS; // Generic fallback to body wash comments
  }
}

/**
 * Build a comment pool for one product so reviews align with its exact name, scent, and details.
 * Combines base type comments with product-specific comments that mention the product name, scent, or color.
 */
function buildCommentPoolForProduct(traits: ProductTraits): string[] {
  const base = getBasePoolForType(traits.type);
  const productSpecific: string[] = [];
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Determine appropriate subject based on product type
  const subject = traits.type === "shampoo" || traits.type === "conditioner" ? "hair" : "skin";

  // Comments that mention the product name
  productSpecific.push(`Love ${traits.shortName}. Does exactly what I wanted and leaves ${subject} feeling great.`);
  productSpecific.push(`${traits.shortName} is now a staple in my routine. Quality and scent are spot on.`);
  productSpecific.push(`Really pleased with ${traits.shortName}. Will repurchase.`);
  productSpecific.push(`This ${traits.shortName.toLowerCase()} lives up to the description. Very happy.`);

  // Comments that mention scent (if we detected one)
  if (traits.scent) {
    const S = cap(traits.scent);
    productSpecific.push(`The ${traits.scent} scent is perfect – not too strong, just right.`);
    productSpecific.push(`Love the ${traits.scent} fragrance. Makes every use feel like a treat.`);
    productSpecific.push(`The ${traits.scent} is subtle and lovely. ${subject === "hair" ? "Hair" : "Skin"} feels clean and cared for.`);
    productSpecific.push(`${S} is one of my favourite scents and this product delivers.`);
    productSpecific.push(`The ${traits.scent} note is so nice. Will buy again.`);
    productSpecific.push(`Perfect ${traits.scent} scent. Gentle and effective.`);
  }

  // Comments that mention color (if product has color)
  if (traits.color) {
    productSpecific.push(`The ${traits.color} looks great and the product inside is even better.`);
    productSpecific.push(`Love the ${traits.color} option. Matches my bathroom and works beautifully.`);
  }

  // Merge: product-specific first so they get used often, then base pool
  return [...productSpecific, ...base];
}

/** Get or create seed users for reviews */
async function getOrCreateSeedUsers(count: number): Promise<string[]> {
  const existing = await prisma.user.findMany({
    take: count,
    select: { id: true },
  });
  const ids = existing.map((u) => u.id);
  if (ids.length >= count) return ids.slice(0, count);

  const toCreate = count - ids.length;
  for (let i = 0; i < toCreate; i++) {
    const email = `reviewer-personal-care-${Date.now()}-${i}@thelittlemart.local`;
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

function randomReviewDate(): Date {
  const start = new Date("2023-01-01T00:00:00.000Z").getTime();
  const end = new Date("2026-12-31T23:59:59.999Z").getTime();
  return new Date(start + Math.random() * (end - start));
}

export type SeedPersonalCareReviewsOptions = {
  /** If set, seed only this product (30–125 reviews). Otherwise seed all personal care products. */
  productId?: string;
};

const MIN_REVIEWS = 30;
const MAX_REVIEWS = 125;

/** Category slugs we treat as personal care (hair & body). Matches all products in these categories. */
const PERSONAL_CARE_SLUGS = [
  "shampoo", "conditioner", "body-wash", "bar-soap", "soap", "hair-care", "body-care", "personal-care",
  "bath-body", "bath-and-body", "bath", "hair", "body",
];

/**
 * Seed reviews for personal care products (shampoo, conditioner, body wash, bar soap).
 * 30–125 reviews per product, with comments specific to each product type.
 * Finds products by category: any category whose slug is in PERSONAL_CARE_SLUGS or whose
 * name/slug contains shampoo, conditioner, body wash, soap, hair, bath, or body.
 */
export async function seedPersonalCareReviews(
  options?: SeedPersonalCareReviewsOptions
): Promise<{ products: number; reviews: number }> {
  let products: { id: string; name: string; slug: string; description: string | null; color: string | null }[];

  if (options?.productId) {
    const product = await prisma.product.findUnique({
      where: { id: options.productId },
      select: { id: true, name: true, slug: true, description: true, color: true },
    });
    products = product ? [product] : [];
  } else {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { slug: { in: PERSONAL_CARE_SLUGS } },
          { name: { contains: "shampoo", mode: "insensitive" } },
          { name: { contains: "conditioner", mode: "insensitive" } },
          { name: { contains: "body wash", mode: "insensitive" } },
          { name: { contains: "soap", mode: "insensitive" } },
          { name: { contains: "hair", mode: "insensitive" } },
          { name: { contains: "bath", mode: "insensitive" } },
          { name: { contains: "body", mode: "insensitive" } },
          { slug: { contains: "shampoo", mode: "insensitive" } },
          { slug: { contains: "conditioner", mode: "insensitive" } },
          { slug: { contains: "body-wash", mode: "insensitive" } },
          { slug: { contains: "wash", mode: "insensitive" } },
          { slug: { contains: "soap", mode: "insensitive" } },
          { slug: { contains: "hair", mode: "insensitive" } },
          { slug: { contains: "bath", mode: "insensitive" } },
          { slug: { contains: "body", mode: "insensitive" } },
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
      select: { id: true, name: true, slug: true, description: true, color: true },
    });
  }

  if (products.length === 0) {
    return { products: 0, reviews: 0 };
  }

  const userIds = await getOrCreateSeedUsers(150);
  let totalReviews = 0;

  for (const product of products) {
    const reviewCount = MIN_REVIEWS + Math.floor(Math.random() * (MAX_REVIEWS - MIN_REVIEWS + 1)); // 30–125
    const targetAvg = 4.2 + Math.random() * 0.6; // 4.2–4.8
    const p5 = targetAvg - 4;
    const numFives = Math.round(reviewCount * p5);
    const numFours = reviewCount - numFives;

    const ratings: number[] = [];
    for (let i = 0; i < numFives; i++) ratings.push(5);
    for (let i = 0; i < numFours; i++) ratings.push(4);
    for (let i = ratings.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ratings[i], ratings[j]] = [ratings[j], ratings[i]];
    }

    const traits = getProductTraits(
      product.name,
      product.slug,
      product.description,
      product.color
    );
    const commentPool = buildCommentPoolForProduct(traits);

    const batch = Array.from({ length: reviewCount }, (_, i) => {
      const createdAt = randomReviewDate();
      const comment = commentPool[Math.floor(Math.random() * commentPool.length)];
      return {
        productId: product.id,
        userId: userIds[i % userIds.length],
        rating: ratings[i],
        comment,
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
