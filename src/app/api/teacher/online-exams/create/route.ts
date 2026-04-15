import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";

// POST /api/teacher/online-exams/create — create online exam for teacher's subjects
export async function POST(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const body = await request.json();
    const {
      title,
      class_id,
      subject_id,
      start_date,
      end_date,
      duration,
      minimum_percentage,
      instructions,
      questions,
    } = body;

    if (!title || !subject_id) {
      return NextResponse.json({ error: "Title and subject are required" }, { status: 400 });
    }

    // Verify teacher teaches this subject
    const teacherSubject = await db.subject.findFirst({
      where: { teacher_id: teacherId, subject_id: parseInt(subject_id) },
    });

    if (!teacherSubject) {
      return NextResponse.json(
        { error: "You can only create exams for your assigned subjects" },
        { status: 403 }
      );
    }

    // Create the online exam
    const exam = await db.online_exam.create({
      data: {
        title,
        subject_id: parseInt(subject_id),
        class_id: class_id ? parseInt(class_id) : null,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        duration: parseInt(duration) || 0,
        minimum_percentage: parseFloat(minimum_percentage) || 0,
        instructions: instructions || "",
        status: "published",
      },
    });

    return NextResponse.json({
      success: true,
      exam_id: exam.online_exam_id,
      message: "Online exam created successfully",
    });
  } catch (err) {
    console.error("Teacher online exam create error:", err);
    return NextResponse.json({ error: "Failed to create online exam" }, { status: 500 });
  }
}
