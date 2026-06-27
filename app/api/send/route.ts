import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { OrderConfirmationEmail } from "@/components/email-template";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Thelittlemart <onboarding@resend.dev>";

type OrderConfirmationBody = {
  to: string;
  orderNumber: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  shippingAddress?: {
    fullName?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
  } | null;
};

/**
 * POST /api/send – send order confirmation email when payment is successful (Billplz callback).
 * Body: { to, orderNumber, items, total, shippingAddress }
 * Uses Resend with React email template.
 */
export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json(
        { error: "Resend not configured (RESEND_API_KEY missing)" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as OrderConfirmationBody;
    const { to, orderNumber, items, total, shippingAddress } = body;

    const normalizedTo = to?.trim().toLowerCase();
    if (!normalizedTo || normalizedTo.endsWith("@user.local")) {
      return NextResponse.json({ error: "Invalid or missing 'to' email" }, { status: 400 });
    }
    if (!orderNumber || !Array.isArray(items) || typeof total !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid orderNumber, items, or total" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [normalizedTo],
      subject: `Order confirmation ${orderNumber} – Thelittlemart`,
      react: OrderConfirmationEmail({
        orderNumber,
        items,
        total,
        shippingAddress: shippingAddress ?? undefined,
      }),
    });

    if (error) {
      console.error("Resend order confirmation error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Send failed" },
      { status: 500 }
    );
  }
}
