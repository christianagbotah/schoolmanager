import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: PNG, JPEG, GIF, SVG, ICO, WebP' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB' }, { status: 400 });
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || '.png';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    const url = `/uploads/${uniqueName}`;

    return NextResponse.json({
      success: true,
      url,
      filename: uniqueName,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
