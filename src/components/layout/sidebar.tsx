"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/app";
import { MODULES, MODULE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { GraduationCap, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { user, activeModule, setModule, sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  const filteredModules = useMemo(() => {
    if (!user) return [];
    if (user.role === "Super Admin") return MODULES;
    return MODULES.filter((m) => m.roles.includes(user.role));
  }, [user]);

  const groupedModules = useMemo(() => {
    const groups: Record<string, typeof MODULES> = {};
    for (const cat of MODULE_CATEGORIES) {
      const mods = filteredModules.filter((m) => m.category === cat);
      if (mods.length > 0) groups[cat] = mods;
    }
    return groups;
  }, [filteredModules]);

  return (
    <div className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground border-r", sidebarCollapsed && "md:w-16")}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-4 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white shrink-0">
          <GraduationCap className="h-5 w-5" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm leading-none truncate">Smart School</p>
            <p className="text-xs text-muted-foreground mt-0.5">v4.0.0</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto hidden md:flex h-7 w-7"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-4">
          {Object.entries(groupedModules).map(([category, modules]) => (
            <div key={category}>
              {!sidebarCollapsed && (
                <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{category}</p>
              )}
              <div className="space-y-0.5">
                {modules.map((mod) => {
                  const Icon = mod.icon;
                  const isActive = activeModule === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => {
                        setModule(mod.id);
                        onNavigate?.();
                      }}
                      title={sidebarCollapsed ? mod.label : undefined}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        sidebarCollapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{mod.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="border-t p-3 shrink-0">
          <Link href="#" className="block rounded-lg bg-muted/50 p-2.5 text-center">
            <p className="text-xs font-medium">Sisi Technology Ltd</p>
            <p className="text-[10px] text-muted-foreground">Jos, Plateau State</p>
          </Link>
        </div>
      )}
    </div>
  );
}
