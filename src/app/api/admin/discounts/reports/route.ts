import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    // Get discount assignments
    const assignments = await db.student_discount_assignments.findMany({
      include: {
        profile: { select: { profile_name: true, discount_type: true, flat_amount: true, flat_percentage: true } },
        student: { select: { name: true, student_code: true, class_reached: string } },
      },
      orderBy: { assignment_id: 'desc' },
      take: 500,
    });

    // Category stats
    const categoryMap = new Map<string, { count: number; total_discount: number; total_percentage: number }>();
    const profileMap = new Map<string, { count: number; total_discount: number; profiles: Set<string> }>();
    const classMap = new Map<string, { count: number; total_discount: number }>();
    let totalAmount = 0;

    for (const a of assignments) {
      const amount = a.profile?.flat_amount || 0;
      const percentage = a.profile?.flat_percentage || 0;
      const categoryName = a.discount_category || 'Unknown';
      const profileName = a.profile?.profile_name || 'Unknown';
      const className = a.student?.class_reached || 'Unknown';

      totalAmount += amount;

      // Category
      const cat = categoryMap.get(categoryName) || { count: 0, total_discount: 0, total_percentage: 0 };
      cat.count += 1;
      cat.total_discount += amount;
      cat.total_percentage += percentage;
      categoryMap.set(categoryName, cat);

      // Profile
      const prof = profileMap.get(profileName) || { count: 0, total_discount: 0, profiles: new Set<string>() };
      prof.count += 1;
      prof.total_discount += amount;
      prof.profiles.add(profileName);
      profileMap.set(profileName, prof);

      // Class
      const cls = classMap.get(className) || { count: 0, total_discount: 0 };
      cls.count += 1;
      cls.total_discount += amount;
      classMap.set(className, cls);
    }

    const categories = Array.from(categoryMap.entries()).map(([category, data]) => ({ category, ...data }));
    const profiles = Array.from(profileMap.entries()).map(([profile, data]) => ({ profile, count: data.count, total_discount: data.total_discount, avg_discount: data.count > 0 ? data.total_discount / data.count : 0 }));
    const classes = Array.from(classMap.entries()).map(([class_name, data]) => ({ class_name, ...data }));

    // Summary
    const uniqueStudents = new Set(assignments.map(a => a.student_id)).size;
    const summary = {
      totalDiscounts: assignments.length,
      totalAmount,
      avgDiscount: assignments.length > 0 ? totalAmount / assignments.length : 0,
      studentsWithDiscount: uniqueStudents,
    };

    return NextResponse.json({ categories, profiles, classes, summary });
  } catch (error) {
    console.error('Error fetching discount reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
