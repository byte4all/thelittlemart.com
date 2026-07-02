import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '../_utils'
import { buildProductCategoryCreates } from '@/lib/product-category-sort'

export async function GET(request: Request) {
  const forbidden = await requireAdminApi(request)
  if (forbidden) return forbidden

  try {
    const products = await prisma.product.findMany({
      include: {
        productCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        brand: {
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          select: {
            id: true,
            rating: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Map to a shape with categories array for backward compatibility
    const productsWithCategories = products.map((p) => ({
      ...p,
      categories: p.productCategories.map((pc) => pc.category)
    }))

    return NextResponse.json({
      success: true,
      products: productsWithCategories
    })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    
    // Provide more helpful error messages
    if (error?.code === 'P1001') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed. Please check if your Neon database is active and the connection string is correct.' 
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const forbidden = await requireAdminApi(request)
  if (forbidden) return forbidden

  try {
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
      isActive = true,
      isFeatured = false,
      isBestSeller = false,
      sku,
      color,
      size,
      material,
      availableColors = [],
      availableSizes = [],
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

    // Exact replica check: do not add product if another product already has this exact (normalized) slug
    const existingWithSlug = await prisma.product.findFirst({
      where: { slug: resolvedSlug },
    })
    if (existingWithSlug) {
      return NextResponse.json(
        { success: false, error: 'A product with this slug already exists. Please use a different name or slug.' },
        { status: 400 }
      )
    }

    // SKU must be unique; use null when empty to avoid unique constraint on empty string
    const resolvedSku = sku != null && String(sku).trim() !== '' ? String(sku).trim() : null
    if (resolvedSku) {
      const existingWithSku = await prisma.product.findFirst({
        where: { sku: resolvedSku },
      })
      if (existingWithSku) {
        return NextResponse.json(
          { success: false, error: 'A product with this SKU already exists. Please use a different SKU.' },
          { status: 400 }
        )
      }
    }

    const categoryCreates =
      resolvedCategoryIds.length > 0
        ? await buildProductCategoryCreates(prisma, resolvedCategoryIds)
        : []

    const product = await prisma.product.create({
      data: {
        name,
        slug: resolvedSlug,
        description,
        price: Number(price),
        quantity: Number(quantity),
        images,
        thumbnail,
        brandId,
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

    const productResponse = {
      ...product,
      categories: product.productCategories.map((pc) => pc.category)
    }

    return NextResponse.json({
      success: true,
      product: productResponse
    })
  } catch (error) {
    console.error('Error creating product:', error)
    
    // Check for Prisma unique constraint errors (duplicate slug or SKU)
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
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create product'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
