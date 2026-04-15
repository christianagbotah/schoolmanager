import { db } from "@/lib/db";

const settingsCache: Record<string, string> = {};

/**
 * Get a setting value by type from the settings table.
 * Uses in-memory cache for performance within a single request.
 */
export async function getSettings(): Promise<Record<string, string>> {
  if (Object.keys(settingsCache).length > 0) {
    return settingsCache;
  }

  const records = await db.settings.findMany();
  const map: Record<string, string> = {};
  for (const r of records) {
    map[r.type] = r.description;
  }
  Object.assign(settingsCache, map);
  return map;
}

/**
 * Clear the settings cache (useful for testing).
 */
export function clearSettingsCache() {
  for (const key of Object.keys(settingsCache)) {
    delete settingsCache[key];
  }
}

/**
 * Get a single setting value by type.
 */
export async function getSetting(type: string): Promise<string> {
  const settings = await getSettings();
  return settings[type] || "";
}
