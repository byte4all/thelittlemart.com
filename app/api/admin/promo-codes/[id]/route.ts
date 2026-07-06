import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  normalizePromoCode,
  parsePromoDiscountType,
  serializePromoCode,
} from "@/lib/promo-code";
import { requireAdminApi } from "../../_utils";

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdminApi(request);
  if (forbidden) return forbidden;

  try {
    const { id } = await params;
    const promoCode = await prisma.promoCode.findUnique({ where: { id } });

    if (!promoCode) {
      return NextResponse.json({ success: false, error: "Promo code not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      promoCode: serializePromoCode(promoCode),
    });
  } catch (error) {
    console.error("Error fetching promo code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch promo code" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdminApi(request);
  if (forbidden) return forbidden;

  try {
    const { id } = await params;
    const body = await request.json();

    const code = typeof body.code === "string" ? normalizePromoCode(body.code) : "";
    if (!code) {
      return NextResponse.json({ success: false, error: "Code is required." }, { status: 400 });
    }

    const discountType = parsePromoDiscountType(body.discountType);
    if (!discountType) {
      return NextResponse.json(
        { success: false, error: "Discount type must be PERCENT or FIXED." },
        { status: 400 }
      );
    }

    const discountValue = Number(body.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return NextResponse.json(
        { success: false, error: "Discount value must be greater than 0." },
        { status: 400 }
      );
    }

    if (discountType === "PERCENT" && discountValue > 100) {
      return NextResponse.json(
        { success: false, error: "Percent discount cannot exceed 100." },
        { status: 400 }
      );
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

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: {
        code,
        discountType,
        discountValue,
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
    console.error("Error updating promo code:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A promo code with this code already exists." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update promo code" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdminApi(request);
  if (forbidden) return forbidden;

  try {
    const { id } = await params;
    await prisma.promoCode.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Promo code deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting promo code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete promo code" },
      { status: 500 }
    );
  }
}
