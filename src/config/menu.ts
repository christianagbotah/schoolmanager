import {
  LayoutDashboard,
  ScanBarcode,
  UserCog,
  GraduationCap,
  UserPlus,
  Users,
  ClipboardList,
  ListChecks,
  ArrowUpCircle,
  FileText,
  CreditCard,
  BookOpen,
  Layers,
  BookMarked,
  Calendar,
  FileClock,
  PenLine,
  Table2,
  Trophy,
  Globe,
  DollarSign,
  Receipt,
  Banknote,
  PiggyBank,
  Percent,
  TrendingUp,
  TrendingDown,
  HandCoins,
  Scale,
  Megaphone,
  MessageSquare,
  Smartphone,
  BellRing,
  Settings,
  Shield,
  Mail,
  Bus,
  Package,
  BedDouble,
  Award,
  Star,
  BarChart3,
  CheckSquare,
  Library as LibraryIcon,
  BookCheck,
  Palette,
  User,
  Menu,
  Database,
  PieChart,
  Wallet,
  CalendarDays,
  LineChart,
  Target,
  Lightbulb,
  Calculator,
  FileSpreadsheet,
} from "lucide-react";
import type { UserRole } from "@/lib/auth";

// ─── Types ──────────────────────────────────────────────────
export interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  permission?: string | null;
  children?: MenuItem[];
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

// ─── Full Admin Menu (CI3-matching, with permissions) ───────
const adminMenus: MenuSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
      { label: "Barcode Scanner", href: "/admin/barcode", icon: ScanBarcode, permission: "can_use_barcode_scanner" },
    ],
  },
  {
    title: "User Management",
    items: [
      { label: "Administrators", href: "/admin/admins", icon: UserCog, permission: "can_view_admins_list" },
      {
        label: "Students", href: "/admin/students", icon: GraduationCap, permission: "can_view_students_list",
        children: [
          { label: "Admit Student", href: "/admin/students/new", icon: UserPlus, permission: "can_admit_students" },
          { label: "Bulk Upload", href: "/admin/students/bulk", icon: Users, permission: "can_admit_students" },
          { label: "Attendance", href: "/attendance", icon: ClipboardList, permission: "can_manage_attendance" },
          { label: "Lists by Class", href: "/admin/students/lists", icon: ListChecks, permission: "can_view_students_list" },
          { label: "Special Diet", href: "/admin/students/special-diet", icon: FileClock, permission: "can_view_students_list" },
          { label: "Muted Students", href: "/admin/students/muted", icon: User, permission: "can_edit_students" },
          { label: "Alumni", href: "/admin/students/alumni", icon: GraduationCap, permission: "can_view_students_list" },
          { label: "Promotion", href: "/admin/students/promotion", icon: ArrowUpCircle, permission: "can_edit_students" },
          { label: "Marksheets", href: "/admin/students/marksheets", icon: FileText, permission: "can_view_marks" },
          { label: "ID Cards", href: "/admin/students/id-cards", icon: CreditCard, permission: "can_view_students_list" },
        ],
      },
      { label: "Teachers", href: "/admin/teachers", icon: User, permission: "can_view_teachers_list" },
      { label: "Parents", href: "/admin/parents", icon: Users, permission: "can_view_parents_list" },
      { label: "Librarians", href: "/admin/librarians", icon: LibraryIcon, permission: "can_manage_books" },
    ],
  },
  {
    title: "Academics",
    items: [
      { label: "Classes", href: "/admin/classes", icon: BookOpen, permission: "can_manage_classes",
        children: [
          { label: "Manage Classes", href: "/admin/classes", icon: BookOpen, permission: "can_manage_classes" },
          { label: "Sections", href: "/admin/classes/sections", icon: Layers, permission: "can_manage_sections" },
          { label: "Syllabus", href: "/admin/classes/syllabus", icon: BookMarked, permission: "can_manage_classes" },
        ],
      },
      { label: "Subjects", href: "/admin/subjects", icon: Globe, permission: "can_manage_subjects" },
      { label: "Timetable", href: "/routine", icon: Calendar, permission: "can_manage_class_routine" },
      { label: "Study Material", href: "/admin/study-material", icon: FileClock, permission: "can_manage_subjects" },
      {
        label: "Examination", href: "/admin/exams", icon: FileText, permission: "can_manage_exams",
        children: [
          { label: "Exam Dashboard", href: "/admin/exams", icon: LayoutDashboard, permission: "can_manage_exams" },
          { label: "Exam List", href: "/admin/exams/list", icon: ListChecks, permission: "can_manage_exams" },
          { label: "Grades (Basic/JHS)", href: "/admin/grades", icon: Star, permission: "can_manage_grades" },
          { label: "Grades (Creche/Nursery)", href: "/admin/grades/creche", icon: Award, permission: "can_manage_grades" },
          { label: "Manage Marks", href: "/admin/exams/marks", icon: PenLine, permission: "can_enter_marks" },
          { label: "SMS/Email Marks", href: "/admin/exams/sms", icon: Smartphone, permission: "can_send_messages" },
          { label: "Question Papers", href: "/admin/exams/question-papers", icon: FileText, permission: "can_manage_exams" },
          { label: "Tabulation", href: "/admin/exams/tabulation", icon: Table2, permission: "can_view_broadsheet" },
          { label: "Weekly Report", href: "/admin/reports/weekly", icon: BarChart3, permission: "can_view_academic_reports" },
          { label: "Annual Report", href: "/admin/reports/annual", icon: PieChart, permission: "can_view_academic_reports" },
          { label: "Termly Report", href: "/admin/reports/termly", icon: Target, permission: "can_view_academic_reports" },
          { label: "Cumulative Report", href: "/admin/reports/cumulative", icon: TrendingUp, permission: "can_view_academic_reports" },
          { label: "Create Online Exam", href: "/admin/exams/online/create", icon: Trophy, permission: "can_manage_exams" },
          { label: "Manage Online Exams", href: "/admin/exams/online/manage", icon: ListChecks, permission: "can_manage_exams" },
          { label: "Assessment Analytics", href: "/admin/assessment-analytics", icon: LineChart, permission: "can_view_academic_reports" },
          { label: "Portfolio / SBA", href: "/admin/portfolio", icon: Trophy, permission: "can_view_academic_reports" },
        ],
      },
    ],
  },
  {
    title: "Financial",
    items: [
      {
        label: "Daily Fees", href: "/admin/daily-fees", icon: DollarSign, permission: "can_receive_daily_fees",
        children: [
          { label: "Cashier Dashboard", href: "/admin/daily-fees/cashier", icon: LayoutDashboard, permission: "can_receive_daily_fees" },
          { label: "Collection Portal", href: "/admin/daily-fees/collection", icon: HandCoins, permission: "can_receive_daily_fees" },
          { label: "Collections", href: "/admin/daily-fees/collections", icon: Receipt, permission: "can_receive_daily_fees" },
          { label: "Daily Summary", href: "/admin/daily-fees/summary", icon: BarChart3, permission: "can_view_daily_fee_reports" },
          { label: "Handover", href: "/admin/daily-fees/handover", icon: HandCoins, permission: "can_receive_daily_fees" },
          { label: "Fee Rates", href: "/admin/daily-fees/rates", icon: Settings, permission: "can_manage_fee_settings", adminOnly: true },
          { label: "Permissions", href: "/admin/daily-fees/permissions", icon: Shield, permission: "can_manage_fee_settings", adminOnly: true },
          { label: "Statistics", href: "/admin/daily-fees/statistics", icon: TrendingUp, permission: "can_view_daily_fee_reports" },
          { label: "Print Receipts", href: "/admin/receipts/print", icon: CheckSquare, permission: "can_view_invoices" },
        ],
      },
      { label: "Fee Structures", href: "/admin/fee-structures", icon: FileSpreadsheet, permission: "can_bill_students" },
      { label: "Payment Plans", href: "/admin/payment-plans", icon: Wallet, permission: "can_bill_students" },
      { label: "Auto Billing", href: "/admin/auto-billing", icon: Calculator, permission: "can_bill_students" },
      { label: "Student Billing", href: "/admin/invoices", icon: Receipt, permission: "can_bill_students" },
      {
        label: "Credits", href: "/admin/credits", icon: Banknote, permission: "can_receive_payment",
        children: [
          { label: "Manage Credits", href: "/admin/credits", icon: Banknote, permission: "can_receive_payment" },
          { label: "Credit Statistics", href: "/admin/credits/statistics", icon: BarChart3, permission: "can_view_financial_reports" },
        ],
      },
      {
        label: "Discounts", href: "/admin/discounts", icon: Percent, permission: "can_manage_discounts",
        children: [
          { label: "Discount Profiles", href: "/admin/discounts/profiles", icon: ListChecks, permission: "can_manage_discounts" },
          { label: "Apply Discount", href: "/admin/discounts/apply", icon: HandCoins, permission: "can_manage_discounts" },
          { label: "Reports", href: "/admin/discounts/reports", icon: BarChart3, permission: "can_view_financial_reports" },
        ],
      },
      {
        label: "Income", href: "/admin/income", icon: TrendingUp, permission: "can_view_financial_reports",
        children: [
          { label: "Income Dashboard", href: "/admin/income/dashboard", icon: LayoutDashboard, permission: "can_view_financial_reports" },
          { label: "Invoices", href: "/admin/invoices", icon: Receipt, permission: "can_view_invoices" },
        ],
      },
      {
        label: "Expenditure", href: "/admin/expenses", icon: TrendingDown, permission: "can_enter_expenses",
        children: [
          { label: "Dashboard", href: "/admin/expenses/dashboard", icon: LayoutDashboard, permission: "can_view_financial_reports" },
          { label: "All Expenses", href: "/admin/expenses", icon: ListChecks, permission: "can_enter_expenses" },
          { label: "Categories", href: "/admin/expenses/categories", icon: Layers, permission: "can_enter_expenses" },
          { label: "Reports", href: "/admin/expenses/reports", icon: BarChart3, permission: "can_view_financial_reports" },
        ],
      },
      { label: "Payroll", href: "/admin/payroll", icon: Banknote, permission: "can_manage_payroll" },
      { label: "Payslips", href: "/admin/payroll/payslips", icon: FileText, permission: "can_view_financial_reports" },
      { label: "SSNIT Reports", href: "/admin/payroll/ssnit", icon: Shield, permission: "can_manage_payroll" },
      { label: "SSNIT Summary", href: "/admin/payroll/ssnit/summary", icon: BarChart3, permission: "can_view_financial_reports" },
      { label: "Receivables", href: "/admin/receivables", icon: Scale, permission: "can_view_invoices" },
      { label: "Student Ledger", href: "/admin/ledger", icon: BookCheck, permission: "can_view_invoices" },
      { label: "Budget Management", href: "/admin/budgets", icon: PiggyBank, permission: "can_view_financial_reports" },
      { label: "Fiscal Years", href: "/admin/fiscal-years", icon: CalendarDays, permission: "can_view_financial_reports" },
      { label: "Student Accounts", href: "/admin/reports/student-accounts", icon: FileText, permission: "can_view_financial_reports" },
      { label: "Aging Report", href: "/admin/reports/aging", icon: TrendingUp, permission: "can_view_financial_reports" },
      { label: "SMS Log", href: "/admin/sms/log", icon: Smartphone, permission: "can_send_sms" },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Noticeboard", href: "/notices", icon: Megaphone, permission: "can_manage_notices" },
      { label: "Messages", href: "/messages", icon: MessageSquare, permission: "can_send_messages" },
      { label: "SMS", href: "/admin/sms", icon: Smartphone, permission: "can_send_sms" },
      { label: "SMS Automation", href: "/admin/sms/automation", icon: Smartphone, permission: "can_send_sms" },
      { label: "SMS Log", href: "/admin/sms/log", icon: Smartphone, permission: "can_send_sms" },
      { label: "Bill Reminders", href: "/admin/bill-reminders", icon: BellRing, permission: "can_send_sms" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Approvals", href: "/admin/approvals", icon: CheckSquare, permission: "can_manage_settings", adminOnly: true },
      { label: "Audit Log", href: "/admin/audit-log", icon: Shield, permission: "can_manage_settings", adminOnly: true },
      { label: "Backup", href: "/admin/backup", icon: Database, permission: "can_manage_settings", adminOnly: true },
      {
        label: "Settings", href: "/admin/settings", icon: Settings, permission: "can_manage_settings",
        children: [
          { label: "General Settings", href: "/admin/settings", icon: Settings, permission: "can_manage_settings" },
          { label: "Theme Settings", href: "/admin/settings/theme", icon: Palette, permission: "can_manage_settings" },
          { label: "SMS Settings", href: "/admin/settings/sms", icon: Smartphone, permission: "can_manage_settings" },
          { label: "Communication", href: "/admin/settings/communication", icon: MessageSquare, permission: "can_manage_settings" },
          { label: "Permissions", href: "/admin/permissions", icon: Shield, permission: "can_manage_roles_permissions", adminOnly: true },
        ],
      },
      { label: "My Profile", href: "/admin/profile", icon: User, permission: null },
      {
        label: "Transport", href: "/admin/transport", icon: Bus, permission: "can_manage_transport",
        children: [
          { label: "Routes", href: "/admin/transport", icon: Bus, permission: "can_manage_transport" },
          { label: "Vehicles", href: "/admin/transport/vehicles", icon: Bus, permission: "can_manage_transport" },
          { label: "Drivers", href: "/admin/transport/drivers", icon: User, permission: "can_manage_transport" },
          { label: "Conductor Portal", href: "/admin/transport/conductor", icon: UserCog, permission: "can_manage_transport" },
        ],
      },
      { label: "Inventory", href: "/admin/inventory", icon: Package, permission: "can_manage_inventory" },
      { label: "POS Terminal", href: "/admin/inventory/pos", icon: CreditCard, permission: "can_manage_inventory" },
      { label: "POS Sales", href: "/admin/inventory/pos/sales", icon: BarChart3, permission: "can_manage_inventory" },
      { label: "Dormitory", href: "/admin/dormitory", icon: BedDouble, permission: "can_manage_boarding" },
      { label: "Insurance", href: "/admin/insurance", icon: Shield, permission: "can_manage_settings" },
      { label: "Maintenance", href: "/admin/maintenance", icon: Settings, permission: "can_manage_settings" },
      {
        label: "Frontend CMS", href: "/admin/frontend", icon: Palette, permission: "can_manage_frontend_cms",
        children: [
          { label: "Pages", href: "/admin/frontend/pages", icon: FileText, permission: "can_manage_frontend_cms" },
          { label: "News", href: "/admin/frontend/news", icon: Megaphone, permission: "can_manage_frontend_cms" },
          { label: "Events", href: "/admin/frontend/events", icon: Calendar, permission: "can_manage_frontend_cms" },
          { label: "Gallery", href: "/admin/frontend/gallery", icon: Globe, permission: "can_manage_frontend_cms" },
          { label: "Slider", href: "/admin/frontend/slider", icon: Layers, permission: "can_manage_frontend_cms" },
        ],
      },
      { label: "Library", href: "/admin/library", icon: LibraryIcon, permission: "can_manage_books" },
      { label: "Employees", href: "/admin/employees", icon: UserCog, permission: "can_manage_employees" },
      { label: "Reconciliation", href: "/admin/reconciliation", icon: Scale, permission: "can_view_financial_reports" },
      { label: "Collection Efficiency", href: "/admin/collection-efficiency", icon: TrendingUp, permission: "can_view_financial_reports" },
      { label: "Financial Alerts", href: "/admin/financial-alerts", icon: BellRing, permission: "can_view_financial_reports" },
      { label: "Collector Handover", href: "/admin/collector-handover", icon: HandCoins, permission: "can_receive_daily_fees" },
    ],
  },
];

const teacherMenus: MenuSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
      { label: "My Classes", href: "/teacher/classes", icon: BookOpen, permission: "can_view_class_routine" },
      { label: "Attendance", href: "/attendance", icon: CheckSquare, permission: "can_manage_attendance" },
    ],
  },
  {
    title: "Academic",
    items: [
      { label: "Mark Entry", href: "/teacher/marks", icon: FileText, permission: "can_enter_marks" },
      { label: "Class Routine", href: "/routine", icon: Calendar, permission: "can_view_class_routine" },
      { label: "Students", href: "/teacher/students", icon: GraduationCap, permission: "can_view_students_list" },
      { label: "Syllabus", href: "/teacher/syllabus", icon: BookMarked, permission: "can_manage_classes" },
      { label: "Study Materials", href: "/teacher/study-material", icon: FileClock, permission: "can_manage_subjects" },
      { label: "Online Exams", href: "/online-exams", icon: Trophy, permission: "can_manage_exams" },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Messages", href: "/messages", icon: MessageSquare, permission: "can_send_messages" },
      { label: "Noticeboard", href: "/notices", icon: Megaphone, permission: null },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Library", href: "/library", icon: LibraryIcon, permission: "can_manage_books" },
      { label: "Transport", href: "/transport", icon: Bus, permission: null },
      { label: "My Payslips", href: "/teacher/payslips", icon: Banknote, permission: null },
    ],
  },
  {
    title: "Profile",
    items: [
      { label: "My Profile", href: "/profile", icon: User, permission: null },
    ],
  },
];

const studentMenus: MenuSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
      { label: "My Results", href: "/results", icon: FileText, permission: "can_view_own_results" },
      { label: "My Invoices", href: "/invoices", icon: Receipt, permission: "can_view_own_invoices" },
    ],
  },
  {
    title: "Academic",
    items: [
      { label: "Attendance", href: "/attendance", icon: CheckSquare, permission: null },
      { label: "Class Routine", href: "/routine", icon: Calendar, permission: "can_view_own_routine" },
      { label: "Online Exams", href: "/online-exams", icon: Trophy, permission: null },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Library", href: "/library", icon: LibraryIcon, permission: "can_request_books" },
      { label: "Transport", href: "/transport", icon: Bus, permission: null },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Messages", href: "/messages", icon: MessageSquare, permission: null },
      { label: "Noticeboard", href: "/notices", icon: Megaphone, permission: null },
    ],
  },
];

const parentMenus: MenuSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
      { label: "My Children", href: "/parent/children", icon: Users, permission: null },
      { label: "Children's Results", href: "/results", icon: FileText, permission: "can_view_children_results" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Fee Payments", href: "/payments", icon: CreditCard, permission: "can_view_children_invoices" },
    ],
  },
  {
    title: "Academic",
    items: [
      { label: "Attendance", href: "/attendance", icon: CheckSquare, permission: "can_view_children_attendance" },
      { label: "Teachers", href: "/parent/teachers", icon: User, permission: null },
      { label: "Syllabus", href: "/parent/syllabus", icon: BookMarked, permission: null },
      { label: "Class Routine", href: "/routine", icon: Calendar, permission: null },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Library", href: "/library", icon: LibraryIcon, permission: null },
      { label: "Transport", href: "/transport", icon: Bus, permission: null },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Messages", href: "/messages", icon: MessageSquare, permission: null },
      { label: "Noticeboard", href: "/notices", icon: Megaphone, permission: null },
    ],
  },
];

const accountantMenus: MenuSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
      { label: "Invoices", href: "/invoices", icon: Receipt, permission: "can_view_invoices" },
      { label: "Payments", href: "/payments", icon: CreditCard, permission: "can_view_payments" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Expenses", href: "/accountant/expenses", icon: DollarSign, permission: "can_enter_expenses" },
      { label: "Credits", href: "/accountant/credits", icon: Banknote, permission: "can_receive_payment" },
      { label: "Discounts", href: "/accountant/discounts", icon: Percent, permission: "can_manage_discounts" },
      { label: "Payroll", href: "/accountant/payroll", icon: Banknote, permission: "can_manage_payroll" },
      { label: "Reconciliation", href: "/accountant/reconciliation", icon: Scale, permission: "can_view_financial_reports" },
      { label: "Reports", href: "/accountant/reports", icon: BarChart3, permission: "can_view_financial_reports" },
    ],
  },
];

const librarianMenus: MenuSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
      { label: "Books", href: "/librarian/books", icon: BookCheck, permission: "can_manage_books" },
      { label: "Book Requests", href: "/librarian/requests", icon: BookOpen, permission: "can_issue_books" },
      { label: "Book Returns", href: "/librarian/returns", icon: CheckSquare, permission: "can_issue_books" },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Noticeboard", href: "/librarian/notices", icon: Megaphone, permission: null },
    ],
  },
  {
    title: "Profile",
    items: [
      { label: "My Profile", href: "/librarian/profile", icon: User, permission: null },
    ],
  },
];

// ─── Get menus by role ──────────────────────────────────────
export function getMenuByRole(role: string): MenuSection[] {
  const menuMap: Record<string, MenuSection[]> = {
    "super-admin": adminMenus,
    admin: adminMenus,
    teacher: teacherMenus,
    student: studentMenus,
    parent: parentMenus,
    accountant: accountantMenus,
    librarian: librarianMenus,
    cashier: accountantMenus,
    conductor: adminMenus,
    receptionist: adminMenus,
  };
  return menuMap[role] || [];
}

// ─── Role labels & colors ───────────────────────────────────
export const roleLabels: Record<string, string> = {
  "super-admin": "Super Admin",
  admin: "Administrator",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
  accountant: "Accountant",
  librarian: "Librarian",
  cashier: "Cashier",
  conductor: "Conductor",
  receptionist: "Receptionist",
};

export const roleColors: Record<string, string> = {
  "super-admin": "bg-red-100 text-red-700",
  admin: "bg-emerald-100 text-emerald-700",
  teacher: "bg-sky-100 text-sky-700",
  student: "bg-amber-100 text-amber-700",
  parent: "bg-purple-100 text-purple-700",
  accountant: "bg-orange-100 text-orange-700",
  librarian: "bg-rose-100 text-rose-700",
  cashier: "bg-teal-100 text-teal-700",
  conductor: "bg-cyan-100 text-cyan-700",
  receptionist: "bg-indigo-100 text-indigo-700",
};

// ─── Metro Menu Tile Groups ─────────────────────────────────
export interface MetroTile {
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
  wide?: boolean;
  permission?: string | null;
  adminOnly?: boolean;
}

export interface MetroGroup {
  title: string;
  tiles: MetroTile[];
}

export const metroGroups: MetroGroup[] = [
  {
    title: "Dashboard",
    tiles: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "#0078d4", wide: true, permission: null },
      { label: "Barcode Scanner", href: "/admin/barcode", icon: ScanBarcode, color: "#5d5a58", permission: "can_use_barcode_scanner" },
    ],
  },
  {
    title: "People",
    tiles: [
      { label: "Students", href: "/admin/students", icon: GraduationCap, color: "#107c10", wide: true, permission: "can_view_students_list" },
      { label: "Admit Student", href: "/admin/students/new", icon: UserPlus, color: "#00b294", permission: "can_admit_students" },
      { label: "Teachers", href: "/admin/teachers", icon: User, color: "#d83b01", permission: "can_view_teachers_list" },
      { label: "Parents", href: "/admin/parents", icon: Users, color: "#5c2d91", permission: "can_view_parents_list" },
      { label: "Administrators", href: "/admin/admins", icon: UserCog, color: "#008272", permission: "can_view_admins_list" },
      { label: "Employees", href: "/admin/employees", icon: UserCog, color: "#881798", permission: "can_manage_employees" },
    ],
  },
  {
    title: "Academics",
    tiles: [
      { label: "Classes", href: "/admin/classes", icon: BookOpen, color: "#0078d4", permission: "can_manage_classes" },
      { label: "Subjects", href: "/admin/subjects", icon: Globe, color: "#00bcf2", permission: "can_manage_subjects" },
      { label: "Timetable", href: "/routine", icon: Calendar, color: "#ff8c00", permission: "can_manage_class_routine" },
      { label: "Attendance", href: "/attendance", icon: CheckSquare, color: "#107c10", wide: true, permission: "can_manage_attendance" },
      { label: "Exams", href: "/admin/exams", icon: FileText, color: "#e81123", permission: "can_manage_exams" },
      { label: "Marks", href: "/admin/marks", icon: PenLine, color: "#5c2d91", permission: "can_enter_marks" },
      { label: "Grades", href: "/admin/grades", icon: Star, color: "#008272", permission: "can_manage_grades" },
      { label: "Reports", href: "/admin/reports/terminal", icon: BarChart3, color: "#00b294", wide: true, permission: "can_view_academic_reports" },
    ],
  },
  {
    title: "Finance",
    tiles: [
      { label: "Daily Fees", href: "/admin/daily-fees", icon: DollarSign, color: "#00b294", wide: true, permission: "can_receive_daily_fees" },
      { label: "Student Billing", href: "/admin/invoices", icon: Receipt, color: "#0078d4", permission: "can_bill_students" },
      { label: "Payments", href: "/admin/payments", icon: CreditCard, color: "#107c10", permission: "can_view_payments" },
      { label: "Expenses", href: "/admin/expenses", icon: TrendingDown, color: "#e81123", permission: "can_enter_expenses" },
      { label: "Payroll", href: "/admin/payroll", icon: Banknote, color: "#d83b01", permission: "can_manage_payroll" },
      { label: "Financial Reports", href: "/admin/reports/finance", icon: BarChart3, color: "#5c2d91", permission: "can_view_financial_reports" },
      { label: "POS Terminal", href: "/admin/inventory/pos", icon: CreditCard, color: "#00b294", permission: "can_manage_inventory" },
      { label: "Portfolio/SBA", href: "/admin/portfolio", icon: Trophy, color: "#881798", permission: "can_view_academic_reports" },
    ],
  },
  {
    title: "Communication",
    tiles: [
      { label: "Noticeboard", href: "/notices", icon: Megaphone, color: "#0078d4", wide: true, permission: "can_manage_notices" },
      { label: "Messages", href: "/messages", icon: MessageSquare, color: "#008272", permission: "can_send_messages" },
      { label: "SMS", href: "/admin/sms", icon: Smartphone, color: "#00bcf2", permission: "can_send_sms" },
      { label: "Bill Reminders", href: "/admin/bill-reminders", icon: BellRing, color: "#ff8c00", permission: "can_send_sms" },
    ],
  },
  {
    title: "Modules",
    tiles: [
      { label: "Transport", href: "/transport", icon: Bus, color: "#ff8c00", permission: "can_manage_transport" },
      { label: "Library", href: "/library", icon: LibraryIcon, color: "#5c2d91", permission: "can_manage_books" },
      { label: "Inventory", href: "/admin/inventory", icon: Package, color: "#008272", permission: "can_manage_inventory" },
      { label: "Boarding", href: "/admin/boarding", icon: BedDouble, color: "#107c10", permission: "can_mark_boarding_attendance" },
    ],
  },
  {
    title: "System",
    tiles: [
      { label: "Settings", href: "/admin/settings", icon: Settings, color: "#5d5a58", wide: true, permission: "can_manage_settings" },
      { label: "Frontend CMS", href: "/admin/settings/frontend", icon: Palette, color: "#ec008c", permission: "can_manage_frontend_cms" },
      { label: "Permissions", href: "/admin/settings/permissions", icon: Shield, color: "#e81123", permission: "can_manage_roles_permissions", adminOnly: true },
    ],
  },
];

// Extend MenuItem to include adminOnly
declare module "./menu" {
  interface MenuItem {
    adminOnly?: boolean;
  }
}
