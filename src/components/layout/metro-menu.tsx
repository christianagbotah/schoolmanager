"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { metroGroups, type MetroGroup, type MetroTile } from "@/config/menu";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/permission-constants";

interface MetroMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MetroMenu({ open, onClose }: MetroMenuProps) {
  const { role, permissions, isSuperAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleTiles, setVisibleTiles] = useState<Set<string>>(new Set());

  // Staggered animation: reveal tiles one by one
  useEffect(() => {
    if (!open) {
      setVisibleTiles(new Set());
      return;
    }

    const allTiles = document.querySelectorAll("[data-metro-tile]");
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < allTiles.length) {
        const tileId = allTiles[currentIndex].getAttribute("data-metro-tile");
        setVisibleTiles((prev) => new Set([...prev, tileId!]));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 60);

    return () => clearInterval(interval);
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

  const handleTileClick = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  // Filter tiles based on permissions
  const filteredGroups = metroGroups
    .map((group) => ({
      ...group,
      tiles: group.tiles.filter((tile) => {
        // Admin-only tiles
        if (tile.adminOnly && !isSuperAdmin) return false;
        // Permission check
        if (tile.permission) {
          return hasPermission(permissions, tile.permission);
        }
        return true;
      }),
    }))
    .filter((group) => group.tiles.length > 0);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#0a0069] overflow-y-auto animate-fade-in"
      onClick={(e) => {
        // Close on backdrop click (but not on tile click)
        if (e.target === containerRef.current) {
          onClose();
        }
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-8 py-6 md:px-12">
        <h1 className="text-[42px] font-extralight text-white tracking-tight">
          Start
        </h1>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white hover:bg-white/10 w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
          aria-label="Close start menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Tile Grid - CSS columns for masonry-like layout */}
      <div className="px-8 pb-12 md:px-12">
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filteredGroups.map((group: MetroGroup) => (
            <div key={group.title} className="break-inside-avoid mb-4">
              {/* Group title */}
              <h2 className="uppercase text-sm text-white/50 font-semibold mb-3 px-1">
                {group.title}
              </h2>

              {/* Tiles grid */}
              <div className="grid grid-cols-2 gap-3">
                {group.tiles.map((tile: MetroTile, index: number) => {
                  const tileId = `${tile.href}-${index}`;
                  const Icon = tile.icon;
                  const isVisible = visibleTiles.has(tileId);
                  const isDashboardPath =
                    pathname === tile.href ||
                    pathname.startsWith(tile.href + "/");

                  return (
                    <div
                      key={tileId}
                      data-metro-tile={tileId}
                      className={cn(
                        tile.wide && "col-span-2",
                        "transition-all duration-300 ease-out",
                        isVisible
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-95"
                      )}
                    >
                      <button
                        onClick={() => handleTileClick(tile.href)}
                        className={cn(
                          tile.wide ? "w-full h-[120px] md:h-[150px]" : "w-full h-[120px] md:h-[150px]",
                          "rounded-lg flex flex-col items-center justify-center text-white hover:scale-[1.04] active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden group",
                          isDashboardPath && "ring-2 ring-white/40"
                        )}
                        style={{ backgroundColor: tile.color }}
                      >
                        {/* Subtle hover overlay */}
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />

                        <Icon className="text-4xl md:text-[60px] mb-2 relative z-10 drop-shadow-lg" />
                        <span className="text-xs md:text-sm font-semibold relative z-10 text-center leading-tight px-2">
                          {tile.label}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
