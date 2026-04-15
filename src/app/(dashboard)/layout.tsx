import { DashboardLayout } from "@/components/layout/dashboard-layout";

/**
 * Shared Dashboard Route Group Layout
 *
 * All pages under /notices, /messages, /profile, /attendance, /routine,
 * /transport, /library, /invoices, /payments, /results, /online-exams
 * are wrapped with the DashboardLayout component which provides the sidebar,
 * header, bottom nav, and footer.
 *
 * Note: The existing /dashboard/page.tsx is outside this route group and
 * has its own redirect logic. Pages in this group are shared views that
 * adapt based on user role/permissions.
 */
export default function SharedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
