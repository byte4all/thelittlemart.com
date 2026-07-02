import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getProductTemplateOverrides, setProductTemplateOverrides, normalizeTemplateOverride } from '@/lib/product-templates'
import { requireAdminApi } from '../../_utils'
import { buildProductCategoryCreates, getProductCategorySortOrderMap } from '@/lib/product-category-sort'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdminApi(request)
  if (forbidden) return forbidden

  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productCategories: { include: { category: true } },
        brand: true,
        reviews: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const overrides = await getProductTemplateOverrides(id)
    const productResponse = {
      ...product,
      categories: product.productCategories.map((pc) => pc.category),
      faqTemplateOverride: overrides.faqTemplate ?? '',
      detailsTemplateOverride: overrides.detailsTemplate ?? ''
    }

    return NextResponse.json({
      success: true,
      product: productResponse
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
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
    const {
      name,
      slug,
      description,
      price: priceRaw,
      quantity: quantityRaw,
      images,
      thumbnail,
      categoryId,
      categoryIds,
      brandId,
      isActive,
      isFeatured,
      isBestSeller,
      sku,
      color,
      size,
      material,
      availableColors = [],
      availableSizes = [],
      faqTemplateOverride,
      detailsTemplateOverride,
      volumeMl: volumeMlRaw,
      weightKg: weightKgRaw,
      dimensions
    } = body

    const resolvedCategoryIds = Array.isArray(categoryIds) && categoryIds.length > 0
      ? categoryIds.filter((id: unknown) => typeof id === 'string' && id.trim() !== '')
      : (categoryId != null && String(categoryId).trim() !== '' ? [String(categoryId).trim()] : [])

    // Coerce price and quantity to numbers (form/JSON may send strings)
    const price = priceRaw != null && priceRaw !== '' ? Number(priceRaw) : NaN
    const quantity = quantityRaw != null && quantityRaw !== '' ? Number(quantityRaw) : 0

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
        { status: 400 }
      )
    }

    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid price (>= 0) is required' },
        { status: 400 }
      )
    }

    // At least one category is required if product is active (not a draft)
    if (isActive && resolvedCategoryIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one category is required for active products. Save as draft if none selected.' },
        { status: 400 }
      )
    }

    const resolvedSlug =
      slug && String(slug).trim()
        ? String(slug).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    // Slug must be unique only among *other* products (allow keeping current product's own slug)
    const existingWithSlug = await prisma.product.findFirst({
      where: {
        slug: resolvedSlug,
        id: { not: id },
      },
    })
    if (existingWithSlug) {
      return NextResponse.json(
        { success: false, error: 'A product with this slug already exists. Please use a different name or slug.' },
        { status: 400 }
      )
    }

    // Optional: volume (mL, integer), weight (kg 0.1–5), dimensions (string)
    const volumeMl = volumeMlRaw != null && volumeMlRaw !== '' ? Math.floor(Number(volumeMlRaw)) : null
    if (volumeMl != null && (Number.isNaN(volumeMl) || volumeMl < 0)) {
      return NextResponse.json(
        { success: false, error: 'Volume (mL) must be a non-negative integer.' },
        { status: 400 }
      )
    }
    const weightKg = weightKgRaw != null && weightKgRaw !== '' ? Number(weightKgRaw) : null
    if (weightKg != null && (Number.isNaN(weightKg) || weightKg < 0.1 || weightKg > 5)) {
      return NextResponse.json(
        { success: false, error: 'Weight (kg) must be between 0.1 and 5.' },
        { status: 400 }
      )
    }
    const resolvedDimensions = dimensions != null && String(dimensions).trim() !== '' ? String(dimensions).trim() : null

    // SKU must be unique only among *other* products (allow empty or keeping current product's SKU)
    const resolvedSku = sku != null && String(sku).trim() !== '' ? String(sku).trim() : null
    if (resolvedSku) {
      const existingWithSku = await prisma.product.findFirst({
        where: {
          sku: resolvedSku,
          id: { not: id },
        },
      })
      if (existingWithSku) {
        return NextResponse.json(
          { success: false, error: 'A product with this SKU already exists. Please use a different SKU.' },
          { status: 400 }
        )
      }
    }

    const preservedSortOrders = await getProductCategorySortOrderMap(prisma, id)

    await prisma.productCategory.deleteMany({
      where: { productId: id }
    })

    const categoryCreates =
      resolvedCategoryIds.length > 0
        ? await buildProductCategoryCreates(prisma, resolvedCategoryIds, preservedSortOrders)
        : []

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug: resolvedSlug,
        description,
        price: Number(price),
        quantity: Number(quantity),
        images,
        thumbnail,
        brand: brandId ? { connect: { id: brandId } } : { disconnect: true },
        isActive,
        isFeatured,
        isBestSeller: isBestSeller === true,
        sku: resolvedSku,
        color,
        size,
        material,
        availableColors: Array.isArray(availableColors) ? availableColors : [],
        availableSizes: Array.isArray(availableSizes) ? availableSizes : [],
        volumeMl: volumeMl ?? null,
        weightKg: weightKg ?? null,
        dimensions: resolvedDimensions ?? null,
        productCategories:
          categoryCreates.length > 0
            ? { create: categoryCreates }
            : undefined
      },
      include: {
        productCategories: { include: { category: true } },
        brand: true
      }
    })

    const resolvedFaq = normalizeTemplateOverride(faqTemplateOverride)
    const resolvedDetails = normalizeTemplateOverride(detailsTemplateOverride)
    await setProductTemplateOverrides(id, {
      faqTemplate: resolvedFaq,
      detailsTemplate: resolvedDetails
    })

    const productResponse = {
      ...product,
      categories: product.productCategories.map((pc) => pc.category),
      faqTemplateOverride: resolvedFaq ?? '',
      detailsTemplateOverride: resolvedDetails ?? ''
    }

    return NextResponse.json({
      success: true,
      product: productResponse
    })
  } catch (error) {
    console.error('Error updating product:', error)
    
    // Check for Prisma unique constraint errors (e.g., duplicate slug or SKU)
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        const meta = (error as { meta?: { target?: string[] } }).meta
        const target = Array.isArray(meta?.target) ? meta.target : []
        const isSku = target.includes('sku')
        const message = isSku
          ? 'A product with this SKU already exists. Please use a different SKU.'
          : 'A product with this slug already exists. Please use a different name or slug.'
        return NextResponse.json(
          { success: false, error: message },
          { status: 400 }
        )
      }
      if (error.code === 'P2025') {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        )
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to update product'
    return NextResponse.json(
      { success: false, error: errorMessage },
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

    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
