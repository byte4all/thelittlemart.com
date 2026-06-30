import { prisma } from "@/lib/prisma";
import {
  getDefaultPickupScheduleConfig,
  normalizePickupScheduleConfig,
  PICKUP_SCHEDULE_SETTING_KEY,
  type PickupScheduleConfig,
} from "@/lib/pickup-schedule-config";

export async function getPickupScheduleConfig(): Promise<PickupScheduleConfig> {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: PICKUP_SCHEDULE_SETTING_KEY },
    });
    if (!row?.value) return getDefaultPickupScheduleConfig();
    return normalizePickupScheduleConfig(JSON.parse(row.value));
  } catch {
    return getDefaultPickupScheduleConfig();
  }
}

export async function savePickupScheduleConfig(
  config: PickupScheduleConfig
): Promise<PickupScheduleConfig> {
  const normalized = normalizePickupScheduleConfig(config);
  await prisma.setting.upsert({
    where: { key: PICKUP_SCHEDULE_SETTING_KEY },
    create: { key: PICKUP_SCHEDULE_SETTING_KEY, value: JSON.stringify(normalized) },
    update: { value: JSON.stringify(normalized) },
  });
  return normalized;
}
