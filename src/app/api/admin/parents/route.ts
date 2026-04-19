import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

/**
 * GET /api/admin/parents
 * Lists parents with server-side search, filtering, pagination, and gender counts.
 * Faithfully mirrors CI3 get_parents(), get_active_parents(), get_inactive_parents().
 *
 * Query params:
 *   search     - search by name, email, phone
 *   status     - filter: "" (all), "active", "inactive"
 *   page       - page number (1-based)
 *   pageSize   - items per page
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "";
    const classIdFilter = searchParams.get("classId") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get("pageSize") || "15", 10)));

    // Build where clause
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { profession: { contains: search } },
      ];
    }
    // CI3 uses block_limit for account status: blocked = block_limit >= 3
    if (statusFilter === "active") {
      where.block_limit = { lt: 3 };
    } else if (statusFilter === "inactive") {
      where.block_limit = { gte: 3 };
    }

    // If classId filter is provided, only show parents linked to students in that class
    if (classIdFilter) {
      const enrollments = await db.enroll.findMany({
        where: { class_id: parseInt(classIdFilter, 10) },
        select: { parent_id: true },
      });
      const linkedParentIds = enrollments.map(e => e.parent_id).filter(Boolean);
      if (linkedParentIds.length > 0) {
        where.parent_id = { in: linkedParentIds };
      } else {
        where.parent_id = -1; // Force empty result
      }
    }

    // Parallel queries for data, total, and gender counts
    const [parents, total, totalMale, totalFemale] = await Promise.all([
      db.parent.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { parent_id: "desc" },
      }),
      db.parent.count({ where }),
      db.parent.count({ where: { ...where, guardian_gender: "Male" } }),
      db.parent.count({ where: { ...where, guardian_gender: "Female" } }),
    ]);

    // Get children counts for each parent (from both student.parent_id and enroll.parent_id)
    const parentIds = parents.map((p) => p.parent_id);
    const enrollCounts = parentIds.length > 0
      ? await db.enroll.groupBy({
          by: ["parent_id"],
          where: { parent_id: { in: parentIds } },
          _count: { enroll_id: true },
        })
      : [];
    const studentCounts = parentIds.length > 0
      ? await db.student.groupBy({
          by: ["parent_id"],
          where: { parent_id: { in: parentIds } },
          _count: { student_id: true },
        })
      : [];

    const enrollMap = new Map(enrollCounts.map((e) => [e.parent_id, e._count.enroll_id]));
    const studentMap = new Map(studentCounts.map((s) => [s.parent_id, s._count.student_id]));

    const data = parents.map((p) => ({
      parent_id: p.parent_id,
      name: p.name,
      guardian_gender: p.guardian_gender,
      guardian_is_the: p.guardian_is_the,
      email: p.email,
      phone: p.phone,
      address: p.address,
      profession: p.profession,
      designation: p.designation,
      active_status: p.active_status,
      authentication_key: p.authentication_key,
      block_limit: p.block_limit,
      children_count: Math.max(enrollMap.get(p.parent_id) || 0, studentMap.get(p.parent_id) || 0),
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
      grandTotalGender: totalMale + totalFemale,
    });
  } catch (error) {
    console.error("[Parents API] Error listing parents:", error);
    return NextResponse.json({ error: "Failed to load parents" }, { status: 500 });
  }
}

/**
 * POST /api/admin/parents
 * Creates a new parent. Faithfully mirrors CI3 parent/create.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      guardian_gender,
      guardian_is_the,
      email,
      phone,
      password,
      address,
      profession,
      designation,
    } = body;

    // Validation (matching original CI3 rules)
    const errors: string[] = [];
    if (!name?.trim()) errors.push("Parent Name is required");

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(", "), errors }, { status: 400 });
    }

    // Email format validation (if email provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email?.trim() && !emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid Parent's Email Address" }, { status: 400 });
    }

    // Email uniqueness check
    const finalEmail = email?.trim() || phone?.trim() || "";
    const existing = await db.parent.findFirst({
      where: { email: finalEmail.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "This email address is not available" }, { status: 409 });
    }

    // Generate authentication key (matching CI3: substr of sha1(md5(rand)))
    const authKey = randomBytes(3).toString("hex").substring(0, 5).toUpperCase();

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = password?.trim()
      ? await bcrypt.hash(password, 10)
      : await bcrypt.hash("123456", 10);

    // Create parent
    const parent = await db.parent.create({
      data: {
        name: name.trim().toUpperCase(),
        guardian_gender: guardian_gender || "Male",
        guardian_is_the: guardian_is_the || "",
        email: finalEmail.toLowerCase(),
        phone: phone?.trim() || "",
        password: hashedPassword,
        address: address ? address.trim() : "",
        profession: profession ? profession.trim() : "",
        designation: designation ? designation.trim() : "",
        father_name: body.father_name?.trim() || "",
        father_phone: body.father_phone?.trim() || "",
        mother_name: body.mother_name?.trim() || "",
        mother_phone: body.mother_phone?.trim() || "",
        authentication_key: authKey,
        active_status: 1,
        block_limit: 0,
      },
    });

    return NextResponse.json(
      {
        message: "Parent's data added successfully",
        parent_id: parent.parent_id,
        authentication_key: authKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Parents API] Error creating parent:", error);
    return NextResponse.json({ error: "Failed to create parent" }, { status: 500 });
  }
}
