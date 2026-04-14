import { db } from './src/lib/db';

async function seed() {
  // Create classes
  const classes = await Promise.all([
    db.school_class.create({ data: { name: 'KG 1', name_numeric: 1, category: 'kg', digit: 'KG1', student_capacity: 30 } }),
    db.school_class.create({ data: { name: 'KG 2', name_numeric: 2, category: 'kg', digit: 'KG2', student_capacity: 30 } }),
    db.school_class.create({ data: { name: 'Basic 1', name_numeric: 3, category: 'basic', digit: 'B1', student_capacity: 35 } }),
    db.school_class.create({ data: { name: 'Basic 2', name_numeric: 4, category: 'basic', digit: 'B2', student_capacity: 35 } }),
    db.school_class.create({ data: { name: 'Basic 3', name_numeric: 5, category: 'basic', digit: 'B3', student_capacity: 35 } }),
    db.school_class.create({ data: { name: 'JHS 1', name_numeric: 6, category: 'jhs', digit: 'J1', student_capacity: 40 } }),
    db.school_class.create({ data: { name: 'JHS 2', name_numeric: 7, category: 'jhs', digit: 'J2', student_capacity: 40 } }),
    db.school_class.create({ data: { name: 'JHS 3', name_numeric: 8, category: 'jhs', digit: 'J3', student_capacity: 40 } }),
  ]);

  // Create parents
  const parents = await Promise.all([
    db.parent.create({ data: { name: 'Kwame Asante', phone: '0201234567', email: 'kwame@email.com', profession: 'Teacher' } }),
    db.parent.create({ data: { name: 'Ama Mensah', phone: '0209876543', email: 'ama@email.com', profession: 'Nurse' } }),
    db.parent.create({ data: { name: 'Kofi Osei', phone: '0205551234', email: 'kofi@email.com', profession: 'Engineer' } }),
    db.parent.create({ data: { name: 'Abena Boateng', phone: '0206667890', email: 'abena@email.com', profession: 'Business Owner' } }),
    db.parent.create({ data: { name: 'Yaw Adjei', phone: '0207772345', email: 'yaw@email.com', profession: 'Doctor' } }),
  ]);

  // Create students
  const studentNames = [
    { first: 'Nana', last: 'Asante', code: 'STD001' },
    { first: 'Akosua', last: 'Mensah', code: 'STD002' },
    { first: 'Kwabena', last: 'Osei', code: 'STD003' },
    { first: 'Afia', last: 'Boateng', code: 'STD004' },
    { first: 'Kofi', last: 'Adjei', code: 'STD005' },
    { first: 'Ama', last: 'Darko', code: 'STD006' },
    { first: 'Yaw', last: 'Amponsah', code: 'STD007' },
    { first: 'Efua', last: 'Owusu', code: 'STD008' },
    { first: 'Kwame', last: 'Agyeman', code: 'STD009' },
    { first: 'Adwoa', last: 'Mills', code: 'STD010' },
    { first: 'Kojo', last: 'Bonsu', code: 'STD011' },
    { first: 'Yaa', last: 'Frimpong', code: 'STD012' },
  ];

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const s = studentNames[i];
    const par = parents[i % parents.length];
    students.push(await db.student.create({
      data: {
        name: `${s.first} ${s.last}`,
        first_name: s.first,
        last_name: s.last,
        student_code: s.code,
        parent_id: par.parent_id,
        sex: i % 2 === 0 ? 'Male' : 'Female',
        username: s.code.toLowerCase(),
        password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu6GK',
        email: `${s.code.toLowerCase()}@school.com`,
        active_status: 1,
      }
    }));
  }

  // Create bill categories
  const categories = await Promise.all([
    db.bill_category.create({ data: { bill_category_name: 'Tuition Fees' } }),
    db.bill_category.create({ data: { bill_category_name: 'Feeding Fees' } }),
    db.bill_category.create({ data: { bill_category_name: 'Transport' } }),
    db.bill_category.create({ data: { bill_category_name: 'Uniform & Materials' } }),
    db.bill_category.create({ data: { bill_category_name: 'Extracurricular' } }),
  ]);

  // Create bill items
  await Promise.all([
    db.bill_item.create({ data: { title: 'Term Tuition - KG', description: 'Tuition fee for kindergarten', bill_category_id: categories[0].bill_category_id, amount: 1500 } }),
    db.bill_item.create({ data: { title: 'Term Tuition - Basic', description: 'Tuition fee for basic school', bill_category_id: categories[0].bill_category_id, amount: 2000 } }),
    db.bill_item.create({ data: { title: 'Term Tuition - JHS', description: 'Tuition fee for junior high', bill_category_id: categories[0].bill_category_id, amount: 2500 } }),
    db.bill_item.create({ data: { title: 'Feeding Fee - Full Term', description: 'Feeding for the entire term', bill_category_id: categories[1].bill_category_id, amount: 600 } }),
    db.bill_item.create({ data: { title: 'Transport - Full Term', description: 'Transport service for the term', bill_category_id: categories[2].bill_category_id, amount: 400 } }),
    db.bill_item.create({ data: { title: 'School Uniform', description: 'Complete school uniform set', bill_category_id: categories[3].bill_category_id, amount: 200 } }),
    db.bill_item.create({ data: { title: 'Textbooks & Materials', description: 'Required textbooks and stationery', bill_category_id: categories[3].bill_category_id, amount: 150 } }),
    db.bill_item.create({ data: { title: 'ICT Lab Fee', description: 'Computer lab access', bill_category_id: categories[4].bill_category_id, amount: 100 } }),
  ]);

  // Create invoices
  const year = '2026';
  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const statuses = ['paid', 'partial', 'unpaid', 'overdue'];

  let invoiceCount = 0;
  for (const student of students) {
    const cls = classes[students.indexOf(student) % classes.length];
    const numInvoices = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numInvoices; j++) {
      const term = terms[j % 3];
      const amount = 1000 + Math.floor(Math.random() * 3000);
      const statusIdx = Math.floor(Math.random() * 4);
      const status = statuses[statusIdx];
      const amountPaid = status === 'paid' ? amount : status === 'partial' ? Math.floor(amount * (0.3 + Math.random() * 0.5)) : 0;
      const due = amount - amountPaid;

      invoiceCount++;
      await db.invoice.create({
        data: {
          student_id: student.student_id,
          title: `${term} Fees - ${year}`,
          description: `School fees for ${term} ${year}`,
          amount,
          amount_paid: amountPaid,
          due,
          discount: status === 'paid' ? Math.floor(amount * 0.05) : 0,
          creation_timestamp: new Date(2026, j * 3, 1 + Math.floor(Math.random() * 15)),
          payment_timestamp: status === 'paid' ? new Date(2026, j * 3, 10 + Math.floor(Math.random() * 20)) : null,
          method: status === 'paid' ? 'cash' : '',
          status,
          year,
          term,
          class_id: cls.class_id,
          invoice_code: `INV-${year.replace('20', '')}-${String(invoiceCount).padStart(4, '0')}`,
          class_name: cls.name,
        }
      });
    }
  }

  // Create payments
  const invoices = await db.invoice.findMany({ where: { amount_paid: { gt: 0 } } });
  for (const inv of invoices) {
    await db.payment.create({
      data: {
        student_id: inv.student_id,
        invoice_id: inv.invoice_id,
        invoice_code: inv.invoice_code,
        receipt_code: `RCP-${String(inv.invoice_id).padStart(5, '0')}`,
        title: inv.title,
        amount: inv.amount_paid,
        due: inv.due,
        payment_type: 'invoice',
        payment_method: ['cash', 'mobile_money', 'bank_transfer', 'cheque'][Math.floor(Math.random() * 4)],
        year: inv.year,
        term: inv.term,
        timestamp: inv.payment_timestamp,
        approval_status: 'approved',
      }
    });
  }

  // Create daily fee rates
  for (const cls of classes) {
    await db.daily_fee_rates.create({
      data: {
        class_id: cls.class_id,
        feeding_rate: 5 + Math.floor(Math.random() * 8),
        breakfast_rate: 3 + Math.floor(Math.random() * 4),
        classes_rate: 2 + Math.floor(Math.random() * 3),
        water_rate: 1 + Math.floor(Math.random() * 2),
        year: '2026',
        term: 'Term 1',
      }
    });
  }

  // Create daily fee wallets
  for (const student of students.slice(0, 8)) {
    await db.daily_fee_wallet.create({
      data: {
        student_id: student.student_id,
        feeding_balance: -(Math.floor(Math.random() * 200)),
        breakfast_balance: -(Math.floor(Math.random() * 100)),
        classes_balance: -(Math.floor(Math.random() * 80)),
        water_balance: -(Math.floor(Math.random() * 50)),
        transport_balance: -(Math.floor(Math.random() * 150)),
      }
    });
  }

  // Create daily fee transactions
  const wallets = await db.daily_fee_wallet.findMany();
  for (const wallet of wallets) {
    const numTx = 1 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numTx; i++) {
      const feeding = Math.random() > 0.3 ? 5 + Math.floor(Math.random() * 10) : 0;
      const breakfast = Math.random() > 0.5 ? 3 + Math.floor(Math.random() * 5) : 0;
      const cls = Math.random() > 0.6 ? 2 + Math.floor(Math.random() * 4) : 0;
      const water = Math.random() > 0.7 ? 1 + Math.floor(Math.random() * 2) : 0;
      const transport = Math.random() > 0.8 ? 10 + Math.floor(Math.random() * 15) : 0;
      const total = feeding + breakfast + cls + water + transport;

      if (total > 0) {
        await db.daily_fee_transactions.create({
          data: {
            transaction_code: `DFT-${String(wallet.student_id).padStart(3, '0')}-${String(i + 1).padStart(3, '0')}`,
            student_id: wallet.student_id,
            payment_date: new Date(2026, 0, 1 + Math.floor(Math.random() * 90)),
            feeding_amount: feeding,
            breakfast_amount: breakfast,
            classes_amount: cls,
            water_amount: water,
            transport_amount: transport,
            total_amount: total,
            payment_type: 'daily',
            payment_method: ['cash', 'mobile_money'][Math.floor(Math.random() * 2)],
            collected_by: 'System Admin',
            year: '2026',
            term: 'Term 1',
          }
        });
      }
    }
  }

  // Create expense categories
  const expCats = await Promise.all([
    db.expense_category.create({ data: { expense_category_name: 'Utilities' } }),
    db.expense_category.create({ data: { expense_category_name: 'Salaries' } }),
    db.expense_category.create({ data: { expense_category_name: 'Maintenance' } }),
    db.expense_category.create({ data: { expense_category_name: 'Supplies' } }),
    db.expense_category.create({ data: { expense_category_name: 'Events' } }),
  ]);

  // Create expenses
  const expenseItems = [
    { title: 'Electricity Bill', desc: 'Monthly electricity', cat: 0, amount: 800, method: 'bank_transfer', status: 'approved' },
    { title: 'Water Bill', desc: 'Monthly water', cat: 0, amount: 200, method: 'bank_transfer', status: 'approved' },
    { title: 'Teacher Salaries - Jan', desc: 'January salaries', cat: 1, amount: 15000, method: 'bank_transfer', status: 'approved' },
    { title: 'Teacher Salaries - Feb', desc: 'February salaries', cat: 1, amount: 15000, method: 'bank_transfer', status: 'approved' },
    { title: 'Building Repairs', desc: 'Roof repairs', cat: 2, amount: 2500, method: 'cash', status: 'approved' },
    { title: 'Classroom Supplies', desc: 'Chalk, markers, etc.', cat: 3, amount: 350, method: 'cash', status: 'approved' },
    { title: 'Printer Ink & Paper', desc: 'Office supplies', cat: 3, amount: 150, method: 'cash', status: 'pending' },
    { title: 'Sports Day', desc: 'Annual sports event', cat: 4, amount: 1200, method: 'cash', status: 'approved' },
    { title: 'Internet Service', desc: 'Monthly internet', cat: 0, amount: 300, method: 'mobile_money', status: 'approved' },
    { title: 'Security Services', desc: 'Monthly security', cat: 2, amount: 2000, method: 'bank_transfer', status: 'approved' },
  ];

  for (const exp of expenseItems) {
    await db.expense.create({
      data: {
        title: exp.title,
        description: exp.desc,
        category_id: expCats[exp.cat].expense_category_id,
        amount: exp.amount,
        expense_date: new Date(2026, Math.floor(Math.random() * 4), 1 + Math.floor(Math.random() * 25)),
        payment_method: exp.method,
        status: exp.status,
      }
    });
  }

  console.log('Seed completed successfully!');
  console.log(`Created ${classes.length} classes, ${students.length} students, ${invoiceCount} invoices`);
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect());
