'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiSave, FiSend } from 'react-icons/fi'

type PickupReminderRule =
  | 'MANUAL'
  | 'TWENTY_FOUR_HOURS_BEFORE'
  | 'NIGHT_BEFORE_MIDNIGHT'

type StoredAddress = {
  type?: 'pickup' | 'shipping'
  fullName?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  subtotal: number
  total: number
  tax: number
  shipping: number
  shippingAddress: StoredAddress
  trackingNumber: string | null
  trackingUrl: string | null
  trackingEmailSentAt: string | null
  pickupScheduledAt: string | null
  pickupReminderRule: PickupReminderRule
  pickupReminderSentAt: string | null
  createdAt: string
  user: {
    name: string | null
    email: string
  } | null
  items: {
    id: string
    quantity: number
    price: number
    product: {
      name: string
      thumbnail: string | null
    }
  }[]
}

type NotificationLogEntry = {
  id: string
  type: string
  status: string
  trigger: string
  recipientEmail: string | null
  error: string | null
  createdAt: string
}

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  ORDER_CONFIRMATION: 'Order confirmation',
  PAYMENT_FAILED: 'Payment failed',
  SHIPPING_TRACKING: 'Shipping / tracking',
  PICKUP_REMINDER: 'Pickup reminder',
}

const STATUS_OPTIONS = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const

const REMINDER_RULE_OPTIONS: { value: PickupReminderRule; label: string }[] = [
  { value: 'MANUAL', label: 'Manual only' },
  { value: 'TWENTY_FOUR_HOURS_BEFORE', label: '24 hours before pickup' },
  { value: 'NIGHT_BEFORE_MIDNIGHT', label: 'Night before at midnight (MYT)' },
]

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/** Parse datetime-local as Malaysia time → UTC Date */
function fromDatetimeLocalMyt(value: string): string | null {
  if (!value.trim()) return null
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return null
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  // MYT is UTC+8 with no DST
  const utcMs = Date.UTC(y, m - 1, d, hh - 8, mm)
  return new Date(utcMs).toISOString()
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingTracking, setSendingTracking] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [status, setStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [pickupDatetimeLocal, setPickupDatetimeLocal] = useState('')
  const [pickupReminderRule, setPickupReminderRule] =
    useState<PickupReminderRule>('MANUAL')
  const [notificationLog, setNotificationLog] = useState<NotificationLogEntry[]>([])

  const isPickup = order?.shippingAddress?.type === 'pickup'

  const fetchNotificationLog = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/notifications`)
      if (!res.ok) return
      const data = await res.json()
      setNotificationLog(data.notifications ?? [])
    } catch {
      // non-blocking
    }
  }

  useEffect(() => {
    fetchOrder()
    fetchNotificationLog()
  }, [id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/admin/orders/${id}`)
      if (!res.ok) throw new Error('Failed to fetch order')
      const data = await res.json()
      const o = data.order as Order
      setOrder(o)
      setStatus(o.status)
      setTrackingNumber(o.trackingNumber ?? '')
      setTrackingUrl(o.trackingUrl ?? '')
      setPickupDatetimeLocal(toDatetimeLocalValue(o.pickupScheduledAt))
      setPickupReminderRule(o.pickupReminderRule ?? 'MANUAL')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const saveOrder = async () => {
    if (!order) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const body: Record<string, unknown> = { status }
      if (!isPickup) {
        body.trackingNumber = trackingNumber.trim() || null
        body.trackingUrl = trackingUrl.trim() || null
      } else {
        body.pickupScheduledAt = fromDatetimeLocalMyt(pickupDatetimeLocal)
        body.pickupReminderRule = pickupReminderRule
      }

      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save order')

      setOrder(data.order)
      setMessage('Order saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const sendTrackingEmail = async () => {
    setSendingTracking(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${id}/send-tracking-email`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send email')
      setMessage(data.emailSent ? 'Tracking email sent.' : 'No email sent (check customer email).')
      await fetchOrder()
      await fetchNotificationLog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setSendingTracking(false)
    }
  }

  const sendPickupReminder = async () => {
    setSendingReminder(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${id}/send-pickup-reminder`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send reminder')
      setMessage(data.emailSent ? 'Pickup reminder sent.' : 'No email sent (check customer email).')
      await fetchOrder()
      await fetchNotificationLog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reminder')
    } finally {
      setSendingReminder(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{error || 'Order not found'}</p>
        <Link href="/admin/orders" className="text-blue-600 mt-4 inline-block">
          Back to orders
        </Link>
      </div>
    )
  }

  const addr = order.shippingAddress

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft className="mr-2" />
          Back to orders
        </Link>
        <h1 className="text-3xl font-bold text-brand">Order #{order.orderNumber}</h1>
        <p className="mt-2 text-gray-600">
          {isPickup ? 'Pickup' : 'Shipping'} · Payment: {order.paymentStatus}
          {' · '}
          <Link href="/admin/notifications" className="text-blue-600 hover:underline">
            All notifications
          </Link>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-800">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-green-800">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Customer &amp; items</h2>
          <p className="text-sm text-gray-600 mb-1">
            <strong>{order.user?.name || 'Guest'}</strong>
          </p>
          <p className="text-sm text-gray-600 mb-4">{order.user?.email || '—'}</p>
          <ul className="divide-y divide-gray-100 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="py-2 flex justify-between gap-2">
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <span>RM {(item.quantity * Number(item.price)).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-medium">Total: RM {Number(order.total).toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">
            Placed: {formatDateTime(order.createdAt)}
          </p>
        </section>

        <section className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Fulfillment address</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {addr.fullName}
            {'\n'}
            {addr.address}
            {'\n'}
            {[addr.city, addr.state, addr.zip].filter(Boolean).join(', ')}
            {'\n'}
            {addr.country}
            {addr.phone ? `\n${addr.phone}` : ''}
          </p>
        </section>

        <section className="bg-white shadow rounded-lg p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Order status</h2>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md mb-4"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {!isPickup ? (
            <>
              <h3 className="text-md font-semibold mb-3 mt-6">Shipping tracking</h3>
              <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g. EP123456789MY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking URL
                  </label>
                  <input
                    type="url"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Last tracking email: {formatDateTime(order.trackingEmailSentAt)}
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  type="button"
                  onClick={saveOrder}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-brand text-white rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  <FiSave className="mr-2" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={sendTrackingEmail}
                  disabled={
                    sendingTracking ||
                    (!trackingNumber.trim() && !trackingUrl.trim())
                  }
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  <FiSend className="mr-2" />
                  {sendingTracking ? 'Sending…' : 'Send tracking email'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-md font-semibold mb-3 mt-6">Pickup schedule</h3>
              <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup date &amp; time (Malaysia)
                  </label>
                  <input
                    type="datetime-local"
                    value={pickupDatetimeLocal}
                    onChange={(e) => setPickupDatetimeLocal(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reminder rule
                  </label>
                  <select
                    value={pickupReminderRule}
                    onChange={(e) =>
                      setPickupReminderRule(e.target.value as PickupReminderRule)
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {REMINDER_RULE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Scheduled: {formatDateTime(order.pickupScheduledAt)}
              </p>
              <p className="text-sm text-gray-500">
                Last reminder sent: {formatDateTime(order.pickupReminderSentAt)}
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  type="button"
                  onClick={saveOrder}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-brand text-white rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  <FiSave className="mr-2" />
                  {saving ? 'Saving…' : 'Save schedule'}
                </button>
                <button
                  type="button"
                  onClick={sendPickupReminder}
                  disabled={sendingReminder || !pickupDatetimeLocal}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  <FiSend className="mr-2" />
                  {sendingReminder ? 'Sending…' : 'Send reminder now'}
                </button>
              </div>
            </>
          )}

          {!isPickup ? null : (
            <p className="text-xs text-gray-400 mt-2">
              Automatic reminders run hourly via cron when rule is not Manual.
            </p>
          )}
        </section>

        <section className="bg-white shadow rounded-lg p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Notification history</h2>
          {notificationLog.length === 0 ? (
            <p className="text-sm text-gray-500">No notification log entries yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {notificationLog.map((entry) => (
                <li key={entry.id} className="py-3 first:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {NOTIFICATION_TYPE_LABELS[entry.type] ?? entry.type}
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                        entry.status === 'SENT'
                          ? 'bg-green-100 text-green-800'
                          : entry.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {entry.status}
                    </span>
                    <span className="text-xs text-gray-500">({entry.trigger})</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDateTime(entry.createdAt)}
                    {entry.recipientEmail ? ` · ${entry.recipientEmail}` : ''}
                  </p>
                  {entry.error && (
                    <p className="text-xs text-red-600 mt-1">{entry.error}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
