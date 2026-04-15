"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type SnapPoint = "peek" | "half" | "full";

interface BottomSheetProps {
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
  /** Initial snap point (default: "half") */
  defaultSnap?: SnapPoint;
  /** Available snap points (default: all three) */
  snapPoints?: SnapPoint[];
  /** Additional CSS classes for the content area */
  className?: string;
  /** Hide drag handle (default: false) */
  hideHandle?: boolean;
  /** Footer content */
  footer?: React.ReactNode;
}

const SNAP_HEIGHTS: Record<SnapPoint, string> = {
  peek: "30%",
  half: "50%",
  full: "95%",
};

const SNAP_ORDER: SnapPoint[] = ["peek", "half", "full"];

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  description,
  defaultSnap = "half",
  snapPoints = ["peek", "half", "full"],
  className,
  hideHandle = false,
  footer,
}: BottomSheetProps) {
  // Derive current snap from open state and defaultSnap
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startHeight = useRef(0);

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

  const snapTo = useCallback(
    (snap: SnapPoint) => {
      if (!snapPoints.includes(snap)) return;
      setCurrentSnap(snap);
      setDragOffset(0);
    },
    [snapPoints, open]
  );

  const cycleSnap = useCallback(() => {
    const currentIndex = SNAP_ORDER.indexOf(currentSnap);
    const filteredSnaps = SNAP_ORDER.filter((s) => snapPoints.includes(s));
    const currentFilteredIndex = filteredSnaps.indexOf(currentSnap);
    const nextIndex = (currentFilteredIndex + 1) % filteredSnaps.length;
    snapTo(filteredSnaps[nextIndex]);
  }, [currentSnap, snapPoints, snapTo]);

  // Touch handlers for drag
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!sheetRef.current) return;
      startY.current = e.touches[0].clientY;
      startHeight.current = sheetRef.current.offsetHeight;
      setIsDragging(true);
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      setDragOffset(Math.max(0, diff));
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 100;
    if (dragOffset > threshold) {
      // Dragged down enough - go to previous snap or close
      const currentIndex = SNAP_ORDER.indexOf(currentSnap);
      const filteredSnaps = SNAP_ORDER.filter((s) => snapPoints.includes(s));
      const currentFilteredIndex = filteredSnaps.indexOf(currentSnap);

      if (currentFilteredIndex === 0) {
        // At peek, close
        onClose();
      } else {
        snapTo(filteredSnaps[currentFilteredIndex - 1]);
      }
    } else {
      // Snap back
      setDragOffset(0);
    }
  }, [isDragging, dragOffset, currentSnap, snapPoints, onClose, snapTo]);

  // Calculate actual height with drag offset
  const baseHeight = SNAP_HEIGHTS[currentSnap];
  const sheetHeight = `calc(${baseHeight} + ${dragOffset}px)`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm",
          "transition-opacity duration-300",
          currentSnap === "full" ? "opacity-60" : "opacity-50"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "absolute bottom-0 left-0 right-0 z-10",
          "bg-white rounded-t-2xl shadow-2xl",
          "flex flex-col",
          "transition-[height] duration-300 ease-out",
          isDragging && "transition-none",
          className
        )}
        style={{
          height: sheetHeight,
          maxHeight: "95vh",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Bottom sheet"}
      >
        {/* Drag Handle + Header */}
        <div
          className={cn(
            "flex-shrink-0 touch-none",
            !hideHandle && "cursor-grab active:cursor-grabbing"
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={!hideHandle ? cycleSnap : undefined}
        >
          {/* Handle bar */}
          {!hideHandle && (
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>
          )}

          {/* Header */}
          {(title || description) && (
            <div className="flex items-start justify-between px-5 pb-3">
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="flex-shrink-0 ml-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-slate-100 px-5 py-3">
            {footer}
          </div>
        )}

        {/* Snap point indicators */}
        {snapPoints.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-2">
            {snapPoints.map((point) => (
              <button
                key={point}
                type="button"
                onClick={() => snapTo(point)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-200",
                  currentSnap === point
                    ? "bg-[#0a0069] w-4"
                    : "bg-slate-300 hover:bg-slate-400"
                )}
                aria-label={`Snap to ${point}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
