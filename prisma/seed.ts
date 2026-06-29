/**
 * Seed the database with reviewer users and reviews for (towel) products.
 * Run with: npx prisma db seed
 *
 * - Creates reviewer users (e.g. Alex K., Sarah M.) if they don't exist
 * - Finds products in "towel" categories (or all products if none)
 * - Adds 25–115 positive reviews per product (rating 4–5)
 */

import { prisma } from "../lib/prisma";

const REVIEWER_NAMES = [
  "Alex K.",
  "Sarah M.",
  "Ethan R.",
  "Olivia P.",
  "Liam K.",
  "Samantha D.",
  "James W.",
  "Emma L.",
  "Noah B.",
  "Ava S.",
  "Oliver T.",
  "Sophie H.",
  "Lucas M.",
  "Isabella C.",
  "Mason J.",
  "Mia R.",
  "Liam F.",
  "Charlotte K.",
  "Benjamin P.",
  "Amelia W.",
  "Elijah S.",
  "Harper D.",
  "William G.",
  "Evelyn N.",
  "Henry L.",
  "Abigail T.",
  "Alexander V.",
  "Emily B.",
  "Sebastian M.",
  "Elizabeth R.",
  "Jack H.",
  "Sofia C.",
  "Owen J.",
  "Avery L.",
  "Daniel K.",
  "Ella P.",
  "Matthew S.",
  "Scarlett W.",
  "Joseph N.",
  "Grace F.",
  "Samuel D.",
  "Chloe G.",
  "David R.",
  "Victoria M.",
  "Carter H.",
  "Riley B.",
  "Wyatt T.",
  "Aria K.",
  "John P.",
  "Zoey L.",
  "Dylan S.",
  "Penelope W.",
  "Leo N.",
  "Layla C.",
  "Lincoln J.",
  "Nora D.",
  "Jaxon M.",
  "Camila R.",
  "Asher H.",
  "Hannah G.",
  "Christopher B.",
  "Lillian T.",
  "Josiah K.",
  "Addison P.",
  "Andrew S.",
  "Eleanor W.",
  "Theodore D.",
  "Natalie M.",
  "Caleb R.",
  "Lily H.",
  "Ryan G.",
  "Hazel B.",
  "Nathan T.",
  "Violet K.",
  "Thomas S.",
  "Aurora P.",
  "Charles D.",
  "Savannah M.",
  "Isaiah R.",
  "Audrey H.",
  "Josiah N.",
  "Brooklyn G.",
  "Adrian B.",
  "Bella T.",
  "Hunter K.",
  "Claire S.",
  "Eli W.",
  "Skylar D.",
  "Connor M.",
  "Lucy R.",
  "Christian H.",
  "Paisley G.",
  "Landen B.",
  "Everly T.",
  "Colton K.",
  "Anna S.",
  "Jordan D.",
  "Caroline M.",
  "Roman R.",
  "Nevaeh H.",
  "Aaron G.",
  "Genesis B.",
  "Evan T.",
  "Aaliyah K.",
  "Robert S.",
  "Kennedy D.",
  "Nicholas M.",
  "Kinsley R.",
  "Angel H.",
  "Allison G.",
  "Dominic B.",
  "Maya T.",
  "Austin K.",
  "Madelyn S.",
];

const POSITIVE_COMMENTS = [
  // 5-star reviews
  "Absolutely love these towels! The quality is outstanding and they feel so luxurious after every shower.",
  "Best beach towel I've ever owned. The colors are vibrant and it dries surprisingly fast.",
  "These towels are worth every penny. Soft, absorbent, and the Saint-Tropez vibe is real.",
  "Bought two for our bathroom and one for the beach. Perfect size and beautifully made.",
  "The premium quality really shows. No lint, great absorbency, and feels amazing on skin.",
  "I'm obsessed! Took it to the pool and got so many compliments on the color.",
  "Finally, a towel that doesn't feel rough after a few washes. Still soft after months of use.",
  "Gorgeous towel that looks expensive. Love the French Riviera aesthetic.",
  "Super plush and absorbent. Makes my bathroom feel like a spa.",
  "The Aqua color is even more beautiful in person. Highly recommend!",
  "Great for sensitive skin - no irritation at all. Very gentle and soft.",
  "Dries me off quickly and the towel itself air-dries fast too. Perfect for humid climates.",
  "Brought this to the beach and it stayed sand-free. Game changer!",
  "The color hasn't faded after multiple washes. Quality construction.",
  "Feels like a hotel towel - that thick, luxurious feel. Love it!",
  "My new favorite towel. The weight is perfect - not too heavy, not too thin.",
  "Beautiful addition to my bathroom. The Bordeaux color is so rich and elegant.",
  "Absorbent without being bulky. Takes up less space in my beach bag.",
  "This towel is everything! Soft, beautiful, and dries quickly.",
  "Exactly what I was looking for. Premium quality at a fair price.",
  
  // 4-star reviews (still positive but with minor notes)
  "Really nice towel! Slightly smaller than I expected but still great quality.",
  "Love the softness and color. Takes a bit longer to dry than my other towels but worth it.",
  "Beautiful towel, very absorbent. Wish it came in more color options.",
  "Great quality overall. The first wash did shed a tiny bit but normal after that.",
  "Very happy with this purchase. Would give 5 stars if it was a bit larger.",
  "Gorgeous towel! Just note it's more decorative than my everyday towels - I save it for special occasions.",
  "Soft and lovely. The color is slightly different from the photo but still beautiful.",
  "Really nice but took a couple washes to reach full softness. Patience pays off!",
  "Good quality towel. A bit pricey but you get what you pay for.",
  "Love it! Only downside is it takes up more room in the wash than I expected.",
  
  // More varied 5-star
  "Exceeded expectations! The Marine blue is absolutely stunning.",
  "Can't say enough good things. Makes getting out of the shower feel luxurious.",
  "Purchased all four colors - they're all gorgeous. My bathroom has never looked better.",
  "The quality is immediately noticeable. You can feel the difference.",
  "Perfect weight and texture. Not scratchy at all like some towels.",
  "Great for the gym too! Compact enough but still absorbent.",
  "These towels make me feel like I'm on vacation every day. Love the vibe!",
  "My partner and I each got one and we fight over who gets which color!",
  "Holds up beautifully in the wash. Still looks new after 6 months.",
  "The Bubble color is such a beautiful neutral. Goes with everything.",
  "So glad I found these! Finally a quality towel that doesn't cost a fortune.",
  "Perfect housewarming gift. My friend absolutely loved it.",
  "The absorbency is incredible. Wraps around comfortably too.",
  "Love supporting a quality brand. These towels are chef's kiss!",
  "Stylish AND functional. Rare combo in towels!",
  "The Rubis red is bold and beautiful. Makes a statement.",
  "No regrets with this purchase. Would buy again in a heartbeat.",
  "Great for yoga too - stays put on my mat and absorbs sweat perfectly.",
  "These feel like they'll last for years. Solid investment.",
  "Treated myself and so happy I did. Self-care starts with good towels!"
];

/** Random date between 2023-01-01 and 2026-12-31 for review variety */
function randomReviewDate(): Date {
  const start = new Date("2023-01-01T00:00:00.000Z").getTime();
  const end = new Date("2026-12-31T23:59:59.999Z").getTime();
  return new Date(start + Math.random() * (end - start));
}

async function ensureReviewerUsers(): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < REVIEWER_NAMES.length; i++) {
    const name = REVIEWER_NAMES[i];
    const email = `seed-reviewer-${i + 1}@thelittlemart.local`;
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, name },
      update: { name },
      select: { id: true },
    });
    ids.push(user.id);
  }
  return ids;
}

export async function main() {
  console.log("Seeding: creating reviewer users and reviews...\n");

  const userIds = await ensureReviewerUsers();
  console.log(`Created/found ${userIds.length} reviewer users.`);

  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { slug: { contains: "towel", mode: "insensitive" } },
        { name: { contains: "towel", mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  const categoryIds = categories.map((c: { id: string }) => c.id);

  let products: { id: string }[];
  if (categoryIds.length > 0) {
    products = await prisma.product.findMany({
      where: {
        productCategories: { some: { categoryId: { in: categoryIds } } },
        isActive: true,
      },
      select: { id: true },
    });
    console.log(`Found ${products.length} towel product(s).`);
  } else {
    products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    console.log(`No towel categories found. Using all ${products.length} active product(s).`);
  }

  if (products.length === 0) {
    console.log("No products to add reviews to. Seed done.");
    return;
  }

  let totalReviews = 0;
  for (const product of products) {
    const reviewCount = 25 + Math.floor(Math.random() * 91);
    const targetAvg = 4.2 + Math.random() * 0.6;
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

    const batch = Array.from({ length: reviewCount }, (_, i) => {
      const createdAt = randomReviewDate();
      return {
        productId: product.id,
        userId: userIds[i % userIds.length],
        rating: ratings[i],
        comment: POSITIVE_COMMENTS[i % POSITIVE_COMMENTS.length],
        title: null as string | null,
        isVerified: Math.random() > 0.3,
        createdAt,
        updatedAt: createdAt,
      };
    });
    await prisma.review.createMany({ data: batch });
    totalReviews += reviewCount;
  }

  console.log(`Created ${totalReviews} reviews across ${products.length} product(s).`);
  console.log("\nSeed completed.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
