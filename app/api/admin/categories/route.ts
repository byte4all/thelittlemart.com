import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '../_utils'

export async function GET(request: Request) {
  const forbidden = await requireAdminApi(request)
  if (forbidden) return forbidden

  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            productCategories: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            sortOrder: true,
            _count: {
              select: {
                productCategories: true
              }
            }
          },
          orderBy: [
            { sortOrder: 'asc' },
            { name: 'asc' },
          ],
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      categories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch categories'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const forbidden = await requireAdminApi(request)
  if (forbidden) return forbidden

  try {
    const body = await request.json()
    const { name, slug, description, image, parentId } = body

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
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

    const maxSort = await prisma.category.aggregate({
      where: { parentId: parentId || null },
      _max: { sortOrder: true },
    })
    const sortOrder = (maxSort._max.sortOrder ?? -10) + 10

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image,
        parentId: parentId || null,
        sortOrder,
      },
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
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
