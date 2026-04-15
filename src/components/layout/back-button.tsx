"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

interface BackButtonProps {
  /** Fallback URL when no browser history exists (default: "/") */
  fallback?: string;
  /** Additional CSS classes */
  className?: string;
  /** Label text shown alongside the arrow (desktop only) */
  label?: string;
  /** Whether to show label on mobile too */
  showLabelMobile?: boolean;
}

export function BackButton({
  fallback = "/",
  className,
  label = "Back",
  showLabelMobile = false,
}: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const handleClick = useCallback(() => {
    // Check if we have history to go back to
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }, [router, fallback]);

  // Determine if this is a "deep" navigation (more than just the role root)
  const pathSegments = pathname.split("/").filter(Boolean);
  const isDeepNavigation = pathSegments.length > 2;

  // Don't show back button on root dashboard pages
  if (!isDeepNavigation) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900",
        "transition-all duration-150 rounded-lg",
        "min-h-[36px] min-w-[36px] px-1.5 md:px-2.5 md:py-1",
        "hover:bg-slate-100 active:bg-slate-200",
        className
      )}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4 flex-shrink-0" />
      <span
        className={cn(
          "text-sm font-medium",
          showLabelMobile ? "inline" : "hidden md:inline"
        )}
      >
        {label}
      </span>
    </button>
  );
}
