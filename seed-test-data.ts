/**
 * Seed Test Data for School Manager
 * 
 * Creates test login accounts for all 6 roles:
 * - Admin: admin@school.com / admin123
 * - Teacher: teacher@school.com / teacher123
 * - Student: student@school.com / student123
 * - Parent: parent@school.com / parent123
 * - Accountant: accountant@school.com / accountant123
 * - Librarian: librarian@school.com / librarian123
 * 
 * All accounts use the same authentication key: ABCDE
 * 
 * Usage: npx tsx /home/z/my-project/seed-test-data.ts
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

const AUTH_KEY = "ABCDE";

async function main() {
  console.log("🌱 Seeding test data...\n");

  // ─── 1. Ensure RBAC Roles exist ─────────────────────────
  console.log("📋 Ensuring RBAC roles exist...");

  const roles = [
    { name: "Super Admin", slug: "super-admin", description: "Full system access", level: 1, isDefault: false },
    { name: "Administrator", slug: "admin", description: "School administrator", level: 2, isDefault: false },
    { name: "Teacher", slug: "teacher", description: "Teaching staff", level: 0, isDefault: false },
    { name: "Student", slug: "student", description: "Student", level: 0, isDefault: true },
    { name: "Parent", slug: "parent", description: "Parent/Guardian", level: 0, isDefault: false },
    { name: "Accountant", slug: "accountant", description: "Financial staff", level: 0, isDefault: false },
    { name: "Librarian", slug: "librarian", description: "Library staff", level: 0, isDefault: false },
  ];

  for (const roleData of roles) {
    await db.role.upsert({
      where: { slug: roleData.slug },
      update: {
        name: roleData.name,
        description: roleData.description,
        level: roleData.level,
      },
      create: roleData,
    });
    console.log(`  ✅ Role: ${roleData.name} (${roleData.slug})`);
  }

  // ─── 2. Create legacy user records ─────────────────────
  console.log("\n👤 Creating legacy user accounts...");

  const adminPassword = await hash("admin123", 12);
  const teacherPassword = await hash("teacher123", 12);
  const studentPassword = await hash("student123", 12);
  const parentPassword = await hash("parent123", 12);
  const accountantPassword = await hash("accountant123", 12);
  const librarianPassword = await hash("librarian123", 12);

  // Admin (level 1 = super-admin)
  await db.admin.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: {
      name: "Test Admin",
      email: "admin@school.com",
      password: adminPassword,
      level: "1",
      active_status: 1,
      authentication_key: AUTH_KEY,
      phone: "+233000000001",
      gender: "male",
    },
  });
  console.log("  ✅ Admin: admin@school.com / admin123 (auth key: ABCDE)");

  // Teacher
  await db.teacher.upsert({
    where: { email: "teacher@school.com" },
    update: {},
    create: {
      name: "Test Teacher",
      email: "teacher@school.com",
      password: teacherPassword,
      active_status: 1,
      authentication_key: AUTH_KEY,
      phone: "+233000000002",
      gender: "female",
      joining_date: new Date(),
    },
  });
  console.log("  ✅ Teacher: teacher@school.com / teacher123 (auth key: ABCDE)");

  // Student (use student_code as unique key since email is not unique in student table)
  const existingStudent = await db.student.findFirst({
    where: { student_code: "STU001" },
  });
  if (existingStudent) {
    await db.student.update({
      where: { student_id: existingStudent.student_id },
      data: {
        email: "student@school.com",
        password: studentPassword,
        authentication_key: AUTH_KEY,
        active_status: 1,
      },
    });
  } else {
    await db.student.create({
      data: {
        name: "Test Student",
        first_name: "Test",
        last_name: "Student",
        email: "student@school.com",
        username: "STU001",
        student_code: "STU001",
        password: studentPassword,
        active_status: 1,
        authentication_key: AUTH_KEY,
        phone: "+233000000003",
        sex: "male",
        admission_date: new Date(),
      },
    });
  }
  console.log("  ✅ Student: student@school.com / student123 (username: STU001, auth key: ABCDE)");

  // Parent
  await db.parent.upsert({
    where: { email: "parent@school.com" },
    update: {},
    create: {
      name: "Test Parent",
      email: "parent@school.com",
      password: parentPassword,
      active_status: 1,
      authentication_key: AUTH_KEY,
      phone: "+233000000004",
      guardian_gender: "male",
      father_name: "Test Parent Sr.",
      father_phone: "+233000000005",
      mother_name: "Test Mother",
      mother_phone: "+233000000006",
    },
  });
  console.log("  ✅ Parent: parent@school.com / parent123 (auth key: ABCDE)");

  // Accountant
  await db.accountant.upsert({
    where: { email: "accountant@school.com" },
    update: {},
    create: {
      name: "Test Accountant",
      email: "accountant@school.com",
      password: accountantPassword,
      active_status: 1,
      authentication_key: AUTH_KEY,
      phone: "+233000000007",
    },
  });
  console.log("  ✅ Accountant: accountant@school.com / accountant123 (auth key: ABCDE)");

  // Librarian
  await db.librarian.upsert({
    where: { email: "librarian@school.com" },
    update: {},
    create: {
      name: "Test Librarian",
      email: "librarian@school.com",
      password: librarianPassword,
      active_status: 1,
      authentication_key: AUTH_KEY,
      phone: "+233000000008",
    },
  });
  console.log("  ✅ Librarian: librarian@school.com / librarian123 (auth key: ABCDE)");

  // ─── 3. Create unified User table entries ──────────────
  console.log("\n🔐 Creating unified RBAC user entries...");

  const adminRole = await db.role.findUnique({ where: { slug: "super-admin" } });
  const teacherRole = await db.role.findUnique({ where: { slug: "teacher" } });
  const studentRole = await db.role.findUnique({ where: { slug: "student" } });
  const parentRole = await db.role.findUnique({ where: { slug: "parent" } });
  const accountantRole = await db.role.findUnique({ where: { slug: "accountant" } });
  const librarianRole = await db.role.findUnique({ where: { slug: "librarian" } });

  if (adminRole) {
    await db.user.upsert({
      where: { email: "admin@school.com" },
      update: { roleId: adminRole.id },
      create: {
        email: "admin@school.com",
        password: adminPassword,
        name: "Test Admin",
        phone: "+233000000001",
        active: true,
        roleId: adminRole.id,
      },
    });
    console.log("  ✅ User (RBAC): admin@school.com → super-admin");
  }

  if (teacherRole) {
    await db.user.upsert({
      where: { email: "teacher@school.com" },
      update: { roleId: teacherRole.id },
      create: {
        email: "teacher@school.com",
        password: teacherPassword,
        name: "Test Teacher",
        phone: "+233000000002",
        active: true,
        roleId: teacherRole.id,
      },
    });
    console.log("  ✅ User (RBAC): teacher@school.com → teacher");
  }

  if (studentRole) {
    await db.user.upsert({
      where: { email: "student@school.com" },
      update: { roleId: studentRole.id },
      create: {
        email: "student@school.com",
        password: studentPassword,
        name: "Test Student",
        phone: "+233000000003",
        active: true,
        roleId: studentRole.id,
      },
    });
    console.log("  ✅ User (RBAC): student@school.com → student");
  }

  if (parentRole) {
    await db.user.upsert({
      where: { email: "parent@school.com" },
      update: { roleId: parentRole.id },
      create: {
        email: "parent@school.com",
        password: parentPassword,
        name: "Test Parent",
        phone: "+233000000004",
        active: true,
        roleId: parentRole.id,
      },
    });
    console.log("  ✅ User (RBAC): parent@school.com → parent");
  }

  if (accountantRole) {
    await db.user.upsert({
      where: { email: "accountant@school.com" },
      update: { roleId: accountantRole.id },
      create: {
        email: "accountant@school.com",
        password: accountantPassword,
        name: "Test Accountant",
        phone: "+233000000007",
        active: true,
        roleId: accountantRole.id,
      },
    });
    console.log("  ✅ User (RBAC): accountant@school.com → accountant");
  }

  if (librarianRole) {
    await db.user.upsert({
      where: { email: "librarian@school.com" },
      update: { roleId: librarianRole.id },
      create: {
        email: "librarian@school.com",
        password: librarianPassword,
        name: "Test Librarian",
        phone: "+233000000008",
        active: true,
        roleId: librarianRole.id,
      },
    });
    console.log("  ✅ User (RBAC): librarian@school.com → librarian");
  }

  console.log("\n✨ Seeding complete!\n");
  console.log("─── Test Accounts ────────────────────────────");
  console.log("  Email              | Password        | Role        | Auth Key");
  console.log("  ───────────────────┼─────────────────┼─────────────┼─────────");
  console.log("  admin@school.com   | admin123        | Super Admin | ABCDE");
  console.log("  teacher@school.com | teacher123      | Teacher     | ABCDE");
  console.log("  student@school.com | student123      | Student     | ABCDE");
  console.log("  parent@school.com  | parent123       | Parent      | ABCDE");
  console.log("  accountant@school.com | accountant123 | Accountant | ABCDE");
  console.log("  librarian@school.com | librarian123  | Librarian   | ABCDE");
  console.log("─────────────────────────────────────────────────────");
  console.log("  Student can also login with username: STU001");
  console.log("─────────────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
