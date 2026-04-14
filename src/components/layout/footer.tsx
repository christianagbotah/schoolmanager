"use client";

import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto bg-black text-white/70 text-center py-4 px-6">
      <div className="flex items-center justify-center gap-2 mb-1">
        <GraduationCap className="w-4 h-4 text-white/50" />
        <span className="text-xs font-semibold text-white/50">
          School Manager
        </span>
      </div>
      <p className="text-xs">
        &copy; {new Date().getFullYear()}{" "}
        <span className="text-white/90 font-medium">School Name</span>. All
        rights reserved. | Powered by{" "}
        <span className="text-white/90 font-medium">School Manager</span>
      </p>
    </footer>
  );
}
