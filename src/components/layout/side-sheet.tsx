"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type SideSheetSize = "sm" | "md" | "lg";

interface SideSheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when the sheet should close */
  onClose: () => void;
  /** Sheet content */
  children: React.ReactNode;
  /** Title displayed in the header */
  title?: string;
  /** Description text below title */
  description?: string;
  /** Size preset (default: "md") */
  size?: SideSheetSize;
  /** Additional CSS classes for the content area */
  className?: string;
  /** Footer content */
  footer?: React.ReactNode;
  /** Whether to show the close button (default: true) */
  showClose?: boolean;
  /** Whether backdrop click closes the sheet (default: true) */
  closeOnBackdrop?: boolean;
  /** Whether swipe right closes the sheet on mobile (default: true) */
  closeOnSwipe?: boolean;
}

const SIZE_MAP: Record<SideSheetSize, string> = {
  sm: "max-w-[320px] w-full",
  md: "max-w-[480px] w-full",
  lg: "max-w-[640px] w-full",
};

export function SideSheet({
  open,
  onClose,
  children,
  title,
  description,
  size = "md",
  className,
  footer,
  showClose = true,
  closeOnBackdrop = true,
  closeOnSwipe = true,
}: SideSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startX = useRef(0);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Only allow starting drag from the left edge of the sheet
      if (!closeOnSwipe || !sheetRef.current) return;
      const rect = sheetRef.current.getBoundingClientRect();
      const touchX = e.touches[0].clientX;
      // Allow drag from left 20px of sheet
      if (touchX - rect.left < 20) {
        startX.current = touchX;
        setIsDragging(true);
      }
    },
    [closeOnSwipe]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const currentX = e.touches[0].clientX;
      const diff = startX.current - currentX;
      setDragOffset(Math.max(0, -diff));
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragOffset > 80) {
      onClose();
    } else {
      setDragOffset(0);
    }
  }, [isDragging, dragOffset, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm",
          "transition-opacity duration-300"
        )}
        style={{ opacity: dragOffset > 0 ? Math.max(0, 1 - dragOffset / 300) : 1 }}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        className={cn(
          "absolute inset-y-0 right-0 z-10",
          "bg-white shadow-2xl flex flex-col",
          "transition-transform duration-300 ease-out",
          isDragging && "transition-none",
          SIZE_MAP[size],
          className
        )}
        style={{
          transform: dragOffset > 0 ? `translateX(${dragOffset}px)` : "translateX(0)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Side panel"}
      >
        {/* Drag handle (mobile) */}
        <div
          className="absolute left-0 top-0 bottom-0 w-5 touch-none md:hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Header */}
        {(title || showClose) && (
          <div className="flex-shrink-0 flex items-start justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-base font-semibold text-slate-900">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-slate-500 mt-0.5">{description}</p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-shrink-0 ml-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-slate-100 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
