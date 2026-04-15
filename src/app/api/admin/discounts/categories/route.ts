import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/discounts/categories - List discount categories
export async function GET() {
  try {
    const categories = await db.discount_categories.findMany({
      orderBy: { category_id: 'asc' },
    });
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/discounts/categories - Create category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, discount_type, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    const category = await db.discount_categories.create({
      data: {
        code: code || '',
        name,
        discount_type: discount_type || '',
        description: description || '',
        is_active: 1,
      },
    });

    return NextResponse.json({ status: 'success', category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/discounts/categories - Update category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { category_id, code, name, discount_type, description, is_active } = body;

    if (!category_id) {
      return NextResponse.json({ error: 'category_id required' }, { status: 400 });
    }

    const data: any = {};
    if (code !== undefined) data.code = code;
    if (name !== undefined) data.name = name;
    if (discount_type !== undefined) data.discount_type = discount_type;
    if (description !== undefined) data.description = description;
    if (is_active !== undefined) data.is_active = is_active;

    await db.discount_categories.update({ where: { category_id }, data });

    return NextResponse.json({ status: 'success', message: 'Category updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/discounts/categories - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = parseInt(searchParams.get('id') || '0');

    if (!categoryId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    await db.discount_categories.delete({ where: { category_id: categoryId } });

    return NextResponse.json({ status: 'success', message: 'Category deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
