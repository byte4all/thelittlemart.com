import { NextRequest, NextResponse } from "next/server";
import { processDuePickupReminders } from "@/lib/order-notifications";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * Hourly cron: send automatic pickup reminders for due orders.
 * Secured with CRON_SECRET (Vercel Cron sends Authorization: Bearer automatically).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDuePickupReminders();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("pickup-reminders cron error:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
