import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_PAGES = [
  { title: 'About Us', slug: 'about-us', content: '' },
  { title: 'Privacy Policy', slug: 'privacy-policy', content: '' },
  { title: 'Terms & Conditions', slug: 'terms-conditions', content: '' },
]

// GET /api/admin/frontend/pages - List all static pages
export async function GET() {
  let pages = await db.frontend_pages.findMany({
    orderBy: { title: 'asc' },
  })

  // Seed default pages if none exist
  if (pages.length === 0) {
    for (const page of DEFAULT_PAGES) {
      await db.frontend_pages.create({
        data: {
          title: page.title,
          slug: page.slug,
          content: page.content,
          updated_at: new Date(),
        },
      })
    }
    pages = await db.frontend_pages.findMany({ orderBy: { title: 'asc' } })
  }

  const total = pages.length
  const lastUpdated = pages.reduce((latest: Date | null, p) => {
    if (p.updated_at && (!latest || p.updated_at > latest)) return p.updated_at
    return latest
  }, null)

  return NextResponse.json({ pages, stats: { total, lastUpdated } })
}

// POST /api/admin/frontend/pages - Create page
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, slug, content } = body

  if (!title || !slug) {
    return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 })
  }

  // Check for duplicate slug
  const existing = await db.frontend_pages.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'A page with this slug already exists' }, { status: 409 })
  }

  const newPage = await db.frontend_pages.create({
    data: {
      title,
      slug,
      content: content || '',
      updated_at: new Date(),
    },
  })

  return NextResponse.json(newPage, { status: 201 })
}

// PUT /api/admin/frontend/pages - Update page
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body

  if (!id) {
    return NextResponse.json({ error: 'Page ID is required' }, { status: 400 })
  }

  const existing = await db.frontend_pages.findUnique({ where: { frontend_pages_id: parseInt(id) } })
  if (!existing) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = { updated_at: new Date() }
  if (data.title !== undefined) updateData.title = data.title
  if (data.content !== undefined) updateData.content = data.content
  if (data.slug !== undefined) {
    // Check for duplicate slug (excluding current page)
    const dup = await db.frontend_pages.findFirst({
      where: { slug: data.slug, frontend_pages_id: { not: parseInt(id) } },
    })
    if (dup) {
      return NextResponse.json({ error: 'A page with this slug already exists' }, { status: 409 })
    }
    updateData.slug = data.slug
  }

  const updated = await db.frontend_pages.update({
    where: { frontend_pages_id: parseInt(id) },
    data: updateData,
  })

  return NextResponse.json(updated)
}

// DELETE /api/admin/frontend/pages - Delete page
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.frontend_pages.delete({ where: { frontend_pages_id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
