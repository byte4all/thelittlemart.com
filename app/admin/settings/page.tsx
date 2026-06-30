'use client'

import { useCallback, useEffect, useState } from 'react'
import { FiSave } from 'react-icons/fi'
import {
  DAYS_OF_WEEK,
  getDefaultPickupScheduleConfig,
  type DayOfWeek,
  type PickupScheduleConfig,
} from '@/lib/pickup-schedule-config'

const CURRENCY_OPTIONS = [
  { value: 'RM', label: 'RM (Malaysian Ringgit)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'SGD', label: 'SGD' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
]

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

const SLOT_INTERVAL_OPTIONS = [30, 60, 120] as const

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export default function AdminSettingsPage() {
  const [currencySymbol, setCurrencySymbol] = useState('RM')
  const [pickupSchedule, setPickupSchedule] = useState<PickupScheduleConfig>(
    getDefaultPickupScheduleConfig()
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      const data = await res.json()
      if (data.settings?.currencySymbol) setCurrencySymbol(data.settings.currencySymbol)
      if (data.settings?.pickupSchedule) setPickupSchedule(data.settings.pickupSchedule)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const saveSettings = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currencySymbol, pickupSchedule }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save settings')
      if (data.settings?.currencySymbol) setCurrencySymbol(data.settings.currencySymbol)
      if (data.settings?.pickupSchedule) setPickupSchedule(data.settings.pickupSchedule)
      setMessage('Settings saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateDayHours = (day: DayOfWeek, patch: Partial<PickupScheduleConfig['weeklyHours'][DayOfWeek]>) => {
    setPickupSchedule((prev) => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: { ...prev.weeklyHours[day], ...patch },
      },
    }))
  }

  const toggleBlockedDate = (dateStr: string) => {
    setPickupSchedule((prev) => {
      const blocked = new Set(prev.blockedDates)
      if (blocked.has(dateStr)) blocked.delete(dateStr)
      else blocked.add(dateStr)
      return { ...prev, blockedDates: [...blocked].sort() }
    })
  }

  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay()
  const totalDays = daysInMonth(viewYear, viewMonth)
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand">Settings</h1>
          <p className="mt-2 text-gray-600">Site currency and pickup scheduling rules</p>
        </div>
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-brand text-white rounded-md hover:opacity-90 disabled:opacity-50"
        >
          <FiSave className="mr-2" />
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-800">{error}</div>
      )}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-green-800">
          {message}
        </div>
      )}

      <section className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">General</h2>
        <label className="block text-sm font-medium text-gray-700 mb-1">Site currency</label>
        <p className="text-sm text-gray-500 mb-3">Used on product prices, cart, and orders.</p>
        <select
          value={currencySymbol}
          onChange={(e) => setCurrencySymbol(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm max-w-xs"
        >
          {CURRENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </section>

      <section className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Pickup scheduling</h2>
        <p className="text-sm text-gray-500 mb-6">
          Controls when customers can book pickup at checkout. All times are Malaysia time (MYT).
        </p>

        <div className="grid gap-6 sm:grid-cols-3 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cutoff time</label>
            <p className="text-xs text-gray-500 mb-2">
              Orders at or after this time cannot use the same calendar day (e.g. Mon 11pm → Tue).
            </p>
            <input
              type="time"
              value={pickupSchedule.cutoffTime}
              onChange={(e) =>
                setPickupSchedule((p) => ({ ...p, cutoffTime: e.target.value }))
              }
              className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum lead days</label>
            <p className="text-xs text-gray-500 mb-2">
              Extra days after the eligible start date (0 = same day if hours allow, 1 = +1 day).
            </p>
            <select
              value={pickupSchedule.minLeadDays}
              onChange={(e) =>
                setPickupSchedule((p) => ({
                  ...p,
                  minLeadDays: Number(e.target.value),
                }))
              }
              className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
            >
              {Array.from({ length: 8 }, (_, i) => (
                <option key={i} value={i}>
                  {i} {i === 1 ? 'day' : 'days'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slot interval</label>
            <p className="text-xs text-gray-500 mb-2">Minutes between pickup time options.</p>
            <select
              value={pickupSchedule.slotIntervalMinutes}
              onChange={(e) =>
                setPickupSchedule((p) => ({
                  ...p,
                  slotIntervalMinutes: Number(e.target.value) as 30 | 60 | 120,
                }))
              }
              className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
            >
              {SLOT_INTERVAL_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
          </div>
        </div>

        <h3 className="text-md font-semibold mb-3">Weekly hours</h3>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="py-2 pr-4">Day</th>
                <th className="py-2 pr-4">Closed</th>
                <th className="py-2 pr-4">Open</th>
                <th className="py-2">Close</th>
              </tr>
            </thead>
            <tbody>
              {DAYS_OF_WEEK.map((day) => (
                <tr key={day} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">{DAY_LABELS[day]}</td>
                  <td className="py-3 pr-4">
                    <input
                      type="checkbox"
                      checked={pickupSchedule.weeklyHours[day].closed}
                      onChange={(e) => updateDayHours(day, { closed: e.target.checked })}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      type="time"
                      disabled={pickupSchedule.weeklyHours[day].closed}
                      value={pickupSchedule.weeklyHours[day].open}
                      onChange={(e) => updateDayHours(day, { open: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                    />
                  </td>
                  <td className="py-3">
                    <input
                      type="time"
                      disabled={pickupSchedule.weeklyHours[day].closed}
                      value={pickupSchedule.weeklyHours[day].close}
                      onChange={(e) => updateDayHours(day, { close: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-md font-semibold mb-2">Blocked dates</h3>
        <p className="text-sm text-gray-500 mb-4">
          Click a date to block or unblock pickup. Blocked dates are hidden from checkout.
        </p>

        <div className="max-w-md">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 1) {
                  setViewYear((y) => y - 1)
                  setViewMonth(12)
                } else setViewMonth((m) => m - 1)
              }}
              className="px-2 py-1 text-sm rounded hover:bg-gray-100"
            >
              ‹
            </button>
            <span className="text-sm font-medium">
              {new Date(viewYear, viewMonth - 1).toLocaleString('en-MY', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 12) {
                  setViewYear((y) => y + 1)
                  setViewMonth(1)
                } else setViewMonth((m) => m + 1)
              }}
              className="px-2 py-1 text-sm rounded hover:bg-gray-100"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`e-${idx}`} />
              const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const blocked = pickupSchedule.blockedDates.includes(dateStr)
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => toggleBlockedDate(dateStr)}
                  className={`h-9 rounded-md text-sm ${
                    blocked
                      ? 'bg-red-100 text-red-800 line-through'
                      : 'hover:bg-gray-100 text-gray-900'
                  }`}
                  title={blocked ? 'Unblock' : 'Block'}
                >
                  {day}
                </button>
              )
            })}
          </div>
          {pickupSchedule.blockedDates.length > 0 && (
            <p className="text-xs text-gray-500 mt-3">
              {pickupSchedule.blockedDates.length} blocked date(s)
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
