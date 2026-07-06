'use client'

import { useCallback, useEffect, useState } from 'react'
import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi'

type PromoCode = {
  id: string
  code: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
  minSubtotal: number | null
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  isActive: boolean
}

const emptyForm = {
  code: '',
  discountType: 'PERCENT' as 'PERCENT' | 'FIXED',
  discountValue: '',
  minSubtotal: '',
  maxUses: '',
  expiresAt: '',
  isActive: true,
}

function formatExpiry(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-MY')
}

export default function PromoCodesSection() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadPromoCodes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/promo-codes')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load promo codes')
      setPromoCodes(data.promoCodes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load promo codes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPromoCodes()
  }, [loadPromoCodes])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (promo: PromoCode) => {
    setEditingId(promo.id)
    setForm({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: String(promo.discountValue),
      minSubtotal: promo.minSubtotal != null ? String(promo.minSubtotal) : '',
      maxUses: promo.maxUses != null ? String(promo.maxUses) : '',
      expiresAt: promo.expiresAt ? promo.expiresAt.slice(0, 10) : '',
      isActive: promo.isActive,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const payload = {
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minSubtotal: form.minSubtotal ? Number(form.minSubtotal) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
      }

      const res = await fetch(
        editingId ? `/api/admin/promo-codes/${editingId}` : '/api/admin/promo-codes',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save promo code')

      setMessage(editingId ? 'Promo code updated.' : 'Promo code created.')
      resetForm()
      await loadPromoCodes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save promo code')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/promo-codes/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete promo code')
      setMessage('Promo code deleted.')
      setDeleteId(null)
      await loadPromoCodes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete promo code')
    }
  }

  return (
    <section className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Promo codes</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create codes like TLMAAM5OFF for % or fixed discounts on order subtotal (shipping excluded).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <FiPlus className="mr-1.5" />
          Add code
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-red-800 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4 text-green-800 text-sm">
          {message}
        </div>
      )}

      {showForm && (
        <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
          <h3 className="text-sm font-semibold mb-4">
            {editingId ? 'Edit promo code' : 'New promo code'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="TLMAAM5OFF"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount type</label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discountType: e.target.value as 'PERCENT' | 'FIXED',
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="PERCENT">Percent off (%)</option>
                <option value="FIXED">Fixed amount off (RM)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.discountType === 'PERCENT' ? 'Percent off' : 'Amount off (RM)'}
              </label>
              <input
                type="number"
                min="0"
                step={form.discountType === 'PERCENT' ? '1' : '0.01'}
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min order (RM, optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minSubtotal}
                onChange={(e) => setForm((f) => ({ ...f, minSubtotal: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max uses (optional)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires (optional)
              </label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 mt-4 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Active
          </label>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Update code' : 'Create code'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : promoCodes.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">No promo codes yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Discount</th>
                <th className="py-2 pr-4">Min order</th>
                <th className="py-2 pr-4">Uses</th>
                <th className="py-2 pr-4">Expires</th>
                <th className="py-2 pr-4">Active</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((promo) => (
                <tr key={promo.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium font-mono">{promo.code}</td>
                  <td className="py-3 pr-4">
                    {promo.discountType === 'PERCENT'
                      ? `${promo.discountValue}%`
                      : `RM ${promo.discountValue.toFixed(2)}`}
                  </td>
                  <td className="py-3 pr-4">
                    {promo.minSubtotal != null ? `RM ${promo.minSubtotal.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3 pr-4">
                    {promo.usedCount}
                    {promo.maxUses != null ? ` / ${promo.maxUses}` : ''}
                  </td>
                  <td className="py-3 pr-4">{formatExpiry(promo.expiresAt)}</td>
                  <td className="py-3 pr-4">{promo.isActive ? 'Yes' : 'No'}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(promo)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(promo.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete promo code</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure? Past orders will keep their promo code history.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
