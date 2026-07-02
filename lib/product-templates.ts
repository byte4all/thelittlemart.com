/**
 * Per-product overrides for FAQ and Product Details templates.
 * Stored in the Setting table (no schema change): product:{id}:faqTemplate, product:{id}:detailsTemplate.
 */

import { prisma } from "@/lib/prisma";
import type { CategoryKey } from "@/lib/product-page-content";

const FAQ_KEY_PREFIX = "product:";
const FAQ_KEY_SUFFIX = ":faqTemplate";
const DETAILS_KEY_SUFFIX = ":detailsTemplate";

function faqKey(productId: string): string {
  return `${FAQ_KEY_PREFIX}${productId}${FAQ_KEY_SUFFIX}`;
}

function detailsKey(productId: string): string {
  return `${FAQ_KEY_PREFIX}${productId}${DETAILS_KEY_SUFFIX}`;
}

const VALID_KEYS: CategoryKey[] = [
  "stationery",
  "stationery-pen-and-pencils",
  "stationery-papers-filing",
  "stationery-geometry",
  "stationery-staplers-and-staples",
  "household-items",
  "household-items-cleaning-supplies",
  "household-items-laundry-and-drying",
  "household-items-insect-repellents",
  "kitchenware",
  "kitchenware-cooking-tools",
  "kitchenware-bakeware-and-ovenware",
  "kitchenware-bar-and-drinks",
  "kitchenware-dining",
  "kitchenware-candles-and-party",
  "kitchenware-kitchen-tools",
  "condiments",
  "condiments-french-salt",
  "condiments-oil-and-vinegars",
  "personal-care",
  "baby-kids",
  "default",
];

function isValidCategoryKey(value: string): value is CategoryKey {
  return VALID_KEYS.includes(value as CategoryKey);
}

/** Normalize value from API/form: return CategoryKey or null for auto. */
export function normalizeTemplateOverride(value: unknown): CategoryKey | null {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  return isValidCategoryKey(s) ? s : null;
}

export type ProductTemplateOverrides = {
  faqTemplate: CategoryKey | null;
  detailsTemplate: CategoryKey | null;
};

/**
 * Get stored template overrides for a product. Returns null for each key when "Auto (from category)".
 */
export async function getProductTemplateOverrides(
  productId: string
): Promise<ProductTemplateOverrides> {
  const [faqRow, detailsRow] = await Promise.all([
    prisma.setting.findUnique({ where: { key: faqKey(productId) } }),
    prisma.setting.findUnique({ where: { key: detailsKey(productId) } }),
  ]);
  return {
    faqTemplate: normalizeTemplateOverride(faqRow?.value),
    detailsTemplate: normalizeTemplateOverride(detailsRow?.value),
  };
}

/**
 * Save template overrides. Pass null or "" to clear (use Auto from category).
 */
export async function setProductTemplateOverrides(
  productId: string,
  overrides: { faqTemplate?: CategoryKey | null | ""; detailsTemplate?: CategoryKey | null | "" }
): Promise<void> {
  const toSet: { key: string; value: string }[] = [];
  if (overrides.faqTemplate !== undefined) {
    const v =
      overrides.faqTemplate === null || overrides.faqTemplate === ""
        ? ""
        : overrides.faqTemplate;
    toSet.push({ key: faqKey(productId), value: v });
  }
  if (overrides.detailsTemplate !== undefined) {
    const v =
      overrides.detailsTemplate === null || overrides.detailsTemplate === ""
        ? ""
        : overrides.detailsTemplate;
    toSet.push({ key: detailsKey(productId), value: v });
  }
  await Promise.all(
    toSet.map(({ key, value }) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    )
  );
}
