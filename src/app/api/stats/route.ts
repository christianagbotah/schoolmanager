import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [
      totalTeachers,
      activeTeachers,
      totalClasses,
      totalSections,
      totalSubjects,
      totalDepartments,
      totalDesignations,
      totalStudents,
    ] = await Promise.all([
      db.teacher.count(),
      db.teacher.count({ where: { active_status: 1 } }),
      db.school_class.count(),
      db.section.count(),
      db.subject.count(),
      db.department.count(),
      db.designation.count(),
      db.student.count(),
    ])

    const categoryCounts = await db.school_class.groupBy({
      by: ['category'],
      _count: { category: true },
    })

    const categories = categoryCounts.map((c) => ({
      category: c.category,
      count: c._count.category,
    }))

    return NextResponse.json({
      totalTeachers,
      activeTeachers,
      totalClasses,
      totalSections,
      totalSubjects,
      totalDepartments,
      totalDesignations,
      totalStudents,
      categories,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
