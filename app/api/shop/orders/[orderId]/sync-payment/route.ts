import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBill } from "@/lib/billplz";
import { markOrderPaidAndSendEmail, sendOrderConfirmationForOrderData } from "@/lib/order-confirmation";
import { markOrderFailedAndNotify } from "@/lib/order-notifications";
import { hasSuccessfulAutoSend } from "@/lib/notification-log";
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

    // Order already marked paid (e.g. by webhook). Only retry email if not sent yet.
    if (order.status === "CONFIRMED" && order.paymentStatus === "COMPLETED") {
      const alreadySent = await hasSuccessfulAutoSend(order.id, "ORDER_CONFIRMATION");
      if (alreadySent) {
        return NextResponse.json({
          success: true,
          paid: true,
          alreadySynced: true,
          emailSent: false,
        });
      }

      const emailResult = await sendOrderConfirmationForOrderData(order, {
        trigger: "AUTO",
      });
      if (!emailResult.ok) {
        console.error("sync-payment: confirmation email failed (already paid)", emailResult.error);
      }
      return NextResponse.json({
        success: true,
        paid: true,
        alreadySynced: true,
        emailSent: emailResult.emailSent ?? false,
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
        const failedResult = await markOrderFailedAndNotify(order.id);
        if (!failedResult.ok) {
          console.error("sync-payment: markOrderFailedAndNotify failed", failedResult.error);
        }
        return NextResponse.json({
          success: true,
          paid: false,
          paymentFailed: true,
          emailSent: failedResult.emailSent ?? false,
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

    return NextResponse.json({
      success: true,
      paid: true,
      emailSent: result.emailSent ?? false,
    });
  } catch (err) {
    console.error("sync-payment error:", err);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
