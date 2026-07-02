import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch all categories with their children
    const allCategories = await prisma.category.findMany({
      where: {
        parentId: null // Only get main categories
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true
          },
          orderBy: [
            { sortOrder: 'asc' },
            { name: 'asc' },
          ]
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ]
    })

    return NextResponse.json({
      success: true,
      categories: allCategories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
