import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  FileText,
  Receipt,
  CreditCard,
  DollarSign,
  Bus,
  BarChart3,
  Settings,
  MessageSquare,
  CheckSquare,
  Calendar,
  User,
  Library as LibraryIcon,
  BookCheck,
  Package,
  BedDouble,
  Bell,
  Megaphone,
  Mail,
  UserCog,
  Banknote,
  Palette,
  Globe,
  Award,
  Star,
  Table2,
  TrendingUp,
} from "lucide-react";
import type { UserRole } from "@/lib/auth";

export interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: MenuItem[];
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

const adminMenus: MenuSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Students", href: "/admin/students", icon: Users },
      { label: "Teachers", href: "/admin/teachers", icon: GraduationCap },
      { label: "Classes", href: "/admin/classes", icon: BookOpen },
      { label: "Subjects", href: "/admin/subjects", icon: ClipboardList },
    ],
  },
  {
    title: "Academic",
    items: [
      { label: "Attendance", href: "/admin/attendance", icon: CheckSquare },
      { label: "Exams", href: "/admin/exams", icon: FileText },
      { label: "Mark Entry", href: "/admin/marks", icon: Award },
      { label: "Grades", href: "/admin/grades", icon: Star },
      { label: "Class Routine", href: "/admin/routine", icon: Calendar },
    ],
  },
  {
    title: "Modules",
    items: [
      { label: "Library", href: "/admin/library", icon: LibraryIcon },
      { label: "Transport", href: "/admin/transport", icon: Bus },
      { label: "Inventory", href: "/admin/inventory", icon: Package },
      { label: "Boarding", href: "/admin/boarding", icon: BedDouble },
    ],
  },
  {
    title: "HR & Payroll",
    items: [
      { label: "Employees", href: "/admin/employees", icon: UserCog },
      { label: "Payroll", href: "/admin/payroll", icon: Banknote },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Invoices & Billing", href: "/admin/invoices", icon: Receipt },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Daily Fees", href: "/admin/daily-fees", icon: DollarSign },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Notices", href: "/admin/notices", icon: Megaphone },
      { label: "Messages", href: "/admin/messages", icon: MessageSquare },
    ],
  },
  {
    title: "Reports",
    items: [
      { label: "Terminal Reports", href: "/admin/reports/terminal", icon: BarChart3 },
      { label: "Broadsheet", href: "/admin/reports/broadsheet", icon: Table2 },
      { label: "Attendance Reports", href: "/admin/attendance/report", icon: TrendingUp },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Frontend CMS", href: "/admin/settings/frontend", icon: Globe },
    ],
  },
];

const teacherMenus: MenuSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
      { label: "My Classes", href: "/teacher/classes", icon: BookOpen },
      { label: "Attendance", href: "/teacher/attendance", icon: CheckSquare },
    ],
  },
  {
    title: "Academic",
    items: [
      { label: "Mark Entry", href: "/teacher/marks", icon: FileText },
      { label: "Class Routine", href: "/teacher/routine", icon: Calendar },
    ],
  },
  {
    title: "Profile",
    items: [
      { label: "My Profile", href: "/teacher/profile", icon: User },
    ],
  },
];

const studentMenus: MenuSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/student", icon: LayoutDashboard },
      { label: "My Results", href: "/student/results", icon: FileText },
      { label: "My Invoices", href: "/student/invoices", icon: Receipt },
    ],
  },
  {
    title: "Academic",
    items: [
      { label: "Class Routine", href: "/student/routine", icon: Calendar },
      { label: "Library", href: "/student/library", icon: LibraryIcon },
    ],
  },
];

const parentMenus: MenuSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
      {
        label: "Children's Results",
        href: "/parent/results",
        icon: FileText,
      },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Fee Payments", href: "/parent/payments", icon: CreditCard },
    ],
  },
  {
    title: "Academic",
    items: [
      { label: "Attendance", href: "/parent/attendance", icon: CheckSquare },
    ],
  },
];

const accountantMenus: MenuSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/accountant", icon: LayoutDashboard },
      { label: "Invoices", href: "/accountant/invoices", icon: Receipt },
      { label: "Payments", href: "/accountant/payments", icon: CreditCard },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Expenses", href: "/accountant/expenses", icon: DollarSign },
      { label: "Reports", href: "/accountant/reports", icon: BarChart3 },
    ],
  },
];

const librarianMenus: MenuSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/librarian", icon: LayoutDashboard },
      { label: "Books", href: "/librarian/books", icon: BookCheck },
      { label: "Book Requests", href: "/librarian/requests", icon: BookOpen },
    ],
  },
];

export function getMenuByRole(role: UserRole): MenuSection[] {
  const menuMap: Record<UserRole, MenuSection[]> = {
    admin: adminMenus,
    teacher: teacherMenus,
    student: studentMenus,
    parent: parentMenus,
    accountant: accountantMenus,
    librarian: librarianMenus,
  };
  return menuMap[role] || [];
}

export const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
  accountant: "Accountant",
  librarian: "Librarian",
};

export const roleColors: Record<UserRole, string> = {
  admin: "bg-emerald-100 text-emerald-700",
  teacher: "bg-blue-100 text-blue-700",
  student: "bg-amber-100 text-amber-700",
  parent: "bg-purple-100 text-purple-700",
  accountant: "bg-orange-100 text-orange-700",
  librarian: "bg-rose-100 text-rose-700",
};
