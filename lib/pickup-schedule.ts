import {
  addCalendarDays,
  dateKey,
  getDatePartsInMyt,
  isAtOrAfterTimeInMyt,
  mytDateTimeToUtc,
  parseTimeToMinutes,
} from "@/lib/myt-time";
import type { DayOfWeek, PickupScheduleConfig, PickupSlot } from "@/lib/pickup-schedule-config";

export type { PickupScheduleConfig, PickupSlot, DayOfWeek, DayHours } from "@/lib/pickup-schedule-config";
export {
  DAYS_OF_WEEK,
  getDefaultPickupScheduleConfig,
  normalizePickupScheduleConfig,
} from "@/lib/pickup-schedule-config";

const DAY_INDEX_TO_KEY: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function dayKeyFromDateKey(dateKeyStr: string): DayOfWeek {
  const [y, m, d] = dateKeyStr.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return DAY_INDEX_TO_KEY[dow];
}

export function getHoursForDateKey(
  dateKeyStr: string,
  config: PickupScheduleConfig
): { open: string; close: string; closed: boolean } {
  const dayKey = dayKeyFromDateKey(dateKeyStr);
  return config.weeklyHours[dayKey];
}

export function computeEarliestPickupDateKey(orderAt: Date, config: PickupScheduleConfig): string {
  let eligibleStart = dateKey(getDatePartsInMyt(orderAt));
  if (isAtOrAfterTimeInMyt(orderAt, config.cutoffTime)) {
    eligibleStart = addCalendarDays(eligibleStart, 1);
  }
  return addCalendarDays(eligibleStart, config.minLeadDays);
}

function isDayAvailable(dateKeyStr: string, config: PickupScheduleConfig): boolean {
  if (config.blockedDates.includes(dateKeyStr)) return false;
  const dayKey = dayKeyFromDateKey(dateKeyStr);
  const hours = config.weeklyHours[dayKey];
  return !hours.closed;
}

function generateSlotsForDay(
  dateKeyStr: string,
  config: PickupScheduleConfig,
  notBefore: Date
): PickupSlot[] {
  if (!isDayAvailable(dateKeyStr, config)) return [];

  const dayKey = dayKeyFromDateKey(dateKeyStr);
  const hours = config.weeklyHours[dayKey];
  const openMins = parseTimeToMinutes(hours.open);
  const closeMins = parseTimeToMinutes(hours.close);
  if (closeMins <= openMins) return [];

  const slots: PickupSlot[] = [];
  for (let mins = openMins; mins < closeMins; mins += config.slotIntervalMinutes) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const iso = mytDateTimeToUtc(dateKeyStr, time).toISOString();
    const slotDate = new Date(iso);
    if (slotDate.getTime() <= notBefore.getTime()) continue;
    slots.push({ date: dateKeyStr, time, iso });
  }
  return slots;
}

export function getAvailablePickupSlots(
  orderAt: Date,
  config: PickupScheduleConfig,
  limitDays = 30
): PickupSlot[] {
  const earliestKey = computeEarliestPickupDateKey(orderAt, config);
  const slots: PickupSlot[] = [];
  let cursor = earliestKey;

  for (let i = 0; i < limitDays && slots.length < 200; i++) {
    slots.push(...generateSlotsForDay(cursor, config, orderAt));
    cursor = addCalendarDays(cursor, 1);
  }

  return slots;
}

export function getDefaultPickupSlot(
  orderAt: Date,
  config: PickupScheduleConfig
): PickupSlot | null {
  const slots = getAvailablePickupSlots(orderAt, config);
  return slots[0] ?? null;
}

export function validatePickupSlot(
  iso: string,
  orderAt: Date,
  config: PickupScheduleConfig
): { valid: boolean; error?: string } {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { valid: false, error: "Invalid pickup date/time" };
  }

  const available = getAvailablePickupSlots(orderAt, config);
  const targetMs = parsed.getTime();
  const match = available.find((s) => new Date(s.iso).getTime() === targetMs);
  if (!match) {
    return { valid: false, error: "Selected pickup slot is not available" };
  }
  return { valid: true };
}

export function getAvailablePickupDateKeysInMonth(
  year: number,
  month: number,
  orderAt: Date,
  config: PickupScheduleConfig
): Set<string> {
  const startKey = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const endKey = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const allSlots = getAvailablePickupSlots(orderAt, config, 60);
  const keys = new Set<string>();
  for (const slot of allSlots) {
    if (slot.date >= startKey && slot.date <= endKey) {
      keys.add(slot.date);
    }
  }
  return keys;
}

export function getSlotsForDate(
  dateKeyStr: string,
  orderAt: Date,
  config: PickupScheduleConfig
): PickupSlot[] {
  return generateSlotsForDay(dateKeyStr, config, orderAt).filter((slot) => {
    const earliestKey = computeEarliestPickupDateKey(orderAt, config);
    return slot.date >= earliestKey;
  });
}
