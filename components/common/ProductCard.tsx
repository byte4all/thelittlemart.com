"use client";

import React from "react";
import Rating from "../ui/Rating";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product.types";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { getScrollStorageKey } from "./ReturnScrollRestorer";

type ProductCardProps = {
  data: Product & { name?: string; slug?: string; thumbnail?: string; images?: string[]; reviews?: { rating: number }[]; categorySlug?: string };
  /** When true, uses refined price + stars styling (main page only) */
  compact?: boolean;
};

/** Slug for URL: use DB slug, or build from title/name. */
function productSlug(data: ProductCardProps["data"]): string {
  if (data.slug) return data.slug;
  const title = data.title ?? data.name ?? "";
  return String(title).split(" ").filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9-]/g, "") || String(data.id);
}

function productTitle(data: ProductCardProps["data"]): string {
  return String(data.title ?? data.name ?? "").trim() || "Product";
}

function productImage(data: ProductCardProps["data"]): string {
  if (data.srcUrl) return data.srcUrl;
  if (data.thumbnail) return data.thumbnail;
  const images = Array.isArray(data.images) ? data.images : [];
  return images[0] ?? "/images/placeholder.png";
}

function productDiscount(data: ProductCardProps["data"]): { amount: number; percentage: number } {
  return data.discount ?? { amount: 0, percentage: 0 };
}

function productRating(data: ProductCardProps["data"]): number {
  if (typeof data.rating === "number") return data.rating;
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((a, r) => a + (r?.rating ?? 0), 0);
  return sum / reviews.length;
}

const ProductCard = ({ data, compact = false }: ProductCardProps) => {
  const title = productTitle(data);
  const slug = productSlug(data);
  const srcUrl = productImage(data);
  const discount = productDiscount(data);
  const rating = productRating(data);
  const { formatPrice } = useCurrency();
  const categorySlug = data.categorySlug ?? "shop";
  const href = `/shop/${categorySlug}/${slug}`;
  const scrollRestorePendingKey = "thelittlemart:scroll:pending";

  const handleClick = () => {
    if (typeof window === "undefined") {
      return;
    }

    const isShopListingPage = window.location.pathname === "/shop";

    // Only preserve scroll when leaving the main shop listing page.
    if (!isShopListingPage) {
      sessionStorage.removeItem(scrollRestorePendingKey);
      return;
    }

    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    sessionStorage.setItem(scrollRestorePendingKey, currentPath);
    sessionStorage.setItem(getScrollStorageKey(currentPath), String(window.scrollY));
  };

  return (
    <Link
      href={href}
      scroll
      onClick={handleClick}
      className="flex flex-col items-start aspect-auto"
    >
      <div className="bg-[#F0EEED] rounded-[13px] lg:rounded-[20px] w-full lg:max-w-[295px] aspect-square mb-2.5 xl:mb-4 overflow-hidden">
        <Image
          src={srcUrl}
          width={295}
          height={298}
          className="rounded-md w-full h-full object-contain hover:scale-110 transition-all duration-500"
          alt={title}
          priority
        />
      </div>
      {compact ? (
        <>
          <strong className="text-black text-sm sm:text-base xl:text-xl font-semibold leading-tight mb-1.5">{title}</strong>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {discount.percentage > 0 ? (
              <span className="font-bold text-black text-lg sm:text-xl xl:text-2xl">
                {formatPrice(Math.round(data.price - (data.price * discount.percentage) / 100))}
              </span>
            ) : discount.amount > 0 ? (
              <span className="font-bold text-black text-lg sm:text-xl xl:text-2xl">
                {formatPrice(data.price - discount.amount)}
              </span>
            ) : (
              <span className="font-bold text-black text-lg sm:text-xl xl:text-2xl">
                {formatPrice(data.price)}
              </span>
            )}
            {(discount.percentage > 0 || discount.amount > 0) && (
              <span className="font-semibold text-black/45 line-through text-sm sm:text-base xl:text-lg">
                {formatPrice(data.price)}
              </span>
            )}
            {discount.percentage > 0 && (
              <span className="font-medium text-[10px] sm:text-xs py-1 px-2.5 rounded-full bg-[#FF3333]/10 text-[#FF3333]">
                {`-${discount.percentage}%`}
              </span>
            )}
            {discount.amount > 0 && !discount.percentage && (
              <span className="font-medium text-[10px] sm:text-xs py-1 px-2.5 rounded-full bg-[#FF3333]/10 text-[#FF3333]">
                {`-${formatPrice(discount.amount)}`}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 ml-0.5">
              <Rating
                initialValue={rating}
                allowFraction
                SVGclassName="inline-block"
                emptyClassName="fill-gray-200"
                size={14}
                readonly
              />
              <span className="text-black/80 text-xs font-medium tabular-nums">
                {rating.toFixed(1)}
                <span className="text-black/50 font-normal">/5</span>
              </span>
            </span>
          </div>
        </>
      ) : (
        <>
          <strong className="text-black xl:text-xl">{title}</strong>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            {discount.percentage > 0 ? (
              <span className="font-bold text-black text-xl xl:text-2xl">
                {formatPrice(Math.round(data.price - (data.price * discount.percentage) / 100))}
              </span>
            ) : discount.amount > 0 ? (
              <span className="font-bold text-black text-xl xl:text-2xl">
                {formatPrice(data.price - discount.amount)}
              </span>
            ) : (
              <span className="font-bold text-black text-xl xl:text-2xl">
                {formatPrice(data.price)}
              </span>
            )}
            {(discount.percentage > 0 || discount.amount > 0) && (
              <span className="font-bold text-black/40 line-through text-lg xl:text-xl">
                {formatPrice(data.price)}
              </span>
            )}
            {discount.percentage > 0 && (
              <span className="font-medium text-[10px] xl:text-xs py-1 px-2.5 rounded-full bg-[#FF3333]/10 text-[#FF3333]">
                {`-${discount.percentage}%`}
              </span>
            )}
            {discount.amount > 0 && !discount.percentage && (
              <span className="font-medium text-[10px] xl:text-xs py-1 px-2.5 rounded-full bg-[#FF3333]/10 text-[#FF3333]">
                {`-${formatPrice(discount.amount)}`}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Rating
                initialValue={rating}
                allowFraction
                SVGclassName="inline-block"
                emptyClassName="fill-gray-200"
                size={16}
                readonly
              />
              <span className="text-black/80 text-xs font-medium tabular-nums">
                {rating.toFixed(1)}
                <span className="text-black/50">/5</span>
              </span>
            </span>
          </div>
        </>
      )}
    </Link>
  );
};

export default ProductCard;
