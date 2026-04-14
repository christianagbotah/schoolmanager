import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// DELETE /api/routine/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.class_routine.delete({ where: { class_routine_id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Routine DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete routine' }, { status: 500 })
  }
}
