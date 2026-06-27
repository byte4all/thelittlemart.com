import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authAdmin } from "@/lib/auth";

/** Create one review for a product (admin). Body: { rating: number, comment: string, authorName?: string } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await authAdmin(request);
  if (!admin.ok) {
    return NextResponse.json(
      { success: false, error: admin.error },
      { status: admin.status }
    );
  }

  try {
    const { id: productId } = await params;
    const body = await request.json();
    const rating = typeof body.rating === "number" ? body.rating : Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    const authorName = typeof body.authorName === "string" ? body.authorName.trim() : null;

    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }
    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Comment is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    let userId: string;
    if (authorName) {
      const slug = authorName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 30) || "guest";
      const email = `reviewer-${slug}-${Date.now()}@thelittlemart.local`;
      
      const user = await prisma.user.upsert({
        where: { email },
        create: { email, name: authorName },
        update: { name: authorName },
        select: { id: true },
      });
      userId = user.id;
    } else {
      userId = admin.user.id;
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating: Math.round(rating),
        comment,
        title: null,
        isVerified: false,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create review" },
      { status: 500 }
    );
  }
}
