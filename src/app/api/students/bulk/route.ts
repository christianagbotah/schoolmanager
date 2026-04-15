import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Bulk Student Upload API
 * Accepts CSV text content with 40 columns matching original CI3 format.
 * Original CI3 column mapping (0-indexed):
 *   0=student_code, 1=first_name, 2=middle_name, 3=last_name, 4=sex,
 *   5=birthday, 6=blood_group, 7=nationality, 8=ghana_card_id, 9=place_of_birth,
 *   10=hometown, 11=tribe, 12=religion, 13=student_phone, 14=email, 15=address,
 *   16=admission_date, 17=former_school, 18=class_reached, 19=guardian_name,
 *   20=guardian_phone, 21=guardian_email, 22=emergency_contact, 23=father_name,
 *   24=father_phone, 25=father_occupation, 26=mother_name, 27=mother_phone,
 *   28=mother_occupation, 29=allergies, 30=medical_conditions, 31=nhis_number,
 *   32=nhis_status, 33=disability_status, 34=special_needs, 35=learning_support,
 *   36=digital_literacy, 37=home_technology_access, 38=special_diet,
 *   39=special_diet_details
 */
export async function POST(request: NextRequest) {
  try {
    // Accept either JSON array or raw CSV text
    const contentType = request.headers.get("content-type") || "";
    let students: Array<Record<string, string>> = [];

    if (contentType.includes("text/csv") || contentType.includes("multipart/form-data")) {
      // Parse CSV text
      const text = await request.text();
      const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length < 2) {
        return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (values.length < 2) continue;
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || "";
        });
        students.push(row);
      }
    } else {
      // Accept JSON format
      const body = await request.json();
      if (body.students && Array.isArray(body.students)) {
        students = body.students;
      } else if (Array.isArray(body)) {
        students = body;
      } else {
        return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
      }
    }

    if (students.length === 0) {
      return NextResponse.json({ error: "No student data provided" }, { status: 400 });
    }

    // Get class_id and section_id from query params (set by the upload page)
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("class_id") ? parseInt(searchParams.get("class_id")!) : null;
    const sectionId = searchParams.get("section_id") ? parseInt(searchParams.get("section_id")!) : null;
    const year = searchParams.get("year") || new Date().getFullYear().toString();

    const results: Array<{
      row: number;
      student_code: string;
      success: boolean;
      error?: string;
      student_id?: number;
    }> = [];
    let successCount = 0;

    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      try {
        const first_name = row.first_name || row.firstname || "";
        const middle_name = row.middle_name || row.middlename || "";
        const last_name = row.last_name || row.lastname || "";
        const name = [first_name, middle_name, last_name].filter(Boolean).join(" ").toUpperCase();

        if (!name.trim()) {
          results.push({ row: i + 2, student_code: "", success: false, error: "Name is required (columns 1-3)" });
          continue;
        }

        const email = (row.email || "").toLowerCase().trim();
        if (email) {
          const existing = await db.student.findFirst({ where: { email } });
          if (existing) {
            results.push({ row: i + 2, student_code: row.student_code || "", success: false, error: `Duplicate email: ${email}` });
            continue;
          }
        }

        const studentCode = row.student_code || generateStudentCode();
        const authKey = crypto.randomBytes(3).toString("hex").substring(0, 5).toUpperCase();

        const student = await db.student.create({
          data: {
            first_name,
            middle_name,
            last_name,
            name,
            sex: row.sex || row.gender || "",
            religion: row.religion || "",
            blood_group: row.blood_group || row.bloodgroup || "",
            birthday: row.birthday ? new Date(row.birthday) : null,
            nationality: row.nationality || "Ghanaian",
            address: row.address || "",
            phone: row.phone || row.guardian_phone || "",
            student_phone: row.student_phone || "",
            email,
            admission_date: row.admission_date ? new Date(row.admission_date) : new Date(),
            student_code: studentCode,
            username: row.username || "",
            password: row.password || "",
            special_needs: row.special_needs || row.specialneeds || "",
            ghana_card_id: row.ghana_card_id || row.ghana_card || "",
            place_of_birth: row.place_of_birth || "",
            hometown: row.hometown || "",
            tribe: row.tribe || "",
            emergency_contact: row.emergency_contact || "",
            allergies: row.allergies || "",
            medical_conditions: row.medical_conditions || row.medicalconditions || "",
            nhis_number: row.nhis_number || "",
            nhis_status: row.nhis_status || "inactive",
            disability_status: row.disability_status === "1" || row.disability_status === "1" ? 1 : 0,
            special_diet: row.special_diet === "1" || row.special_diet === "1" ? 1 : 0,
            student_special_diet_details: row.special_diet_details || "",
            former_school: row.former_school || "",
            class_reached: row.class_reached || "",
            authentication_key: authKey,
            active_status: 1,
            mute: 0,
          },
        });

        // Create enrollment if class specified
        if (classId) {
          await db.enroll.create({
            data: {
              student_id: student.student_id,
              class_id: classId,
              section_id: sectionId || null,
              year,
              term: "",
              enroll_code: crypto.randomBytes(4).toString("hex").substring(0, 7),
            },
          });
        }

        results.push({ row: i + 2, student_code: studentCode, success: true, student_id: student.student_id });
        successCount++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({ row: i + 2, student_code: "", success: false, error: message });
      }
    }

    return NextResponse.json({
      results,
      total: students.length,
      successCount,
      failCount: students.length - successCount,
    });
  } catch (error) {
    console.error("Error in bulk upload:", error);
    return NextResponse.json(
      { error: "Failed to process bulk upload" },
      { status: 500 }
    );
  }
}

function generateStudentCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `STU${year}${random}`;
}
