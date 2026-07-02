import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '../../_utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdminApi(request)
  if (forbidden) return forbidden

  try {
    const { id } = await params
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        productCategories: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                thumbnail: true,
              },
            },
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Expose products array for backward compatibility (list of products in this category)
    const categoryResponse = {
      ...category,
      products: category.productCategories.map((pc) => ({
        ...pc.product,
        sortOrder: pc.sortOrder,
      })),
      productCategories: category.productCategories.map((pc) => ({
        productId: pc.productId,
        sortOrder: pc.sortOrder,
        product: pc.product,
      })),
    }

    return NextResponse.json({
      success: true,
      category: categoryResponse
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdminApi(request)
  if (forbidden) return forbidden

  try {
    const { id } = await params
    const body = await request.json()
    const { name, slug, description, image, parentId, sortOrder, listMode } = body

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Prevent category from being its own parent
    if (parentId === id) {
      return NextResponse.json(
        { success: false, error: 'Category cannot be its own parent' },
        { status: 400 }
      )
    }

    // Validate parentId if provided
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId }
      })
      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent category not found' },
          { status: 400 }
        )
      }
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      select: { parentId: true },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    const updateData: {
      name: string
      slug: string
      description?: string | null
      image?: string | null
      parentId: string | null
      sortOrder?: number
      listMode?: 'MANUAL' | 'ROLLUP'
    } = {
      name,
      slug,
      description,
      image,
      parentId: parentId || null,
    }

    if (typeof sortOrder === 'number') {
      updateData.sortOrder = sortOrder
    }

    if (!existing.parentId && (listMode === 'MANUAL' || listMode === 'ROLLUP')) {
      updateData.listMode = listMode
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: true
      }
    })

    return NextResponse.json({
      success: true,
      category
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdminApi(request)
  if (forbidden) return forbidden

  try {
    const { id } = await params

    // Check if category has products (via product_categories)
    const productCount = await prisma.productCategory.count({
      where: { categoryId: id }
    })

    if (productCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with products' },
        { status: 400 }
      )
    }

    // Check if category has subcategories
    const subcategoryCount = await prisma.category.count({
      where: { parentId: id }
    })

    if (subcategoryCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with subcategories' },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
