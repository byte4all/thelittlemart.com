export const MYT = "Asia/Kuala_Lumpur";

export type DateParts = { y: number; m: number; d: number };

export type TimeParts = DateParts & { hour: number; minute: number };

export function getDatePartsInMyt(date: Date): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MYT,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  return { y, m, d };
}

export function getTimePartsInMyt(date: Date): TimeParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MYT,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const minute = Number(parts.find((p) => p.type === "minute")?.value);
  return { y, m, d, hour, minute };
}

export function dateKey({ y, m, d }: DateParts): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function addCalendarDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return dateKey({ y: utc.getUTCFullYear(), m: utc.getUTCMonth() + 1, d: utc.getUTCDate() });
}

/** Parse "HH:mm" to minutes since midnight. */
export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** MYT offset is UTC+8 (no DST). */
export function mytDateTimeToUtc(dateKeyStr: string, time: string): Date {
  const [y, m, d] = dateKeyStr.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour - 8, minute, 0, 0));
}

export function formatPickupSlotLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-MY", {
    timeZone: MYT,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function isAtOrAfterTimeInMyt(date: Date, time: string): boolean {
  const { hour, minute } = getTimePartsInMyt(date);
  const nowMins = hour * 60 + minute;
  return nowMins >= parseTimeToMinutes(time);
}
