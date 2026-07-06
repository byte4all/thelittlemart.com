import type { PrismaClient } from "@prisma/client";
import { roundTo2 } from "@/lib/currency";

export type PromoDiscountType = "PERCENT" | "FIXED";

export type PromoCodeRecord = {
  id: string;
  code: string;
  discountType: PromoDiscountType;
  discountValue: { toString(): string } | number;
  minSubtotal: { toString(): string } | number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  isActive: boolean;
};

export function normalizePromoCode(input: string): string {
  return input.trim().toUpperCase();
}

export function calcPromoDiscount(
  subtotal: number,
  promo: Pick<PromoCodeRecord, "discountType" | "discountValue">
): number {
  const value = Number(promo.discountValue);
  if (!Number.isFinite(value) || value <= 0) return 0;

  let discount =
    promo.discountType === "PERCENT"
      ? roundTo2((subtotal * Math.min(value, 100)) / 100)
      : roundTo2(value);

  return roundTo2(Math.min(discount, subtotal));
}

export type PromoValidationResult =
  | { valid: true; discountAmount: number; promo: PromoCodeRecord }
  | { valid: false; error: string };

export async function validatePromoCode(
  prisma: PrismaClient,
  codeInput: string,
  subtotal: number
): Promise<PromoValidationResult> {
  const code = normalizePromoCode(codeInput);
  if (!code) {
    return { valid: false, error: "Please enter a promo code." };
  }

  const promo = await prisma.promoCode.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      discountType: true,
      discountValue: true,
      minSubtotal: true,
      maxUses: true,
      usedCount: true,
      expiresAt: true,
      isActive: true,
    },
  });

  if (!promo) {
    return { valid: false, error: "Invalid promo code." };
  }

  if (!promo.isActive) {
    return { valid: false, error: "This promo code is no longer active." };
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return { valid: false, error: "This promo code has expired." };
  }

  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    return { valid: false, error: "This promo code has reached its usage limit." };
  }

  const minSubtotal = promo.minSubtotal != null ? Number(promo.minSubtotal) : null;
  if (minSubtotal != null && subtotal < minSubtotal) {
    return {
      valid: false,
      error: `Minimum order of RM ${minSubtotal.toFixed(2)} required for this code.`,
    };
  }

  const discountAmount = calcPromoDiscount(subtotal, promo);
  if (discountAmount <= 0) {
    return { valid: false, error: "This promo code cannot be applied to your order." };
  }

  return { valid: true, discountAmount, promo };
}

export function parsePromoDiscountType(value: unknown): PromoDiscountType | null {
  if (value === "PERCENT" || value === "FIXED") return value;
  return null;
}

export function serializePromoCode(promo: {
  id: string;
  code: string;
  discountType: PromoDiscountType;
  discountValue: { toString(): string } | number;
  minSubtotal: { toString(): string } | number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    ...promo,
    discountValue: Number(promo.discountValue),
    minSubtotal: promo.minSubtotal != null ? Number(promo.minSubtotal) : null,
  };
}
