"use client";

import { useAuth } from "@/hooks/use-auth";
import { ShieldX, Loader2 } from "lucide-react";
import { hasAnyPermission } from "@/lib/permission-constants";

interface RequirePermissionProps {
  /** One or more permissions required to access the content */
  permission: string | string[];
  /** Whether ALL permissions are required (default: false = any) */
  mode?: "any" | "all";
  /** Content to show if the user has permission */
  children: React.ReactNode;
  /** Optional fallback to show instead of the default "not authorized" message */
  fallback?: React.ReactNode;
}

/**
 * Permission Guard Component
 *
 * Wraps content that requires specific permissions. If the user doesn't have
 * the required permission(s), a "not authorized" message is displayed instead.
 *
 * @example
 * // Single permission
 * <RequirePermission permission="can_manage_notices">
 *   <CreateNoticeForm />
 * </RequirePermission>
 *
 * // Multiple permissions (any)
 * <RequirePermission permission={["can_manage_books", "can_issue_books"]} mode="any">
 *   <LibraryManagement />
 * </RequirePermission>
 */
export function RequirePermission({
  permission,
  mode = "any",
  children,
  fallback,
}: RequirePermissionProps) {
  const { permissions, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const requiredPermissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess =
    mode === "all"
      ? requiredPermissions.every((p) => permissions.includes(p))
      : hasAnyPermission(permissions, requiredPermissions);

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Not Authorized
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            You don&apos;t have permission to access this feature.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
