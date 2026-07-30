"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/app";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Menu, Bell, Search, LogOut, Settings, User, Moon, Sun, ChevronDown,
  HelpCircle, RefreshCw,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { USER_ROLES } from "@/lib/constants";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { getInitials } from "@/lib/format";

interface TopbarProps {
  onSeed?: () => void;
}

export function Topbar({ onSeed }: TopbarProps) {
  const { user, logout, toggleSidebar, activeModule } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const roleInfo = USER_ROLES.find((r) => r.value === user?.role);
  const currentModule = activeModule;

  async function handleLogout() {
    try {
      await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "logout", userId: user?.id }) });
    } catch {}
    logout();
    toast.success("Logged out successfully");
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/95 backdrop-blur px-4">
        {/* Mobile menu */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop collapse */}
        <Button variant="ghost" size="icon" className="hidden md:flex" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb / Title */}
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base font-semibold capitalize truncate">{currentModule.replace(/-/g, " ")}</h2>
        </div>

        {/* Search */}
        <div className="ml-auto hidden md:flex items-center relative w-64">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students, staff..."
            className="pl-9 h-9"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto md:ml-2">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {onSeed && (
            <Button variant="ghost" size="icon" onClick={onSeed} title="Load demo data">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start py-2">
                <p className="text-sm font-medium">New admission enquiry</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start py-2">
                <p className="text-sm font-medium">Fee payment received</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start py-2">
                <p className="text-sm font-medium">Leave request pending</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.image || undefined} />
                  <AvatarFallback className="bg-emerald-600 text-white text-xs">
                    {user ? getInitials(user.name.split(" ")[0] || "U", user.name.split(" ")[1] || "") : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium leading-none">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{user?.role}</p>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden lg:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className={`mt-1 ${roleInfo?.color} text-white`}>{user?.role}</Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => useAppStore.getState().setModule("settings")}>
                <User className="h-4 w-4 mr-2" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useAppStore.getState().setModule("settings")}>
                <Settings className="h-4 w-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="h-4 w-4 mr-2" /> Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
