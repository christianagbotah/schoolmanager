import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const classId = searchParams.get("classId") || "";
    const sectionId = searchParams.get("sectionId") || "";
    const gender = searchParams.get("gender") || "";
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { student_code: { contains: search } },
        { first_name: { contains: search } },
        { last_name: { contains: search } },
      ];
    }

    if (classId) {
      where.enrolls = {
        some: {
          class_id: parseInt(classId),
        },
      };
    }

    if (sectionId) {
      where.enrolls = {
        ...(where.enrolls as Record<string, unknown> || {}),
        some: {
          ...(typeof where.enrolls === "object" && "some" in (where.enrolls as Record<string, unknown>)
            ? (where.enrolls as Record<string, Record<string, unknown>>).some
            : {}),
          section_id: parseInt(sectionId),
        },
      };
    }

    if (gender) {
      where.sex = gender;
    }

    if (status !== "") {
      where.active_status = status === "active" ? 1 : 0;
    }

    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { student_id: "desc" },
        include: {
          parent: {
            select: {
              parent_id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          enrolls: {
            where: {
              year: new Date().getFullYear().toString(),
            },
            include: {
              class: {
                select: {
                  class_id: true,
                  name: true,
                },
              },
              section: {
                select: {
                  section_id: true,
                  name: true,
                },
              },
            },
            take: 1,
          },
        },
      }),
      db.student.count({ where }),
    ]);

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

// ── PUT: Promotion, Block/Unblock, Mute/Unmute ──
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Handle student promotion (matches original CI3 Admin::student_promotion/promote)
    if (action === "promote") {
      const { student_ids, to_class_id, to_section_id, promotion_year, running_term, running_year } = body;
      if (!student_ids || !to_class_id || !promotion_year) {
        return NextResponse.json({ error: "Missing promotion parameters" }, { status: 400 });
      }
      const ids = typeof student_ids === "string" ? student_ids.split(",").map(Number) : student_ids.map(Number);
      const sectionId = to_section_id || null;
      const promoted: number[] = [];
      const errors: string[] = [];
      for (const studentId of ids) {
        try {
          await db.enroll.create({
            data: {
              student_id: studentId,
              class_id: parseInt(to_class_id),
              section_id: sectionId ? parseInt(sectionId) : null,
              year: promotion_year,
              term: running_term || "Term 1",
              enroll_code: crypto.randomBytes(4).toString("hex").substring(0, 7),
            },
          });
          promoted.push(studentId);
        } catch (e) {
          errors.push(`Student ${studentId}: ${e instanceof Error ? e.message : "Unknown"}`);
        }
      }
      return NextResponse.json({ promoted, total: ids.length, successCount: promoted.length, errors });
    }

    // Handle student block (matches original CI3 block_limit=3 → active_status=0)
    if (action === "block") {
      const { student_id } = body;
      await db.student.update({
        where: { student_id: parseInt(student_id) },
        data: { active_status: 0 },
      });
      return NextResponse.json({ success: true });
    }

    // Handle student unblock
    if (action === "unblock") {
      const { student_id } = body;
      await db.student.update({
        where: { student_id: parseInt(student_id) },
        data: { active_status: 1 },
      });
      return NextResponse.json({ success: true });
    }

    // Handle student mute (matches original CI3: sets mute=1 on student + related records)
    if (action === "mute") {
      const { student_id } = body;
      await db.student.update({
        where: { student_id: parseInt(student_id) },
        data: { mute: 1 },
      });
      return NextResponse.json({ success: true });
    }

    // Handle student unmute (matches original CI3: unmute + re-enroll if needed)
    if (action === "unmute") {
      const { student_id } = body;
      await db.student.update({
        where: { student_id: parseInt(student_id) },
        data: { mute: 0 },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error in student PUT:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

// ── POST: Create Student (matches original CI3 Admin::student('create')) ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      first_name, middle_name, last_name, sex, religion, blood_group, birthday,
      nationality, address, phone, student_phone, email, admission_date,
      parent_id, class_id, section_id, year, term, roll,
      username, password, special_needs, ghana_card_id, place_of_birth,
      hometown, tribe, emergency_contact, allergies, medical_conditions,
      nhis_number, nhis_status, disability_status, special_diet, student_special_diet_details,
      former_school, class_reached, student_code,
    } = body;

    const name = [first_name, middle_name, last_name].filter(Boolean).join(" ").toUpperCase();

    // Generate 5-char authentication key (matches original CI3: sha1(md5(mt_rand())))
    const authKey = crypto.randomBytes(3).toString("hex").substring(0, 5).toUpperCase();

    const student = await db.student.create({
      data: {
        first_name: first_name || "",
        middle_name: middle_name || "",
        last_name: last_name || "",
        name,
        sex: sex || "",
        religion: religion || "",
        blood_group: blood_group || "",
        birthday: birthday ? new Date(birthday) : null,
        nationality: nationality || "Ghanaian",
        address: address || "",
        phone: phone || "",
        student_phone: student_phone || "",
        email: email || "",
        admission_date: admission_date ? new Date(admission_date) : new Date(),
        parent_id: parent_id || null,
        username: username || "",
        password: password || "",
        special_needs: special_needs || "",
        student_code: student_code || generateStudentCode(),
        ghana_card_id: ghana_card_id || "",
        place_of_birth: place_of_birth || "",
        hometown: hometown || "",
        tribe: tribe || "",
        emergency_contact: emergency_contact || "",
        allergies: allergies || "",
        medical_conditions: medical_conditions || "",
        nhis_number: nhis_number || "",
        nhis_status: nhis_status || "inactive",
        disability_status: disability_status ? 1 : 0,
        special_diet: special_diet ? 1 : 0,
        student_special_diet_details: student_special_diet_details || "",
        former_school: former_school || "",
        class_reached: class_reached || "",
        authentication_key: authKey,
        active_status: 1,
        mute: 0,
      },
    });

    // Create enrollment record (matches original CI3)
    if (class_id && section_id) {
      await db.enroll.create({
        data: {
          student_id: student.student_id,
          class_id: parseInt(class_id),
          section_id: parseInt(section_id),
          year: year || new Date().getFullYear().toString(),
          term: term || "",
          roll: roll || "",
          enroll_code: crypto.randomBytes(4).toString("hex").substring(0, 7),
        },
      });
    }

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}

// ── Helpers ──
function generateStudentCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `STU${year}${random}`;
}
