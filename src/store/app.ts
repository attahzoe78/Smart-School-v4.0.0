import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "@/lib/constants";

export interface AppUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  name: string;
  image?: string | null;
  staffId?: string | null;
  studentId?: string | null;
  parentId?: string | null;
}

interface AppState {
  user: AppUser | null;
  activeModule: string;
  sidebarCollapsed: boolean;
  login: (user: AppUser) => void;
  logout: () => void;
  setModule: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      activeModule: "dashboard",
      sidebarCollapsed: false,
      login: (user) => set({ user, activeModule: "dashboard" }),
      logout: () => set({ user: null, activeModule: "dashboard" }),
      setModule: (id) => set({ activeModule: id }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
    }),
    {
      name: "smart-school-store",
      partialize: (s) => ({ user: s.user, activeModule: s.activeModule, sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
);
