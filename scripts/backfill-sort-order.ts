/**
 * One-time backfill: category sortOrder (alphabetical), productCategory sortOrder (by product createdAt).
 * Run: npx tsx scripts/backfill-sort-order.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const parents = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: {
      children: { orderBy: { name: "asc" } },
    },
  });

  for (let i = 0; i < parents.length; i++) {
    await prisma.category.update({
      where: { id: parents[i].id },
      data: { sortOrder: i * 10, listMode: "ROLLUP" },
    });
    for (let j = 0; j < parents[i].children.length; j++) {
      await prisma.category.update({
        where: { id: parents[i].children[j].id },
        data: { sortOrder: j * 10 },
      });
    }
  }

  const categories = await prisma.category.findMany({ select: { id: true } });
  for (const cat of categories) {
    const rows = await prisma.productCategory.findMany({
      where: { categoryId: cat.id },
      include: { product: { select: { createdAt: true } } },
      orderBy: { product: { createdAt: "asc" } },
    });
    for (let k = 0; k < rows.length; k++) {
      await prisma.productCategory.update({
        where: {
          productId_categoryId: {
            productId: rows[k].productId,
            categoryId: rows[k].categoryId,
          },
        },
        data: { sortOrder: k * 10 },
      });
    }
  }

  console.log("Backfill complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
