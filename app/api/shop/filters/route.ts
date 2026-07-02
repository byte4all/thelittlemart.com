import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFilters } from "@/lib/shop-data";

export async function GET() {
  try {
    const data = await getFilters(prisma);
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
