import ProductListSec from "@/components/common/ProductListSec";
import Brands from "@/components/homepage/Brands";
import DressStyle from "@/components/homepage/DressStyle";
import Header from "@/components/homepage/Header";
import Reviews from "@/components/homepage/Reviews";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getProductsList, getReviews } from "@/lib/shop-data";
import { buildCanonical, buildPageMetadata } from "@/lib/seo";
import { Product } from "@/types/product.types";
import { Review } from "@/types/review.types";

// Homepage uses DB directly so it works with Vercel Deployment Protection.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { ...buildPageMetadata({
  title: "Thelittlemart",
  description:
    "Shop curated everyday essentials across kitchenware, stationery, household items, condiments, personal care, and baby and kids categories.",
  path: "/",
}),
other: {
  "google-site-verification": "HaKrV4T1ESQ376R5A55sgEYbyW6lORw74hmH-wpnhuM",
},
};

function mapToProduct(p: {
  id: string;
  name: string;
  slug?: string;
  price: unknown;
  thumbnail?: string | null;
  images?: string[] | null;
  reviews?: { rating: number }[];
  productCategories?: { category: { slug: string } }[];
}): Product & { slug?: string; categorySlug?: string } {
  const reviews = p.reviews ?? [];
  const rating =
    reviews.length > 0
      ? reviews.reduce((a, r) => a + (r?.rating ?? 0), 0) / reviews.length
      : 0;
  const categorySlug = p.productCategories?.[0]?.category?.slug?.trim() ?? "shop";
  return {
    id: p.id as unknown as number,
    title: p.name,
    slug: p.slug,
    categorySlug,
    srcUrl:
      p.thumbnail ||
      (Array.isArray(p.images) && p.images[0]) ||
      "/images/placeholder.png",
    price: Number(p.price) || 0,
    discount: { amount: 0, percentage: 0 },
    rating,
  };
}

export default async function Home() {
  const [newArrivalsRes, topSellingRes, reviewsFromDb] = await Promise.all([
    getProductsList(prisma, {
      featured: true,
      limit: 4,
      sortBy: "createdAt",
      order: "desc",
    }),
    getProductsList(prisma, {
      bestSellers: true,
      limit: 4,
      sortBy: "createdAt",
      order: "desc",
    }),
    getReviews(prisma, 12),
  ]);

  const newArrivalsData = newArrivalsRes.products.map(mapToProduct);
  const topSellingData = topSellingRes.products.map(mapToProduct);
  const organizationJsonLd = {
    "@context": "https://www.schema.org",
    "@type": "Organization",
    name: "thelittlemart.com",
    url: buildCanonical("/"),
    email: "support@thelittlemart.com",
  };
  const websiteJsonLd = {
    "@context": "https://www.schema.org",
    "@type": "WebSite",
    name: "thelittlemart.com",
    url: buildCanonical("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${buildCanonical("/shop")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Header />
      <Brands />
      <main className="my-[50px] sm:my-[72px]">
        {newArrivalsData.length > 0 && (
          <div className="mb-[50px] sm:mb-20">
            <ProductListSec
              title="NEW ARRIVALS"
              data={newArrivalsData}
              viewAllLink="/shop#new-arrivals"
              compact
            />
          </div>
        )}
        {newArrivalsData.length > 0 && topSellingData.length > 0 && (
          <div className="max-w-frame mx-auto px-4 xl:px-0">
            <hr className="h-[1px] border-t-black/10 my-10 sm:my-16" />
          </div>
        )}
        {topSellingData.length > 0 && (
          <div className="mb-[50px] sm:mb-20">
            <ProductListSec
              title="TOP SELLING"
              data={topSellingData}
              viewAllLink="/shop#best-sellers"
              compact
            />
          </div>
        )}
        <div className="mb-[50px] sm:mb-20">
          <DressStyle />
        </div>
        {reviewsFromDb.length > 0 && <Reviews data={reviewsFromDb} />}
      </main>
    </>
  );
}
