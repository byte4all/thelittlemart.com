import { NextRequest, NextResponse } from "next/server";
import { getPickupScheduleConfig } from "@/lib/pickup-schedule-store";
import {
  computeEarliestPickupDateKey,
  getAvailablePickupDateKeysInMonth,
  getAvailablePickupSlots,
  getDefaultPickupSlot,
  getSlotsForDate,
  getHoursForDateKey,
} from "@/lib/pickup-schedule";

export async function GET(request: NextRequest) {
  try {
    const config = await getPickupScheduleConfig();
    const fromParam = request.nextUrl.searchParams.get("from");
    const orderAt = fromParam ? new Date(fromParam) : new Date();
    if (Number.isNaN(orderAt.getTime())) {
      return NextResponse.json({ error: "Invalid from parameter" }, { status: 400 });
    }

    const monthParam = request.nextUrl.searchParams.get("month");
    const dateParam = request.nextUrl.searchParams.get("date");

    const slots = getAvailablePickupSlots(orderAt, config);
    const defaultSlot = getDefaultPickupSlot(orderAt, config);
    const earliestDate = computeEarliestPickupDateKey(orderAt, config);

    let monthDates: string[] | undefined;
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      const keys = getAvailablePickupDateKeysInMonth(y, m, orderAt, config);
      monthDates = [...keys].sort();
    }

    let dateSlots = undefined;
    let closeTime: string | undefined;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      dateSlots = getSlotsForDate(dateParam, orderAt, config);
      const hours = getHoursForDateKey(dateParam, config);
      if (!hours.closed) closeTime = hours.close;
    }

    return NextResponse.json({
      slots,
      defaultSlot,
      earliestDate,
      blockedDates: config.blockedDates,
      monthDates,
      dateSlots,
      closeTime,
    });
  } catch (error) {
    console.error("GET /api/shop/pickup-slots error:", error);
    return NextResponse.json({ error: "Failed to load pickup slots" }, { status: 500 });
  }
}
