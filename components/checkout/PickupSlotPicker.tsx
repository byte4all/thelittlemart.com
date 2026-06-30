"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PickupAddressLink from "@/components/cart/PickupAddressLink";
import { cn } from "@/lib/utils";
import { formatPickupSlotLabel } from "@/lib/myt-time";

type PickupSlot = {
  date: string;
  time: string;
  iso: string;
};

type PickupSlotPickerProps = {
  value: string | null;
  onChange: (iso: string | null) => void;
  onReadyChange?: (ready: boolean) => void;
};

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function formatTimeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export default function PickupSlotPicker({
  value,
  onChange,
  onReadyChange,
}: PickupSlotPickerProps) {
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthDates, setMonthDates] = useState<Set<string>>(new Set());
  const [dateSlots, setDateSlots] = useState<PickupSlot[]>([]);
  const [closeTime, setCloseTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchMonth = useCallback(async (year: number, month: number) => {
    const res = await fetch(
      `/api/shop/pickup-slots?month=${monthKey(year, month)}`
    );
    if (!res.ok) throw new Error("Failed to load calendar");
    const data = (await res.json()) as { monthDates?: string[] };
    setMonthDates(new Set(data.monthDates ?? []));
  }, []);

  const fetchSlotsForDate = useCallback(async (date: string) => {
    const res = await fetch(`/api/shop/pickup-slots?date=${date}`);
    if (!res.ok) throw new Error("Failed to load time slots");
    const data = (await res.json()) as {
      dateSlots?: PickupSlot[];
      closeTime?: string;
    };
    setDateSlots(data.dateSlots ?? []);
    setCloseTime(data.closeTime ?? null);
    return data.dateSlots ?? [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/shop/pickup-slots");
        if (!res.ok) throw new Error("Failed to load pickup slots");
        const data = (await res.json()) as {
          defaultSlot: PickupSlot | null;
          slots: PickupSlot[];
        };

        if (cancelled) return;

        if (!data.defaultSlot && data.slots.length === 0) {
          setError("No pickup slots are available in the next 30 days.");
          onReadyChange?.(false);
          setLoading(false);
          return;
        }

        const defaultSlot = data.defaultSlot ?? data.slots[0] ?? null;
        if (defaultSlot && !initialized) {
          onChange(defaultSlot.iso);
          setSelectedDate(defaultSlot.date);
          const [y, m] = defaultSlot.date.split("-").map(Number);
          setViewYear(y);
          setViewMonth(m);
          setInitialized(true);
        }

        await fetchMonth(viewYear, viewMonth);
        if (defaultSlot) {
          await fetchSlotsForDate(defaultSlot.date);
        }
        onReadyChange?.(Boolean(defaultSlot));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load pickup times");
          onReadyChange?.(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  useEffect(() => {
    if (!initialized) return;
    fetchMonth(viewYear, viewMonth).catch(() => {});
  }, [viewYear, viewMonth, fetchMonth, initialized]);

  useEffect(() => {
    if (!selectedDate) return;
    fetchSlotsForDate(selectedDate).catch(() => {
      setDateSlots([]);
      setCloseTime(null);
    });
  }, [selectedDate, fetchSlotsForDate]);

  useEffect(() => {
    if (dateSlots.length === 0) return;
    const stillValid = value && dateSlots.some((s) => s.iso === value);
    if (!stillValid) {
      onChange(dateSlots[0].iso);
    }
  }, [dateSlots, value, onChange]);

  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-brand/10 p-4 bg-brand/5">
        <p className="text-sm text-foreground/60">Loading pickup times…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 p-4 bg-red-50">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand/10 p-4 bg-brand/5 space-y-4">
      <div className="pb-3 border-b border-brand/10">
        <p className="text-sm font-medium text-brand mb-2">Pickup location</p>
        <PickupAddressLink showPhone={false} />
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-1">Choose pickup date &amp; time</p>
        <p className="text-xs text-foreground/50 mb-3">Malaysia time (MYT)</p>

        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={prevMonth}
            className="px-2 py-1 text-sm rounded hover:bg-brand/10"
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="text-sm font-medium">
            {new Date(viewYear, viewMonth - 1).toLocaleString("en-MY", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="px-2 py-1 text-sm rounded hover:bg-brand/10"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-foreground/50 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />;
            }
            const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const available = monthDates.has(dateStr);
            const isSelected = selectedDate === dateStr;
            return (
              <button
                key={dateStr}
                type="button"
                disabled={!available}
                onClick={() => setSelectedDate(dateStr)}
                className={cn(
                  "h-9 rounded-md text-sm",
                  available
                    ? isSelected
                      ? "bg-brand text-white font-medium"
                      : "hover:bg-brand/15 text-foreground"
                    : "text-foreground/25 cursor-not-allowed"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div>
          <p className="text-xs font-medium text-foreground/70 mb-2">Available times</p>
          {dateSlots.length === 0 ? (
            <p className="text-xs text-foreground/50">No times on this date.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dateSlots.map((slot) => (
                <button
                  key={slot.iso}
                  type="button"
                  onClick={() => onChange(slot.iso)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm border",
                    value === slot.iso
                      ? "border-brand bg-brand text-white"
                      : "border-brand/20 hover:border-brand/50"
                  )}
                >
                  {formatTimeLabel(slot.time)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {value && (
        <p className="text-sm text-foreground/70 pt-2 border-t border-brand/10">
          <span className="text-foreground/50">Selected: </span>
          <strong>{formatPickupSlotLabel(value)}</strong>
          {closeTime && (
            <>
              <span className="text-foreground/40 mx-2">·</span>
              <span>
                Closing time: <strong>{formatTimeLabel(closeTime)}</strong>
              </span>
            </>
          )}
        </p>
      )}
    </div>
  );
}
