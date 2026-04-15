import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const exams = await db.online_exam.findMany({
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
        results: { select: { online_exam_result_id: true } },
      },
      orderBy: { online_exam_id: 'desc' },
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error('Error fetching online exams:', error);
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subject_id, class_id, section_id, instructions, minimum_percentage, start_date, end_date, duration, questions } = body;

    if (!title) {
      return NextResponse.json({ error: 'Exam title is required' }, { status: 400 });
    }

    const exam = await db.online_exam.create({
      data: {
        title,
        subject_id: subject_id || null,
        class_id: class_id || null,
        instructions: instructions || '',
        minimum_percentage: minimum_percentage || 0,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        duration: duration || 0,
        status: 'published',
      },
    });

    // Store questions as settings (since there's no online_exam_question table)
    if (questions && Array.isArray(questions)) {
      await db.settings.create({
        data: {
          type: 'online_exam_questions',
          description: `questions_for_exam_${exam.online_exam_id}`,
          value: JSON.stringify(questions),
        },
      });
    }

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error('Error creating online exam:', error);
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await db.online_exam_result.deleteMany({ where: { exam_id: parseInt(id) } });
    await db.settings.deleteMany({ where: { type: 'online_exam_questions', description: `questions_for_exam_${id}` } });
    await db.online_exam.delete({ where: { online_exam_id: parseInt(id) } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 });
  }
}
