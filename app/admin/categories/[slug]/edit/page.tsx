'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiSave, FiX } from 'react-icons/fi'
import ImagePicker from '@/components/admin/ImagePicker'
import ReorderButtons, { moveItem } from '@/components/admin/ReorderButtons'

interface ParentCategory {
  id: string
  name: string
}

interface CategoryProduct {
  productId: string
  sortOrder: number
  product: {
    id: string
    name: string
    price: unknown
    thumbnail: string | null
  }
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  parentId: string | null
  sortOrder: number
  listMode: 'MANUAL' | 'ROLLUP'
  parent: {
    id: string
    name: string
    slug: string
  } | null
  productCategories: CategoryProduct[]
}

export default function EditCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const [category, setCategory] = useState<Category | null>(null)
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([])
  const [orderedProducts, setOrderedProducts] = useState<CategoryProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reorderingProducts, setReorderingProducts] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    parentId: '',
    listMode: 'ROLLUP' as 'MANUAL' | 'ROLLUP',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { slug } = await params
        const categoriesRes = await fetch('/api/admin/categories')
        if (!categoriesRes.ok) throw new Error('Failed to fetch categories')
        const categoriesData = await categoriesRes.json()
        const foundCategory = (categoriesData.categories || []).find(
          (cat: { slug: string }) => cat.slug === slug
        )
        if (!foundCategory) {
          setError('Category not found')
          setLoading(false)
          return
        }

        const categoryRes = await fetch(`/api/admin/categories/${foundCategory.id}`)
        if (!categoryRes.ok) throw new Error('Failed to fetch category')
        const categoryData = await categoryRes.json()
        setCategory(categoryData.category)

        const mainCategories = (categoriesData.categories || []).filter(
          (cat: { parentId: string | null; id: string }) =>
            !cat.parentId && cat.id !== foundCategory.id
        )
        setParentCategories(mainCategories)

        if (categoryData.category) {
          const pcs = (categoryData.category.productCategories || []) as CategoryProduct[]
          setOrderedProducts(
            [...pcs].sort((a, b) => a.sortOrder - b.sortOrder)
          )
          setFormData({
            name: categoryData.category.name || '',
            slug: categoryData.category.slug || '',
            description: categoryData.category.description || '',
            image: categoryData.category.image || '',
            parentId: categoryData.category.parentId || '',
            listMode: categoryData.category.listMode === 'MANUAL' ? 'MANUAL' : 'ROLLUP',
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({
        ...prev,
        slug
      }))
    }
  }

  const handleImageChange = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image: imageUrl }))
  }

  const saveProductOrder = async (items: CategoryProduct[]) => {
    if (!category) return
    setReorderingProducts(true)
    try {
      const response = await fetch(`/api/admin/categories/${category.id}/products/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item, index) => ({
            productId: item.productId,
            sortOrder: index * 10,
          })),
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to save product order')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save product order')
    } finally {
      setReorderingProducts(false)
    }
  }

  const handleMoveProduct = async (index: number, direction: 'up' | 'down') => {
    const next = moveItem(orderedProducts, index, direction)
    if (next === orderedProducts) return
    setOrderedProducts(next)
    await saveProductOrder(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (!formData.name || !formData.slug) {
      setError('Name and slug are required')
      setSaving(false)
      return
    }

    if (!category) {
      setError('Category not found')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          image: formData.image || null,
          parentId: formData.parentId || null,
          listMode: !category.parentId ? formData.listMode : undefined,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update category')
      }

      router.push('/admin/categories')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!category) {
    return (
      <div>
        <div className="mb-8">
          <Link
            href="/admin/categories"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <FiArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Link>
          <h1 className="text-3xl font-bold text-brand">Category Not Found</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Category not found</div>
        </div>
      </div>
    )
  }

  const isParentCategory = !category.parentId

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin/categories"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Link>
            <h1 className="text-3xl font-bold text-brand">Edit Category</h1>
            <p className="mt-2 text-gray-600">Update category information and product order</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Category Information</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Kitchenware"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  id="slug"
                  required
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., kitchenware"
                />
              </div>

              <div>
                <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">
                  Parent Category
                </label>
                <select
                  name="parentId"
                  id="parentId"
                  value={formData.parentId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">None (Main Category)</option>
                  {parentCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {isParentCategory && (
                <div>
                  <label htmlFor="listMode" className="block text-sm font-medium text-gray-700">
                    Product list mode
                  </label>
                  <select
                    name="listMode"
                    id="listMode"
                    value={formData.listMode}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ROLLUP">Roll up from subcategories</option>
                    <option value="MANUAL">Manual order (products on this category only)</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Roll up shows products from all subcategories in subcategory order. Manual uses only products assigned directly to this category.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Category description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image
                </label>
                <ImagePicker
                  value={formData.image}
                  onChange={handleImageChange}
                  label="Category Image"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
              Product order in this category
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Products appear on the shop in this order when browsing this category.
            </p>

            {orderedProducts.length === 0 ? (
              <p className="text-sm text-gray-500">No products in this category yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                {orderedProducts.map((row, index) => (
                  <li key={row.productId} className="flex items-center gap-3 px-4 py-3">
                    <ReorderButtons
                      onMoveUp={() => handleMoveProduct(index, 'up')}
                      onMoveDown={() => handleMoveProduct(index, 'down')}
                      disableUp={index === 0}
                      disableDown={index === orderedProducts.length - 1}
                      saving={reorderingProducts}
                    />
                    <span className="text-sm text-gray-400 w-6">{index + 1}.</span>
                    {row.product.thumbnail ? (
                      <img
                        src={row.product.thumbnail}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-gray-100" />
                    )}
                    <span className="flex-1 text-sm font-medium text-gray-900">
                      {row.product.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/admin/categories"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiX className="h-4 w-4 mr-2" />
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <FiSave className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
