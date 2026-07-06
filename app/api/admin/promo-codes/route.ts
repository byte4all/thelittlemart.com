import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  normalizePromoCode,
  parsePromoDiscountType,
  serializePromoCode,
} from "@/lib/promo-code";
import { requireAdminApi } from "../_utils";

function parseOptionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalInt(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

function validatePromoInput(body: {
  code?: unknown;
  discountType?: unknown;
  discountValue?: unknown;
}): { error?: string; code?: string; discountType?: "PERCENT" | "FIXED"; discountValue?: number } {
  const code = typeof body.code === "string" ? normalizePromoCode(body.code) : "";
  if (!code) {
    return { error: "Code is required." };
  }

  const discountType = parsePromoDiscountType(body.discountType);
  if (!discountType) {
    return { error: "Discount type must be PERCENT or FIXED." };
  }

  const discountValue = Number(body.discountValue);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { error: "Discount value must be greater than 0." };
  }

  if (discountType === "PERCENT" && discountValue > 100) {
    return { error: "Percent discount cannot exceed 100." };
  }

  return { code, discountType, discountValue };
}

export async function GET(request: Request) {
  const forbidden = await requireAdminApi(request);
  if (forbidden) return forbidden;

  try {
    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      promoCodes: promoCodes.map(serializePromoCode),
    });
  } catch (error: unknown) {
    console.error("Error fetching promo codes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch promo codes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const forbidden = await requireAdminApi(request);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const parsed = validatePromoInput(body);
    if (parsed.error || !parsed.code || !parsed.discountType || parsed.discountValue == null) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const minSubtotal = parseOptionalNumber(body.minSubtotal);
    const maxUses = parseOptionalInt(body.maxUses);
    const expiresAt =
      typeof body.expiresAt === "string" && body.expiresAt.trim()
        ? new Date(body.expiresAt)
        : null;

    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid expiry date." }, { status: 400 });
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        code: parsed.code,
        discountType: parsed.discountType,
        discountValue: parsed.discountValue,
        minSubtotal,
        maxUses,
        expiresAt,
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json({
      success: true,
      promoCode: serializePromoCode(promoCode),
    });
  } catch (error: unknown) {
    console.error("Error creating promo code:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A promo code with this code already exists." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create promo code" },
      { status: 500 }
    );
  }
}
