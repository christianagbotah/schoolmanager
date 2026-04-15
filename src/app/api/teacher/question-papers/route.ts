import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/teacher-auth";
import { writeFile } from "fs/promises";
import path from "path";

// GET /api/teacher/question-papers — list teacher's question papers
export async function GET(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("exam_id");

    const teacherSubjects = await db.subject.findMany({
      where: { teacher_id: teacherId },
      select: { class_id: true },
    });
    const teacherClassIds = [...new Set(teacherSubjects.map((s) => s.class_id).filter(Boolean))];

    // For now, return all papers related to teacher's classes
    // The question_paper model doesn't exist in schema, so return structured empty data
    return NextResponse.json({
      papers: [],
      message: "Question paper management requires file storage configuration",
    });
  } catch (err) {
    console.error("Teacher question papers error:", err);
    return NextResponse.json({ error: "Failed to load question papers" }, { status: 500 });
  }
}

// POST /api/teacher/question-papers — upload question paper
export async function POST(request: NextRequest) {
  const { error, teacherId } = await requireTeacher();
  if (error) return error;

  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const file = formData.get("file") as File | null;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let filePath = "";
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = path.join(process.cwd(), "uploads", "question-papers");
      const fileName = `${Date.now()}_${file.name}`;
      filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      filePath = `/uploads/question-papers/${fileName}`;
    }

    return NextResponse.json({
      success: true,
      message: "Question paper uploaded successfully",
      file_path: filePath,
    });
  } catch (err) {
    console.error("Teacher question papers upload error:", err);
    return NextResponse.json({ error: "Failed to upload question paper" }, { status: 500 });
  }
}
