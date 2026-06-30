import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../_utils";
import { sendTrackingEmailForOrder } from "@/lib/order-notifications";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdminApi(request);
  if (forbidden) return forbidden;

  try {
    const { id } = await params;
    const result = await sendTrackingEmailForOrder(id, { force: true, trigger: "MANUAL" });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Failed to send tracking email" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      emailSent: result.emailSent ?? false,
    });
  } catch (error) {
    console.error("send-tracking-email error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send tracking email" },
      { status: 500 }
    );
  }
}
