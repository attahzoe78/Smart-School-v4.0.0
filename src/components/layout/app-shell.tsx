"use client";

import { useState } from "react";
import { useAppStore } from "@/store/app";
import { api } from "@/lib/api-client";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Footer } from "./footer";
import { Dashboard } from "@/components/screens/dashboard";
import { StudentsScreen } from "@/components/screens/students";
import { StaffScreen } from "@/components/screens/staff";
import { FeesScreen } from "@/components/screens/fees";
import { AttendanceScreen } from "@/components/screens/attendance";
import { FrontOfficeScreen } from "@/components/screens/front-office";
import { LibraryScreen } from "@/components/screens/library";
import { HomeworkScreen } from "@/components/screens/homework";
import { ExamsScreen } from "@/components/screens/exams";
import { CalendarScreen } from "@/components/screens/calendar";
import { CmsScreen } from "@/components/screens/cms";
import { SettingsScreen } from "@/components/screens/settings";
import { RolesScreen } from "@/components/screens/roles";
import { HrScreen } from "@/components/screens/hr";
import { CertificatesScreen } from "@/components/screens/certificates";
import { ConstructionScreen } from "@/components/screens/construction";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function AppShell() {
  const { activeModule } = useAppStore();
  const [seeding, setSeeding] = useState(false);

  async function handleSeed() {
    if (!confirm("This will load demo data (students, staff, fees, etc.) into the system. Continue?")) return;
    setSeeding(true);
    try {
      const res = await api<{ success: boolean; message: string }>("/api/seed", { method: "POST", body: JSON.stringify({}) });
      toast.success(res.message || "Demo data loaded!");
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      toast.error(e.message || "Failed to seed data");
    } finally {
      setSeeding(false);
    }
  }

  function renderModule() {
    switch (activeModule) {
      case "dashboard": return <Dashboard />;
      case "students": return <StudentsScreen />;
      case "staff": case "departments": case "designations": return <StaffScreen />;
      case "fees": case "expenses": return <FeesScreen />;
      case "attendance": case "staff-attendance": return <AttendanceScreen />;
      case "front-office": case "visitor-book": case "complaints": return <FrontOfficeScreen />;
      case "library": return <LibraryScreen />;
      case "homework": case "download-center": return <HomeworkScreen />;
      case "examinations": return <ExamsScreen />;
      case "calendar": return <CalendarScreen />;
      case "cms": case "pages": case "news": case "gallery": case "banners": case "menus": case "media": return <CmsScreen />;
      case "settings": return <SettingsScreen />;
      case "roles": return <RolesScreen />;
      case "payroll": case "leave": return <HrScreen />;
      case "certificates": return <CertificatesScreen />;
      case "hostel": case "transport": return <SettingsScreen />;
      default: return <ConstructionScreen module={activeModule} />;
    }
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onSeed={handleSeed} />
        <main className="flex-1 p-4 md:p-6">
          {seeding ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
              <p className="text-sm text-muted-foreground">Loading demo data...</p>
            </div>
          ) : (
            renderModule()
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
