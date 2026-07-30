"use client";

import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background py-3 px-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-emerald-600" />
          <span>Smart School v4.0.0</span>
        </div>
        <p className="text-xs">
          &copy; {new Date().getFullYear()} Sisi Technology Ltd, Jos Plateau State, Nigeria
        </p>
      </div>
    </footer>
  );
}
