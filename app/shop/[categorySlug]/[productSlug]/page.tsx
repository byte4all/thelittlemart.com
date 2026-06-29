import ProductPageContent from "@/app/shop/product/ProductPageContent";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasUserPurchasedProduct } from "@/lib/purchase-check";
import { buildCanonical, toAbsoluteUrl } from "@/lib/seo";
import { getAllProductPaths, getProductDetail } from "@/lib/shop-data";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { permanentRedirect } from "next/navigation";

/** Pre-render all product pages at build: /shop/{categorySlug}/{productSlug}. */
export async function generateStaticParams() {
  const paths = await getAllProductPaths(prisma);
  return paths.map((p) => ({
    categorySlug: p.categorySlug,
    productSlug: p.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string; productSlug: string }>;
}): Promise<Metadata> {
  const { productSlug } = await params;
  const product = await getProductDetail(prisma, productSlug);

  if (!product) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
    };
  }

  const categorySlugs = (product.productCategories ?? [])
    .map((pc) => pc.category?.slug)
    .filter(Boolean) as string[];
  const canonicalCategorySlug = categorySlugs[0] ?? "shop";
  const canonicalPath = `/shop/${canonicalCategorySlug}/${product.slug}`;
  const description =
    product.description?.trim() ||
    `Shop ${product.name} at thelittlemart.com`;
  const primaryImage = product.thumbnail || product.images?.[0];

  return {
    title: product.name,
    description,
    alternates: { canonical: buildCanonical(canonicalPath) },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: buildCanonical(canonicalPath),
      images: primaryImage ? [{ url: toAbsoluteUrl(primaryImage) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: primaryImage ? [toAbsoluteUrl(primaryImage)] : undefined,
    },
  };
}

export default async function CategoryProductPage({
  params,
}: {
  params: Promise<{ categorySlug: string; productSlug: string }>;
}) {
  const { categorySlug, productSlug } = await params;
  if (!productSlug) notFound();

  const headersList = await headers();
  const cookie = headersList.get("cookie") ?? "";
  const request = new Request("http://localhost", {
    headers: { cookie },
  });

  const [productRow, session] = await Promise.all([
    getProductDetail(prisma, productSlug),
    auth(request),
  ]);

  if (!productRow) notFound();

  const productCategorySlugs = (productRow.productCategories ?? [])
    .map((pc) => pc.category?.slug)
    .filter(Boolean) as string[];
  const canonicalCategorySlug = productCategorySlugs[0] ?? "shop";
  if (canonicalCategorySlug !== categorySlug) {
    permanentRedirect(`/shop/${canonicalCategorySlug}/${productRow.slug}`);
  }

  let canReview = false;
  if (session?.user) {
    canReview = await hasUserPurchasedProduct(session.user.id, productRow.id);
  }

  const canonicalPath = `/shop/${canonicalCategorySlug}/${productRow.slug}`;
  const canonicalUrl = buildCanonical(canonicalPath);
  const primaryImage = productRow.thumbnail || productRow.images?.[0];
  const aggregateRating =
    productRow.reviews.length > 0
      ? productRow.reviews.reduce((sum, review) => sum + review.rating, 0) /
        productRow.reviews.length
      : undefined;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productRow.name,
    description:
      productRow.description?.trim() ||
      `Shop ${productRow.name} at thelittlemart.com`,
    sku: productRow.sku ?? undefined,
    image: primaryImage ? [toAbsoluteUrl(primaryImage)] : undefined,
    brand: productRow.brand?.name
      ? {
          "@type": "Brand",
          name: productRow.brand.name,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "MYR",
      price: Number(productRow.price).toFixed(2),
      availability:
        productRow.quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      aggregateRating != null
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(aggregateRating.toFixed(2)),
            reviewCount: productRow.reviews.length,
          }
        : undefined,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: buildCanonical("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: buildCanonical("/shop"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: canonicalCategorySlug,
        item: buildCanonical(`/shop?category=${encodeURIComponent(canonicalCategorySlug)}`),
      },
      {
        "@type": "ListItem",
        position: 4,
        name: productRow.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductPageContent productRow={productRow} canReview={canReview} />
    </>
  );
}
