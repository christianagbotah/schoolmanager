import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log("🌱 Seeding database...\n");

  const hashedAdminPassword = await hashPassword("admin123");
  const hashedTeacherPassword = await hashPassword("teacher123");
  const hashedStudentPassword = await hashPassword("student123");
  const hashedParentPassword = await hashPassword("parent123");
  const hashedAccountantPassword = await hashPassword("accountant123");
  const hashedLibrarianPassword = await hashPassword("librarian123");

  // ============================
  // Create Departments & Designations
  // ============================
  console.log("🏢 Creating departments and designations...");

  const dept1 = await prisma.department.upsert({
    where: { id: 1 },
    update: {},
    create: { dep_name: "Science & Mathematics" },
  });

  const dept2 = await prisma.department.upsert({
    where: { id: 2 },
    update: {},
    create: { dep_name: "Languages & Arts" },
  });

  const dept3 = await prisma.department.upsert({
    where: { id: 3 },
    update: {},
    create: { dep_name: "Social Sciences" },
  });

  const dept4 = await prisma.department.upsert({
    where: { id: 4 },
    update: {},
    create: { dep_name: "Early Childhood" },
  });

  const des1 = await prisma.designation.upsert({
    where: { id: 1 },
    update: {},
    create: { des_name: "Head Teacher" },
  });

  const des2 = await prisma.designation.upsert({
    where: { id: 2 },
    update: {},
    create: { des_name: "Senior Teacher" },
  });

  const des3 = await prisma.designation.upsert({
    where: { id: 3 },
    update: {},
    create: { des_name: "Teacher" },
  });

  const des4 = await prisma.designation.upsert({
    where: { id: 4 },
    update: {},
    create: { des_name: "Teaching Assistant" },
  });

  console.log("  ✅ Created 4 departments and 4 designations");

  // ============================
  // Create / Upsert Users (6 roles)
  // ============================
  console.log("📋 Creating users...");

  // Admin users
  const admin1 = await prisma.admin.upsert({
    where: { email: "admin@school.com" },
    update: { password: hashedAdminPassword, name: "System Administrator", active_status: 1, authentication_key: "ABCDE" },
    create: {
      email: "admin@school.com",
      password: hashedAdminPassword,
      name: "System Administrator",
      phone: "+233-XXX-000-001",
      active_status: 1,
      authentication_key: "ABCDE",
    },
  });

  await prisma.admin.upsert({
    where: { email: "superadmin@school.com" },
    update: { password: hashedAdminPassword, authentication_key: "ABCDE" },
    create: {
      email: "superadmin@school.com",
      password: hashedAdminPassword,
      name: "Super Admin",
      phone: "+233-XXX-000-002",
      active_status: 1,
      authentication_key: "ABCDE",
    },
  });

  // Teacher users
  const teacher1 = await prisma.teacher.upsert({
    where: { email: "teacher@school.com" },
    update: { password: hashedTeacherPassword, name: "Ama Mensah", active_status: 1, department_id: dept1.id, designation_id: des1.id, authentication_key: "ABCDE" },
    create: {
      email: "teacher@school.com",
      password: hashedTeacherPassword,
      name: "Ama Mensah",
      phone: "+233-XXX-100-001",
      blood_group: "A+",
      gender: "Female",
      active_status: 1,
      department_id: dept1.id,
      designation_id: des1.id,
      joining_date: new Date("2020-01-15"),
      address: "12 University Road, Accra",
      birthday: new Date("1985-06-20"),
      authentication_key: "ABCDE",
    },
  });

  const teacher2 = await prisma.teacher.upsert({
    where: { email: "kofi.asante@school.com" },
    update: { password: hashedTeacherPassword, department_id: dept2.id, designation_id: des2.id, authentication_key: "ABCDE" },
    create: {
      email: "kofi.asante@school.com",
      password: hashedTeacherPassword,
      name: "Kofi Asante",
      phone: "+233-XXX-100-002",
      blood_group: "B+",
      gender: "Male",
      active_status: 1,
      department_id: dept2.id,
      designation_id: des2.id,
      joining_date: new Date("2019-09-01"),
      address: "45 Main Street, Kumasi",
      birthday: new Date("1988-03-12"),
      authentication_key: "ABCDE",
    },
  });

  const teacher3 = await prisma.teacher.upsert({
    where: { email: "abena.oku@school.com" },
    update: { password: hashedTeacherPassword, department_id: dept4.id, designation_id: des3.id, authentication_key: "ABCDE" },
    create: {
      email: "abena.oku@school.com",
      password: hashedTeacherPassword,
      name: "Abena Oku",
      phone: "+233-XXX-100-003",
      blood_group: "O+",
      gender: "Female",
      active_status: 1,
      department_id: dept4.id,
      designation_id: des3.id,
      joining_date: new Date("2021-01-10"),
      address: "78 School Lane, Tema",
      birthday: new Date("1992-11-05"),
      authentication_key: "ABCDE",
    },
  });

  // Student users - upsert by username to handle unique student_code
  const student1 = await prisma.student.upsert({
    where: { username: "student" },
    update: { password: hashedStudentPassword, name: "Kwame Boateng", active_status: 1, email: "student@school.com", authentication_key: "ABCDE" },
    create: {
      email: "student@school.com",
      username: "student",
      student_code: "STU-DEMO-001",
      password: hashedStudentPassword,
      name: "Kwame Boateng",
      phone: "+233-XXX-200-001",
      sex: "Male",
      birthday: new Date("2015-03-15"),
      blood_group: "O+",
      active_status: 1,
      authentication_key: "ABCDE",
    },
  });

  const studentNames = [
    { name: "Efua Darko", username: "efua.darko", sex: "Female", dob: "2016-01-20", blood: "A+" },
    { name: "Yaw Adjei", username: "yaw.adjei", sex: "Male", dob: "2015-07-08", blood: "B+" },
    { name: "Akosua Frimpong", username: "akosua.frimpong", sex: "Female", dob: "2014-11-25", blood: "AB+" },
    { name: "Kwesi Poku", username: "kwesi.poku", sex: "Male", dob: "2013-05-12", blood: "O-" },
    { name: "Ama Serwaa", username: "ama.serwaa", sex: "Female", dob: "2016-09-03", blood: "A-" },
    { name: "Kofi Annan", username: "kofi.annan", sex: "Male", dob: "2015-12-17", blood: "B-" },
    { name: "Abigail Mensah", username: "abigail.mensah", sex: "Female", dob: "2014-04-22", blood: "O+" },
    { name: "Emmanuel Osei", username: "emmanuel.osei", sex: "Male", dob: "2013-08-30", blood: "AB-" },
    { name: "Grace Amponsah", username: "grace.amponsah", sex: "Female", dob: "2016-06-14", blood: "A+" },
  ];

  const students: Array<{ id: number; name: string; classId: string }> = [];
  for (let i = 0; i < studentNames.length; i++) {
    const s = await prisma.student.upsert({
      where: { username: studentNames[i].username },
      update: { password: hashedStudentPassword },
      create: {
        email: `${studentNames[i].username}@student.school.com`,
        username: studentNames[i].username,
        student_code: `STU-${String(i + 2).padStart(3, "0")}`,
        password: hashedStudentPassword,
        name: studentNames[i].name,
        sex: studentNames[i].sex,
        birthday: new Date(studentNames[i].dob),
        blood_group: studentNames[i].blood,
        active_status: 1,
      },
    });
    students.push({ id: s.student_id, name: s.name, classId: "" });
  }

  // Parent users
  const parent1 = await prisma.parent.upsert({
    where: { email: "parent@school.com" },
    update: { password: hashedParentPassword, name: "Mr. Boateng Sr.", active_status: 1, authentication_key: "ABCDE" },
    create: {
      email: "parent@school.com",
      password: hashedParentPassword,
      name: "Mr. Boateng Sr.",
      phone: "+233-XXX-300-001",
      profession: "Businessman",
      guardian_gender: "Male",
      active_status: 1,
      authentication_key: "ABCDE",
    },
  });

  const parent2 = await prisma.parent.upsert({
    where: { email: "mrs.darko@school.com" },
    update: { password: hashedParentPassword, authentication_key: "ABCDE" },
    create: {
      email: "mrs.darko@school.com",
      password: hashedParentPassword,
      name: "Mrs. Felicia Darko",
      phone: "+233-XXX-300-002",
      profession: "Nurse",
      guardian_gender: "Female",
      active_status: 1,
      authentication_key: "ABCDE",
    },
  });

  // Accountant
  const accountant1 = await prisma.accountant.upsert({
    where: { email: "accountant@school.com" },
    update: { password: hashedAccountantPassword, name: "Ebenezer Tetteh", active_status: 1, authentication_key: "ABCDE" },
    create: {
      email: "accountant@school.com",
      password: hashedAccountantPassword,
      name: "Ebenezer Tetteh",
      phone: "+233-XXX-400-001",
      active_status: 1,
      authentication_key: "ABCDE",
    },
  });

  // Librarian
  const librarian1 = await prisma.librarian.upsert({
    where: { email: "librarian@school.com" },
    update: { password: hashedLibrarianPassword, name: "Comfort Agyeman", active_status: 1, authentication_key: "ABCDE" },
    create: {
      email: "librarian@school.com",
      password: hashedLibrarianPassword,
      name: "Comfort Agyeman",
      phone: "+233-XXX-500-001",
      active_status: 1,
      authentication_key: "ABCDE",
    },
  });

  console.log("  ✅ Created 2 admins, 3 teachers, 10 students, 2 parents, 1 accountant, 1 librarian");
  console.log("\n📋 Demo Accounts:");
  console.log("  Role         Email                    Password         Auth Key");
  console.log("  ──────────   ─────────────────────    ────────────    ────────");
  console.log("  Super Admin  superadmin@school.com     admin123         ABCDE");
  console.log("  Admin        admin@school.com          admin123         ABCDE");
  console.log("  Teacher      teacher@school.com        teacher123       ABCDE");
  console.log("  Student      student@school.com        student123       ABCDE");
  console.log("  Parent       parent@school.com         parent123        ABCDE");
  console.log("  Accountant   accountant@school.com     accountant123    ABCDE");
  console.log("  Librarian    librarian@school.com      librarian123     ABCDE\n");

  // ============================
  // Create Classes
  // ============================
  console.log("📚 Ensuring classes exist...");

  const classNames = ["Creche A", "Nursery A", "KG 1A", "Basic 1A", "JHS 1A"];
  let classes = await prisma.school_class.findMany();

  if (classes.length === 0) {
    const classData = [
      { name: "Creche A", name_numeric: 0, student_capacity: 25, category: "creche", digit: "01", note: "Creche class A", teacher_id: teacher3.teacher_id },
      { name: "Creche B", name_numeric: 0, student_capacity: 25, category: "creche", digit: "02", note: "Creche class B", teacher_id: null },
      { name: "Nursery A", name_numeric: 1, student_capacity: 30, category: "nursery", digit: "03", note: "Nursery class A", teacher_id: teacher3.teacher_id },
      { name: "KG 1A", name_numeric: 2, student_capacity: 30, category: "kg", digit: "04", note: "Kindergarten 1 class A", teacher_id: teacher2.teacher_id },
      { name: "KG 2A", name_numeric: 3, student_capacity: 30, category: "kg", digit: "05", note: "Kindergarten 2 class A", teacher_id: teacher2.teacher_id },
      { name: "Basic 1A", name_numeric: 4, student_capacity: 40, category: "basic", digit: "06", note: "Basic 1 class A", teacher_id: teacher1.teacher_id },
      { name: "Basic 2A", name_numeric: 5, student_capacity: 40, category: "basic", digit: "07", note: "Basic 2 class A", teacher_id: teacher1.teacher_id },
      { name: "Basic 3A", name_numeric: 6, student_capacity: 40, category: "basic", digit: "08", note: "Basic 3 class A", teacher_id: teacher2.teacher_id },
      { name: "JHS 1A", name_numeric: 7, student_capacity: 45, category: "jhs", digit: "09", note: "Junior High School 1 class A", teacher_id: teacher1.teacher_id },
      { name: "JHS 2A", name_numeric: 8, student_capacity: 45, category: "jhs", digit: "10", note: "Junior High School 2 class A", teacher_id: teacher1.teacher_id },
    ];
    for (const c of classData) {
      const cls = await prisma.school_class.create({ data: c });
      classes.push(cls);
    }
    console.log(`  ✅ Created ${classes.length} classes`);
  } else {
    console.log(`  ℹ️ Classes already exist (${classes.length} found)`);
  }

  // ============================
  // Create Subjects
  // ============================
  console.log("📖 Ensuring subjects exist...");

  let subjects = await prisma.subject.findMany();

  if (subjects.length === 0) {
    const subjectData = [
      { name: "English Language", class_id: classes.length > 0 ? classes[5].class_id : undefined, teacher_id: teacher1.teacher_id, year: "2024-2025" },
      { name: "Mathematics", class_id: classes.length > 0 ? classes[5].class_id : undefined, teacher_id: teacher1.teacher_id, year: "2024-2025" },
      { name: "Science", class_id: classes.length > 0 ? classes[5].class_id : undefined, teacher_id: teacher1.teacher_id, year: "2024-2025" },
      { name: "Social Studies", class_id: classes.length > 0 ? classes[5].class_id : undefined, teacher_id: teacher2.teacher_id, year: "2024-2025" },
      { name: "Ghanaian Language", class_id: classes.length > 0 ? classes[3].class_id : undefined, teacher_id: teacher2.teacher_id, year: "2024-2025" },
      { name: "Religious & Moral Education", class_id: classes.length > 0 ? classes[3].class_id : undefined, teacher_id: teacher3.teacher_id, year: "2024-2025" },
      { name: "ICT", class_id: classes.length > 0 ? classes[8].class_id : undefined, teacher_id: teacher1.teacher_id, year: "2024-2025" },
      { name: "Creative Arts", class_id: classes.length > 0 ? classes[3].class_id : undefined, teacher_id: teacher3.teacher_id, year: "2024-2025" },
      { name: "French", class_id: classes.length > 0 ? classes[8].class_id : undefined, teacher_id: teacher2.teacher_id, year: "2024-2025" },
      { name: "Physical Education", class_id: classes.length > 0 ? classes[5].class_id : undefined, teacher_id: teacher1.teacher_id, year: "2024-2025" },
      { name: "Reading & Phonics", class_id: classes.length > 0 ? classes[0].class_id : undefined, teacher_id: teacher3.teacher_id, year: "2024-2025" },
      { name: "Numeracy", class_id: classes.length > 0 ? classes[0].class_id : undefined, teacher_id: teacher3.teacher_id, year: "2024-2025" },
      { name: "Rhymes & Songs", class_id: classes.length > 0 ? classes[2].class_id : undefined, teacher_id: teacher3.teacher_id, year: "2024-2025" },
      { name: "Handwriting", class_id: classes.length > 0 ? classes[4].class_id : undefined, teacher_id: teacher2.teacher_id, year: "2024-2025" },
    ];
    for (const s of subjectData) {
      const subj = await prisma.subject.create({ data: s });
      subjects.push(subj);
    }
    console.log(`  ✅ Created ${subjects.length} subjects`);
  } else {
    console.log(`  ℹ️ Subjects already exist (${subjects.length} found)`);
  }

  // ============================
  // Ensure sections exist (needed for enrollment)
  // ============================
  console.log("🏫 Ensuring sections exist...");

  let sections = await prisma.section.findMany();
  if (sections.length === 0 && classes.length > 0) {
    for (const cls of classes) {
      const sec = await prisma.section.create({
        data: {
          name: "A",
          numeric_name: 0,
          class_id: cls.class_id,
          teacher_id: teacher1.teacher_id,
        },
      });
      sections.push(sec);
    }
    console.log(`  ✅ Created ${sections.length} sections`);
  } else {
    console.log(`  ℹ️ Sections already exist (${sections.length} found)`);
  }

  // ============================
  // Enroll Students
  // ============================
  if (classes.length > 0 && sections.length > 0) {
    const existingEnrolls = await prisma.enroll.findMany({
      where: { year: "2024-2025" },
    });
    if (existingEnrolls.length === 0) {
      console.log("🎓 Enrolling students...");
      const classIds = classes.map((c) => c.class_id);
      const sectionIds = sections.map((s) => s.section_id);
      const assignments = [0, 1, 2, 2, 3, 3, 4, 4, 4, 4];

      for (let i = 0; i < students.length; i++) {
        const classIndex = assignments[i] % classIds.length;
        students[i].classId = String(classIds[classIndex]);

        await prisma.enroll.create({
          data: {
            student_id: students[i].id,
            class_id: classIds[classIndex],
            section_id: sectionIds[classIndex],
            year: "2024-2025",
            term: "Term 3",
            roll: String(i + 1).padStart(3, "0"),
          },
        });
      }

      await prisma.enroll.create({
        data: {
          student_id: student1.student_id,
          class_id: classIds[Math.min(3, classIds.length - 1)],
          section_id: sectionIds[Math.min(3, sectionIds.length - 1)],
          year: "2024-2025",
          term: "Term 3",
          roll: "011",
        },
      });
      console.log("  ✅ Enrolled students in classes");
    }
  }

  // ============================
  // Link students to parents
  // ============================
  console.log("🔗 Linking students to parents...");
  await prisma.student.update({
    where: { student_id: student1.student_id },
    data: { parent_id: parent1.parent_id },
  });
  if (students[0]) {
    await prisma.student.update({
      where: { student_id: students[0].id },
      data: { parent_id: parent1.parent_id },
    });
  }
  if (students[3]) {
    await prisma.student.update({
      where: { student_id: students[3].id },
      data: { parent_id: parent1.parent_id },
    });
  }
  if (students[1]) {
    await prisma.student.update({
      where: { student_id: students[1].id },
      data: { parent_id: parent2.parent_id },
    });
  }
  if (students[4]) {
    await prisma.student.update({
      where: { student_id: students[4].id },
      data: { parent_id: parent2.parent_id },
    });
  }
  console.log("  ✅ Linked students to parents");

  console.log("\n🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
