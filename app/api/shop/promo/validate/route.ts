import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePromoCode } from "@/lib/promo-code";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = typeof body.code === "string" ? body.code : "";
    const subtotal = Number(body.subtotal);

    if (!code.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter a promo code." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid order subtotal." },
        { status: 400 }
      );
    }

    const result = await validatePromoCode(prisma, code, subtotal);
    if (result.valid === false) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      code: result.promo.code,
      discountAmount: result.discountAmount,
    });
  } catch (error) {
    console.error("Error validating promo code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate promo code." },
      { status: 500 }
    );
  }
}
