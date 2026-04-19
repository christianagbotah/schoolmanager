import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

/**
 * GET /api/admin/teachers
 * Lists teachers with server-side search, filtering, and pagination.
 * Faithfully mirrors CI3 get_teachers() with gender counts.
 *
 * Query params:
 *   search     - search by name, email, or teacher_code
 *   status     - filter by active_status (1 or 0)
 *   gender     - filter by gender (male/female)
 *   page       - page number (1-based)
 *   pageSize   - items per page
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "";
    const genderFilter = searchParams.get("gender") || "";
    const departmentFilter = searchParams.get("department") || "";
    const designationFilter = searchParams.get("designation") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get("pageSize") || "15", 10)));

    // Build where clause
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { email: { contains: search } },
        { teacher_code: { contains: search } },
      ];
    }
    if (statusFilter === "1") where.active_status = 1;
    else if (statusFilter === "0") where.active_status = 0;
    if (genderFilter) {
      where.gender = genderFilter.charAt(0).toUpperCase() + genderFilter.slice(1).toLowerCase();
    }
    if (departmentFilter) {
      where.department_id = parseInt(departmentFilter, 10);
    }
    if (designationFilter) {
      where.designation_id = parseInt(designationFilter, 10);
    }

    // Parallel queries
    const [teachers, total, totalMale, totalFemale] = await Promise.all([
      db.teacher.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { teacher_id: "desc" },
        include: {
          designation: { select: { id: true, des_name: true } },
          department: { select: { id: true, dep_name: true } },
          classes: { select: { class_id: true, name: true, name_numeric: true } },
        },
      }),
      db.teacher.count({ where }),
      db.teacher.count({ where: { ...where, gender: "Male" } }),
      db.teacher.count({ where: { ...where, gender: "Female" } }),
    ]);

    // Get sections for form master display
    const teacherIds = teachers.map((t) => t.teacher_id);
    const formMasterClasses = teacherIds.length > 0
      ? await db.school_class.findMany({
          where: { teacher_id: { in: teacherIds } },
          select: { class_id: true, name: true, name_numeric: true, teacher_id: true },
        })
      : [];

    // Map form master classes to teachers
    const formMasterMap = new Map<number, string[]>();
    for (const fc of formMasterClasses) {
      if (fc.teacher_id) {
        const existing = formMasterMap.get(fc.teacher_id) || [];
        existing.push(`${fc.name} ${fc.name_numeric}`);
        formMasterMap.set(fc.teacher_id, existing);
      }
    }

    const data = teachers.map((t) => ({
      teacher_id: t.teacher_id,
      name: t.name,
      first_name: t.first_name,
      last_name: t.last_name,
      teacher_code: t.teacher_code,
      email: t.email,
      phone: t.phone,
      gender: t.gender,
      blood_group: t.blood_group,
      birthday: t.birthday?.toISOString() || null,
      address: t.address,
      active_status: t.active_status,
      joining_date: t.joining_date?.toISOString() || null,
      authentication_key: t.authentication_key,
      block_limit: t.block_limit,
      designation: t.designation,
      department: t.department,
      form_master: formMasterMap.get(t.teacher_id) || [],
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      totalMale,
      totalFemale,
      grandTotal: totalMale + totalFemale,
    });
  } catch (error) {
    console.error("[Teachers API] Error listing teachers:", error);
    return NextResponse.json({ error: "Failed to load teachers" }, { status: 500 });
  }
}

/**
 * POST /api/admin/teachers
 * Creates a new teacher. Faithfully mirrors CI3 teacher/create.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { first_name, other_name, last_name, email, phone, password, birthday, gender, address, teacher_code, designation_id, department_id, ghana_card_id, account_number, account_details } = body;

    // Validation (matching original CI3 rules)
    const errors: string[] = [];
    if (!first_name?.trim()) errors.push("First Name is required");
    if (!last_name?.trim()) errors.push("Last Name is required");
    if (!email?.trim()) errors.push("Email is required");
    if (!gender) errors.push("Gender is required");
    if (!phone?.trim()) errors.push("Phone Number is required");
    if (!birthday) errors.push("Date of birth is required");
    if (!ghana_card_id?.trim()) errors.push("Ghana Card is required");
    if (!account_number?.trim()) errors.push("Account number is required");
    if (!account_details?.trim()) errors.push("Account details is required");

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(", "), errors }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid Email Address" }, { status: 400 });
    }

    // Email uniqueness check
    const existingTeacher = await db.teacher.findUnique({ where: { email: email.toLowerCase() } });
    if (existingTeacher) {
      return NextResponse.json({ error: "This email address is not available" }, { status: 409 });
    }

    // Build name (matching original: FIRST OTHER LAST)
    const name = [first_name?.trim().toUpperCase(), other_name?.trim().toUpperCase(), last_name?.trim().toUpperCase()]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    // Generate authentication key
    const authKey = randomBytes(3).toString("hex").substring(0, 5).toUpperCase();

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = password ? await bcrypt.hash(password, 10) : "";

    // Build social links JSON (matching CI3 format: array of objects)
    const socialLinks = JSON.stringify([{
      facebook: body.facebook?.trim() || "",
      twitter: body.twitter?.trim() || "",
      linkedin: body.linkedin?.trim() || "",
    }]);

    // Create teacher
    const teacher = await db.teacher.create({
      data: {
        name,
        first_name: first_name.trim().toUpperCase(),
        other_name: other_name?.trim().toUpperCase() || "",
        last_name: last_name.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || "",
        password: hashedPassword,
        birthday: birthday ? new Date(birthday) : null,
        gender: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase(),
        address: address ? address.charAt(0).toUpperCase() + address.slice(1).toLowerCase() : "",
        teacher_code: teacher_code?.trim() || "",
        designation_id: designation_id ? parseInt(designation_id, 10) : null,
        department_id: department_id ? parseInt(department_id, 10) : null,
        authentication_key: authKey,
        ghana_card_id: ghana_card_id?.trim() || "",
        ssnit_id: body.ssnit_id?.trim() || "",
        petra_id: body.petra_id?.trim() || "",
        account_number: account_number?.trim() || "",
        account_details: account_details?.trim() || "",
        social_links: socialLinks,
      },
    });

    return NextResponse.json({
      message: "Teacher added successfully",
      teacher_id: teacher.teacher_id,
      authentication_key: authKey,
    }, { status: 201 });
  } catch (error) {
    console.error("[Teachers API] Error creating teacher:", error);
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 });
  }
}
