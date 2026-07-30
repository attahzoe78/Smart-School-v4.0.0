"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, Loader2, Lock, User, Eye, EyeOff, Shield, Sparkles } from "lucide-react";
import type { AppUser } from "@/store/app";
import { USER_ROLES } from "@/lib/constants";

interface LoginScreenProps {
  onLogin: (user: AppUser) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }
    setLoading(true);
    try {
      const res = await api<AppUser>("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "login", username, password }),
      });
      toast.success(`Welcome back, ${res.name}!`);
      onLogin(res);
    } catch (e: any) {
      toast.error(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(user: string, pass: string) {
    setUsername(user);
    setPassword(pass);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Top Bar */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Smart School</h1>
              <p className="text-xs text-muted-foreground">School Automation Software v4.0.0</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" /> Secured by ACL
          </div>
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-2">
        {/* Left - Branding */}
        <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="relative z-10 max-w-md">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Version 4.0.0</span>
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Complete School Automation for Nigeria
            </h2>
            <p className="text-emerald-50 text-lg mb-8">
              25+ modules. 8 user panels. From student admission to student leaving, from fees collection to exam results.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {USER_ROLES.slice(0, 8).map((role) => (
                <div key={role.value} className="flex items-center gap-2 text-sm">
                  <div className={`h-2 w-2 rounded-full ${role.color}`} />
                  <span className="text-emerald-50">{role.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-12 pt-6 border-t border-white/20">
              <p className="text-sm text-emerald-100">
                <strong>Developed by Sisi Technology Ltd</strong><br />
                Jos Plateau State, Nigeria
              </p>
            </div>
          </div>
        </div>

        {/* Right - Login Form */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold">Welcome Back</h2>
              <p className="text-sm text-muted-foreground mt-1">Sign in to access your dashboard</p>
            </div>

            <Card className="shadow-xl border-border/60">
              <CardContent className="p-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="pl-9"
                        autoComplete="username"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pl-9 pr-9"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 h-11">
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Demo Credentials */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Demo Accounts (click to fill)</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => quickLogin("superadmin", "password123")} className="text-left p-2 rounded-md bg-background hover:bg-accent border transition-colors">
                  <p className="text-xs font-medium">Super Admin</p>
                  <p className="text-[10px] text-muted-foreground">superadmin / password123</p>
                </button>
                <button onClick={() => quickLogin("admin", "password123")} className="text-left p-2 rounded-md bg-background hover:bg-accent border transition-colors">
                  <p className="text-xs font-medium">Admin / Teacher</p>
                  <p className="text-[10px] text-muted-foreground">Use seeded accounts</p>
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">After seeding, student/parent logins are auto-generated.</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t bg-white py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Smart School v4.0.0 &copy; {new Date().getFullYear()} Sisi Technology Ltd, Jos Plateau State, Nigeria
        </div>
      </footer>
    </div>
  );
}
