import { NextRequest, NextResponse } from 'next/server'
import { updateSiteSettings } from '@/lib/settings'
import { requireAdminApi } from '../_utils'

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminApi(request)
  if (forbidden) return forbidden
  const { getSettings } = await import('@/lib/settings')
  const settings = await getSettings()
  return NextResponse.json({ success: true, settings })
}

export async function PUT(request: NextRequest) {
  const forbidden = await requireAdminApi(request)
  if (forbidden) return forbidden
  try {
    const body = await request.json()
    const settings = await updateSiteSettings({
      currencySymbol: body.currencySymbol,
      pickupSchedule: body.pickupSchedule,
    })
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
