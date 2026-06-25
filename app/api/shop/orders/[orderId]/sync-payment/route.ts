import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBill } from "@/lib/billplz";
import { markOrderPaidAndSendEmail } from "@/lib/order-confirmation";
import { sendOrderConfirmationEmail } from "@/lib/resend";
import { getAuthUserAndSync } from "@/lib/auth";

/**
 * POST /api/shop/orders/[orderId]/sync-payment
 *
 * Fallback when Billplz callback does not reach our server: when the user lands
 * on the checkout success page, the client calls this to verify payment with
 * Billplz (GET bill) and, if paid, update the order and send the confirmation email.
 * Requires the current user to own the order.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getAuthUserAndSync(_request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;
    if (!orderId?.trim()) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId.trim() },
      include: {
        user: { select: { email: true, name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Order already marked paid (e.g. by webhook). Still send confirmation email
    // in case webhook didn't send it or email failed, so user gets it on success page.
    if (order.status === "CONFIRMED" && order.paymentStatus === "COMPLETED") {
      let emailSent = false;
      const customerEmail = order.user?.email?.trim().toLowerCase();
      if (customerEmail && !customerEmail.endsWith("@user.local")) {
        const shippingAddress = order.shippingAddress as {
          fullName?: string;
          address?: string;
          city?: string;
          state?: string;
          zip?: string;
          country?: string;
          phone?: string;
        } | null;
        const emailResult = await sendOrderConfirmationEmail({
          to: customerEmail,
          orderNumber: order.orderNumber,
          items: order.items.map((oi) => ({
            name: oi.product.name,
            quantity: oi.quantity,
            price: Number(oi.price),
          })),
          total: Number(order.total),
          shippingAddress: shippingAddress ?? undefined,
        });
        emailSent = emailResult.ok;
        if (!emailResult.ok) {
          console.error("sync-payment: confirmation email failed (already paid)", emailResult.error);
        }
      }
      return NextResponse.json({
        success: true,
        paid: true,
        alreadySynced: true,
        emailSent,
      });
    }

    if (!order.billplzBillId?.trim()) {
      return NextResponse.json(
        { success: false, paid: false, error: "No payment bill linked" },
        { status: 400 }
      );
    }

    const bill = await getBill(order.billplzBillId);
    if (!bill) {
      return NextResponse.json(
        { success: false, paid: false, error: "Could not fetch bill status" },
        { status: 502 }
      );
    }

    if (!bill.paid) {
      // Only mark FAILED after the bill is past due (due_at passed or state is overdue).
      // Until then leave PENDING so the customer can still pay.
      const dueAt = bill.due_at ? new Date(bill.due_at).getTime() : 0;
      const isOverdue = dueAt > 0 && Date.now() > dueAt;
      const stateOverdue = String(bill.state || "").toLowerCase() === "overdue";
      if (order.paymentStatus === "PENDING" && (isOverdue || stateOverdue)) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "FAILED" },
        });
      }
      return NextResponse.json({ success: true, paid: false });
    }

    const result = await markOrderPaidAndSendEmail(order, {
      transactionId: bill.id,
    });

    if (!result.ok) {
      console.error("sync-payment: markOrderPaidAndSendEmail failed", result.error);
      return NextResponse.json(
        { success: true, paid: true, emailSent: false, error: result.error },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, paid: true, emailSent: true });
  } catch (err) {
    console.error("sync-payment error:", err);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
