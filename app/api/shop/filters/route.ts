import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFilters } from "@/lib/shop-data";

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get("category") ?? undefined;
    const data = await getFilters(prisma, { category });
    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Error fetching shop filters:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}
