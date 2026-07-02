import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductsList } from "@/lib/shop-data";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") ?? undefined;
    const brand = searchParams.get("brand") ?? undefined;
    const featured = searchParams.get("featured");
    const bestSellers = searchParams.get("bestSellers");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const sortByParam = searchParams.get("sortBy");
    const sortBy =
      sortByParam ??
      (category ? "manual" : "createdAt");
    const order = (searchParams.get("order") === "asc" ? "asc" : "desc") as "asc" | "desc";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const color = searchParams.get("color") ?? undefined;
    const size = searchParams.get("size") ?? undefined;

    const minPriceNum = minPrice != null && minPrice !== "" ? parseFloat(minPrice) : undefined;
    const maxPriceNum = maxPrice != null && maxPrice !== "" ? parseFloat(maxPrice) : undefined;

    const { products, total, priceRange } = await getProductsList(prisma, {
      category,
      brand,
      featured: featured === "true" ? true : undefined,
      bestSellers: bestSellers === "true" ? true : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sortBy,
      order,
      minPrice: minPriceNum != null && !Number.isNaN(minPriceNum) ? minPriceNum : undefined,
      maxPrice: maxPriceNum != null && !Number.isNaN(maxPriceNum) ? maxPriceNum : undefined,
      color,
      size,
    });

    return NextResponse.json({
      success: true,
      products,
      total,
      priceRange,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
