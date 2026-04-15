import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper to get a single setting value
async function getSetting(type: string): Promise<string> {
  const s = await db.settings.findFirst({ where: { type } });
  return s?.description || s?.value || '';
}

// Helper to upsert a setting
async function setSetting(type: string, description: string) {
  const existing = await db.settings.findFirst({ where: { type } });
  if (existing) {
    await db.settings.update({ where: { settings_id: existing.settings_id }, data: { description } });
  } else {
    await db.settings.create({ data: { type, description, value: description } });
  }
}

export async function GET() {
  try {
    // Return all settings as a flat key-value object
    const allSettings = await db.settings.findMany({ orderBy: { settings_id: 'asc' } });

    const settingsMap: Record<string, string> = {};
    for (const s of allSettings) {
      settingsMap[s.type] = s.description || s.value || '';
    }

    return NextResponse.json({
      settings: allSettings,
      map: settingsMap,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body as { settings: Record<string, string> };

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 });
    }

    // Batch upsert all settings
    for (const [type, description] of Object.entries(settings)) {
      await setSetting(type, description);
    }

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
