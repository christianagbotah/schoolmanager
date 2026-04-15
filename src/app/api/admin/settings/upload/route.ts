import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';

// Helper to upsert a setting
async function setSetting(type: string, description: string) {
  const existing = await db.settings.findFirst({ where: { type } });
  if (existing) {
    await db.settings.update({ where: { settings_id: existing.settings_id }, data: { description } });
  } else {
    await db.settings.create({ data: { type, description, value: description } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file || !type) {
      return NextResponse.json({ error: 'File and type are required' }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ['school_logo', 'head_teacher_signature', 'ssnit_logo'];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    // Validate file type
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only image files (PNG, JPG, GIF, WebP) are allowed' }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'school');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.name) || '.png';
    const filename = `${type}_${Date.now()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Write file
    await writeFile(filepath, buffer);

    // Save path to settings
    const publicPath = `/uploads/school/${filename}`;
    await setSetting(type, publicPath);

    return NextResponse.json({
      success: true,
      path: publicPath,
      filename,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
