"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app";
import { api } from "@/lib/api-client";
import { InstallScreen } from "@/components/screens/install-screen";
import { LoginScreen } from "@/components/screens/login-screen";
import { AppShell } from "@/components/layout/app-shell";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, login } = useAppStore();
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const res = await api<{ installed: boolean }>("/api/auth?action=status", { method: "POST", body: JSON.stringify({ action: "status" }) });
      setInstalled(res.installed);
    } catch {
      setInstalled(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Loading Smart School...</p>
        </div>
      </div>
    );
  }

  if (!installed) {
    return <InstallScreen onInstalled={() => setInstalled(true)} />;
  }

  if (!user) {
    return <LoginScreen onLogin={login} />;
  }

  return <AppShell />;
}
