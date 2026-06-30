import { prisma } from '@/lib/prisma'
import type { PickupScheduleConfig } from '@/lib/pickup-schedule-config'
import { getPickupScheduleConfig, savePickupScheduleConfig } from '@/lib/pickup-schedule-store'

const DEFAULT_CURRENCY_SYMBOL = 'RM'

export type SiteSettings = {
  currencySymbol: string
  pickupSchedule: PickupScheduleConfig
}

export async function getSettings(): Promise<SiteSettings> {
  const [currencySymbol, pickupSchedule] = await Promise.all([
    getCurrencySymbol(),
    getPickupScheduleConfig(),
  ])
  return { currencySymbol, pickupSchedule }
}

async function getCurrencySymbol(): Promise<string> {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: 'currencySymbol' },
    })
    return row?.value ?? DEFAULT_CURRENCY_SYMBOL
  } catch {
    return DEFAULT_CURRENCY_SYMBOL
  }
}

export async function setCurrencySymbol(symbol: string): Promise<void> {
  const value = (symbol || DEFAULT_CURRENCY_SYMBOL).trim() || DEFAULT_CURRENCY_SYMBOL
  await prisma.setting.upsert({
    where: { key: 'currencySymbol' },
    create: { key: 'currencySymbol', value },
    update: { value },
  })
}

export async function updateSiteSettings(input: {
  currencySymbol?: string
  pickupSchedule?: unknown
}): Promise<SiteSettings> {
  if (input.currencySymbol != null) {
    await setCurrencySymbol(String(input.currencySymbol))
  }
  if (input.pickupSchedule != null) {
    const { normalizePickupScheduleConfig } = await import('@/lib/pickup-schedule-config')
    await savePickupScheduleConfig(normalizePickupScheduleConfig(input.pickupSchedule))
  }
  return getSettings()
}

export { getPickupScheduleConfig, savePickupScheduleConfig }
export type { PickupScheduleConfig }
