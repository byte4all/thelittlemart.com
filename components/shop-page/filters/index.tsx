"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CategoriesSection from "@/components/shop-page/filters/CategoriesSection";
import BrandsSection from "@/components/shop-page/filters/BrandsSection";
import ColorsSection from "@/components/shop-page/filters/ColorsSection";
import PriceSection from "@/components/shop-page/filters/PriceSection";
import SizeSection from "@/components/shop-page/filters/SizeSection";
import { Button } from "@/components/ui/button";
import type { CategoryOption } from "@/components/shop-page/filters/CategoriesSection";
import type { BrandOption } from "@/components/shop-page/filters/BrandsSection";

/** Category slugs that should keep the color filter visible when selected. */
const CATEGORIES_WITH_COLORS: string[] = [];

export type ShopFilterOptions = {
  categories: CategoryOption[];
  brands: BrandOption[];
  priceRange: { min: number; max: number };
  colors: string[];
  sizes: string[];
};

type FiltersProps = {
  options: ShopFilterOptions;
};

export default function Filters({ options }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? null;
  const brand = searchParams.get("brand") ?? null;
  const color = searchParams.get("color") ?? null;
  const size = searchParams.get("size") ?? null;
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const valueMin = minPrice ? parseFloat(minPrice) : 0;
  const valueMax = maxPrice ? parseFloat(maxPrice) : 0;

  const [priceRange, setPriceRange] = useState<[number, number]>([
    valueMin || options.priceRange.min,
    valueMax || options.priceRange.max,
  ]);

  // Keep price range in sync with URL so slider reflects applied filters and responds to decreases
  useEffect(() => {
    const min = valueMin > 0 ? valueMin : options.priceRange.min;
    const max = valueMax > 0 ? valueMax : options.priceRange.max;
    setPriceRange([min, max]);
  }, [valueMin, valueMax, options.priceRange.min, options.priceRange.max]);

  const hasActiveFilters =
    !!category ||
    !!brand ||
    !!color ||
    !!size ||
    valueMin > options.priceRange.min ||
    valueMax > 0 && valueMax < options.priceRange.max;

  const clearFilters = () => {
    router.push("/shop");
  };

  const buildUrl = useCallback(
    (overrides: {
      category?: string;
      brand?: string;
      color?: string;
      size?: string;
      minPrice?: number;
      maxPrice?: number;
    }) => {
      const params = new URLSearchParams();
      const cat = "category" in overrides ? overrides.category : category;
      const br = "brand" in overrides ? overrides.brand : brand;
      const col = "color" in overrides ? overrides.color : color;
      const sz = "size" in overrides ? overrides.size : size;
      const min = "minPrice" in overrides ? overrides.minPrice : (valueMin || options.priceRange.min);
      const max = "maxPrice" in overrides ? overrides.maxPrice : (valueMax || options.priceRange.max);

      if (cat) params.set("category", cat);
      if (br) params.set("brand", br);
      if (col) params.set("color", col);
      if (sz) params.set("size", sz);
      if (min != null && min > options.priceRange.min) params.set("minPrice", String(min));
      if (max != null && max < options.priceRange.max) params.set("maxPrice", String(max));
      return `/shop${params.toString() ? `?${params.toString()}` : ""}`;
    },
    [category, brand, color, size, valueMin, valueMax, options.priceRange]
  );

  const applyFilter = () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (color) params.set("color", color);
    if (size) params.set("size", size);
    if (priceRange[0] > options.priceRange.min) params.set("minPrice", String(priceRange[0]));
    if (priceRange[1] < options.priceRange.max) params.set("maxPrice", String(priceRange[1]));
    router.push(`/shop${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <>
      <hr className="border-t-black/10" />
      <CategoriesSection
        categories={options.categories}
        selectedSlug={category}
        buildUrl={(o) => buildUrl({ category: o.category })}
      />
      <hr className="border-t-black/10" />
      <PriceSection
        priceMin={options.priceRange.min}
        priceMax={options.priceRange.max}
        valueMin={valueMin}
        valueMax={valueMax}
        value={priceRange}
        onRangeChange={(a, b) => setPriceRange([a, b])}
      />
      {(!category || CATEGORIES_WITH_COLORS.includes(category)) && (
        <>
          <hr className="border-t-black/10" />
          <ColorsSection
            colors={options.colors}
            selectedColor={color}
            buildUrl={(o) => buildUrl({ color: o.color })}
          />
        </>
      )}
      <hr className="border-t-black/10" />
      <BrandsSection
        brands={options.brands}
        selectedSlug={brand}
        buildUrl={(o) => buildUrl({ brand: o.brand })}
      />
      <Button
        type="button"
        onClick={applyFilter}
        className="bg-brand w-full rounded-full text-sm font-medium py-4 h-12"
      >
        Apply Filter
      </Button>
      {hasActiveFilters && (
        <Button
          type="button"
          variant="outline"
          onClick={clearFilters}
          className="w-full rounded-full text-sm text-brand font-medium py-4 h-12 mt-2 border-black/20"
        >
          Clear filters
        </Button>
      )}
    </>
  );
}
