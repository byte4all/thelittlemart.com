import { MYT } from "@/lib/myt-time";

export const PICKUP_SCHEDULE_SETTING_KEY = "pickupSchedule";

export const DAYS_OF_WEEK = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export type DayHours = {
  closed: boolean;
  open: string;
  close: string;
};

export type PickupScheduleConfig = {
  timezone: typeof MYT;
  cutoffTime: string;
  minLeadDays: number;
  slotIntervalMinutes: number;
  weeklyHours: Record<DayOfWeek, DayHours>;
  blockedDates: string[];
};

export type PickupSlot = {
  date: string;
  time: string;
  iso: string;
};

function defaultDayHours(closed = false): DayHours {
  return { closed, open: "10:00", close: "18:00" };
}

export function getDefaultPickupScheduleConfig(): PickupScheduleConfig {
  const weeklyHours = {} as Record<DayOfWeek, DayHours>;
  for (const day of DAYS_OF_WEEK) {
    weeklyHours[day] = defaultDayHours(day === "sun");
  }
  return {
    timezone: MYT,
    cutoffTime: "22:00",
    minLeadDays: 0,
    slotIntervalMinutes: 60,
    weeklyHours,
    blockedDates: [],
  };
}

function normalizeDayHours(h: Partial<DayHours> | undefined, fallback: DayHours): DayHours {
  return {
    closed: h?.closed ?? fallback.closed,
    open: typeof h?.open === "string" && /^\d{2}:\d{2}$/.test(h.open) ? h.open : fallback.open,
    close: typeof h?.close === "string" && /^\d{2}:\d{2}$/.test(h.close) ? h.close : fallback.close,
  };
}

export function normalizePickupScheduleConfig(raw: unknown): PickupScheduleConfig {
  const defaults = getDefaultPickupScheduleConfig();
  if (!raw || typeof raw !== "object") return defaults;

  const obj = raw as Partial<PickupScheduleConfig>;
  const weeklyHours = { ...defaults.weeklyHours };
  if (obj.weeklyHours && typeof obj.weeklyHours === "object") {
    for (const day of DAYS_OF_WEEK) {
      weeklyHours[day] = normalizeDayHours(
        (obj.weeklyHours as Record<string, Partial<DayHours>>)[day],
        defaults.weeklyHours[day]
      );
    }
  }

  const cutoffTime =
    typeof obj.cutoffTime === "string" && /^\d{2}:\d{2}$/.test(obj.cutoffTime)
      ? obj.cutoffTime
      : defaults.cutoffTime;

  const minLeadDays =
    typeof obj.minLeadDays === "number" && obj.minLeadDays >= 0 && obj.minLeadDays <= 7
      ? Math.floor(obj.minLeadDays)
      : defaults.minLeadDays;

  const slotIntervalMinutes =
    typeof obj.slotIntervalMinutes === "number" &&
    [30, 60, 120].includes(obj.slotIntervalMinutes)
      ? obj.slotIntervalMinutes
      : defaults.slotIntervalMinutes;

  const blockedDates = Array.isArray(obj.blockedDates)
    ? obj.blockedDates.filter(
        (d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)
      )
    : [];

  return {
    timezone: MYT,
    cutoffTime,
    minLeadDays,
    slotIntervalMinutes,
    weeklyHours,
    blockedDates: [...new Set(blockedDates)].sort(),
  };
}
