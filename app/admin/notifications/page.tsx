'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import Link from 'next/link'
import { FiRefreshCw, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi'

type NotificationType =
  | 'ORDER_CONFIRMATION'
  | 'PAYMENT_FAILED'
  | 'SHIPPING_TRACKING'
  | 'PICKUP_REMINDER'

type SummaryEntry = {
  status: 'SENT' | 'SKIPPED' | 'FAILED' | null
  lastAt: string | null
  trigger: 'AUTO' | 'MANUAL' | null
}

type OrderRow = {
  id: string
  orderNumber: string
  customerEmail: string | null
  customerName: string | null
  paymentStatus: string
  fulfillmentType: 'pickup' | 'shipping'
  trackingNumber: string | null
  trackingUrl: string | null
  pickupScheduledAt: string | null
  createdAt: string
  summary: Record<NotificationType, SummaryEntry>
  latestNotifications: Array<{
    id: string
    type: NotificationType
    status: string
    trigger: string
    recipientEmail: string | null
    error: string | null
    createdAt: string
  }>
}

type Filter =
  | 'all'
  | 'missing_confirmation'
  | 'missing_tracking'
  | 'missing_pickup_reminder'
  | 'has_failures'

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All orders' },
  { value: 'missing_confirmation', label: 'Missing confirmation' },
  { value: 'missing_tracking', label: 'Ready to ship (no tracking email)' },
  { value: 'missing_pickup_reminder', label: 'Pickup reminders pending' },
  { value: 'has_failures', label: 'Failed sends' },
]

const TYPE_LABELS: Record<NotificationType, string> = {
  ORDER_CONFIRMATION: 'Confirmation',
  PAYMENT_FAILED: 'Payment failed',
  SHIPPING_TRACKING: 'Tracking',
  PICKUP_REMINDER: 'Pickup',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function StatusBadge({ entry }: { entry: SummaryEntry }) {
  if (!entry.status) {
    return (
      <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
        Not sent
      </span>
    )
  }
  const colors: Record<string, string> = {
    SENT: 'bg-green-100 text-green-800',
    SKIPPED: 'bg-yellow-100 text-yellow-800',
    FAILED: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${colors[entry.status] ?? 'bg-gray-100'}`}>
      {entry.status}
    </span>
  )
}

export default function AdminNotificationsPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ filter })
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/admin/notifications?${params}`)
      if (!res.ok) throw new Error('Failed to load notifications')
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const resend = async (orderId: string, type: NotificationType) => {
    const key = `${orderId}-${type}`
    setSending(key)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setMessage(
        data.emailSent
          ? `${TYPE_LABELS[type]} email sent for order.`
          : `${TYPE_LABELS[type]}: no email sent (check customer email or order state).`
      )
      await fetchOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(null)
    }
  }

  const canResend = (order: OrderRow, type: NotificationType): boolean => {
    if (type === 'ORDER_CONFIRMATION') return order.paymentStatus === 'COMPLETED'
    if (type === 'PAYMENT_FAILED') return order.paymentStatus === 'FAILED'
    if (type === 'SHIPPING_TRACKING') {
      return (
        order.fulfillmentType === 'shipping' &&
        order.paymentStatus === 'COMPLETED' &&
        Boolean(order.trackingNumber?.trim() || order.trackingUrl?.trim())
      )
    }
    if (type === 'PICKUP_REMINDER') {
      return (
        order.fulfillmentType === 'pickup' &&
        order.paymentStatus === 'COMPLETED' &&
        Boolean(order.pickupScheduledAt)
      )
    }
    return false
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand">Notifications</h1>
          <p className="mt-2 text-gray-600">
            Order email status and manual resend
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchOrders()}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
        >
          <FiRefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {message && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4 text-green-800 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search order or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-brand text-white rounded-md text-sm">
            Search
          </button>
        </form>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="sm:w-64 px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {orders.length === 0 ? (
          <p className="text-center py-12 text-gray-500 text-sm">No orders match this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Confirm</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Failed</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Tracking</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Pickup</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <Fragment key={order.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium">#{order.orderNumber}</div>
                        <div className="text-xs text-gray-500 capitalize">
                          {order.fulfillmentType} · {order.paymentStatus}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{order.customerName || '—'}</div>
                        <div className="text-xs text-gray-500">{order.customerEmail || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge entry={order.summary.ORDER_CONFIRMATION} />
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatDate(order.summary.ORDER_CONFIRMATION.lastAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge entry={order.summary.PAYMENT_FAILED} />
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatDate(order.summary.PAYMENT_FAILED.lastAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge entry={order.summary.SHIPPING_TRACKING} />
                        {order.trackingNumber && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[120px]">
                            {order.trackingNumber}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          {formatDate(order.summary.SHIPPING_TRACKING.lastAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge entry={order.summary.PICKUP_REMINDER} />
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatDate(order.summary.PICKUP_REMINDER.lastAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Open order
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(expandedId === order.id ? null : order.id)
                            }
                            className="text-gray-600 hover:text-gray-900 text-xs inline-flex items-center"
                          >
                            Resend
                            {expandedId === order.id ? (
                              <FiChevronUp className="ml-1" />
                            ) : (
                              <FiChevronDown className="ml-1" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex flex-wrap gap-2 mb-3">
                            {(Object.keys(TYPE_LABELS) as NotificationType[]).map((type) => (
                              <button
                                key={type}
                                type="button"
                                disabled={
                                  !canResend(order, type) ||
                                  sending === `${order.id}-${type}`
                                }
                                onClick={() => resend(order.id, type)}
                                className="px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                                title={
                                  !canResend(order, type)
                                    ? 'Not applicable for this order'
                                    : `Resend ${TYPE_LABELS[type]}`
                                }
                              >
                                {sending === `${order.id}-${type}`
                                  ? 'Sending…'
                                  : `Resend ${TYPE_LABELS[type]}`}
                              </button>
                            ))}
                          </div>
                          {order.latestNotifications.length > 0 && (
                            <ul className="text-xs text-gray-600 space-y-1">
                              {order.latestNotifications.map((n) => (
                                <li key={n.id}>
                                  {formatDate(n.createdAt)} — {TYPE_LABELS[n.type]} — {n.status}{' '}
                                  ({n.trigger})
                                  {n.error ? ` — ${n.error}` : ''}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
