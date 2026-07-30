"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  GraduationCap, Check, ChevronRight, ChevronLeft, School, Database, UserPlus,
  CheckCircle2, Loader2, MapPin, Settings, Shield,
} from "lucide-react";
import { NIGERIAN_STATES } from "@/lib/constants";

interface InstallScreenProps {
  onInstalled: () => void;
}

const STEPS = [
  { id: 0, title: "Welcome", icon: GraduationCap },
  { id: 1, title: "School Details", icon: School },
  { id: 2, title: "Admin Account", icon: UserPlus },
  { id: 3, title: "Database Setup", icon: Database },
  { id: 4, title: "Complete", icon: CheckCircle2 },
];

export function InstallScreen({ onInstalled }: InstallScreenProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    schoolName: "Smart School",
    schoolCode: "",
    tagLine: "Knowledge • Excellence • Integrity",
    phone: "+234 803 000 0000",
    email: "info@smartschool.edu.ng",
    address: "Yakubu Gowon Way",
    city: "Jos",
    state: "Plateau",
    country: "Nigeria",
    currency: "₦",
    currencyCode: "NGN",
    language: "English",
    timezone: "Africa/Lagos",
    sessionName: "2024/2025",
    adminUsername: "superadmin",
    adminEmail: "admin@smartschool.edu.ng",
    adminPassword: "",
    adminConfirmPassword: "",
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const progress = ((step + 1) / STEPS.length) * 100;

  async function handleInstall() {
    if (form.adminPassword !== form.adminConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.adminPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api("/api/install", { method: "POST", body: JSON.stringify(form) });
      setStep(4);
      toast.success("Installation completed successfully!");
    } catch (e: any) {
      toast.error(e.message || "Installation failed");
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (step === 1 && !form.schoolName) { toast.error("School name is required"); return; }
    if (step === 2 && (!form.adminUsername || !form.adminPassword)) { toast.error("Admin credentials are required"); return; }
    if (step < 3) setStep(step + 1);
    else if (step === 3) handleInstall();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Smart School</h1>
              <p className="text-xs text-muted-foreground">Installation Wizard v4.0.0</p>
            </div>
          </div>
          <Badge variant="secondary" className="hidden sm:flex">Sisi Technology Ltd</Badge>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">System Installation</h2>
            <span className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="mt-4 flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center gap-1.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                  i < step ? "bg-emerald-600 border-emerald-600 text-white" :
                  i === step ? "border-emerald-600 text-emerald-600 bg-emerald-50" :
                  "border-muted-foreground/30 text-muted-foreground/50"
                }`}>
                  {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className={`text-xs hidden sm:block ${i <= step ? "text-foreground font-medium" : "text-muted-foreground/50"}`}>{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-lg border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 0 && <><GraduationCap className="h-5 w-5 text-emerald-600" /> Welcome to Smart School</>}
              {step === 1 && <><School className="h-5 w-5 text-emerald-600" /> School Information</>}
              {step === 2 && <><UserPlus className="h-5 w-5 text-emerald-600" /> Super Admin Account</>}
              {step === 3 && <><Database className="h-5 w-5 text-emerald-600" /> Database & Initial Setup</>}
              {step === 4 && <><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Installation Complete</>}
            </CardTitle>
            <CardDescription>
              {step === 0 && "Let's set up your school management system. This wizard will guide you through the process."}
              {step === 1 && "Enter your school's basic information to get started."}
              {step === 2 && "Create the Super Admin account that will have full access to the system."}
              {step === 3 && "Review your settings and complete the installation."}
              {step === 4 && "Your Smart School system is ready to use!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                  <h3 className="font-semibold text-emerald-900 flex items-center gap-2"><Shield className="h-4 w-4" /> System Requirements</h3>
                  <ul className="mt-2 space-y-1 text-sm text-emerald-800">
                    <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Node.js / Bun Runtime</li>
                    <li className="flex items-center gap-2"><Check className="h-3 w-3" /> SQLite Database</li>
                    <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Next.js 16 Framework</li>
                    <li className="flex items-center gap-2"><Check className="h-3 w-3" /> Modern Web Browser</li>
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 p-3 rounded-lg border">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <div><p className="font-medium">25+ Modules</p><p className="text-xs text-muted-foreground">Complete automation</p></div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <div><p className="font-medium">8 User Panels</p><p className="text-xs text-muted-foreground">Role-based access</p></div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div><p className="font-medium">Nigerian Market</p><p className="text-xs text-muted-foreground">Localized for Nigeria</p></div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div><p className="font-medium">ACL Security</p><p className="text-xs text-muted-foreground">Roles & permissions</p></div>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
                  <p className="font-medium">Developed by Sisi Technology Ltd</p>
                  <p className="text-xs mt-0.5">Jos Plateau State, Nigeria</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>School Name <span className="text-destructive">*</span></Label>
                  <Input value={form.schoolName} onChange={(e) => update("schoolName", e.target.value)} placeholder="Smart School" />
                </div>
                <div className="space-y-1.5">
                  <Label>School Code</Label>
                  <Input value={form.schoolCode} onChange={(e) => update("schoolCode", e.target.value)} placeholder="SMS-001" />
                </div>
                <div className="space-y-1.5">
                  <Label>Academic Session</Label>
                  <Input value={form.sessionName} onChange={(e) => update("sessionName", e.target.value)} placeholder="2024/2025" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Tagline</Label>
                  <Input value={form.tagLine} onChange={(e) => update("tagLine", e.target.value)} placeholder="School tagline" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="info@school.edu.ng" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Address</Label>
                  <Textarea value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="School address" rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Jos" />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Select value={form.state} onValueChange={(v) => update("state", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{NIGERIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Currency Symbol</Label>
                  <Input value={form.currency} onChange={(e) => update("currency", e.target.value)} placeholder="₦" />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency Code</Label>
                  <Input value={form.currencyCode} onChange={(e) => update("currencyCode", e.target.value)} placeholder="NGN" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Admin Username <span className="text-destructive">*</span></Label>
                  <Input value={form.adminUsername} onChange={(e) => update("adminUsername", e.target.value)} placeholder="superadmin" />
                </div>
                <div className="space-y-1.5">
                  <Label>Admin Email <span className="text-destructive">*</span></Label>
                  <Input type="email" value={form.adminEmail} onChange={(e) => update("adminEmail", e.target.value)} placeholder="admin@school.edu.ng" />
                </div>
                <div className="space-y-1.5">
                  <Label>Password <span className="text-destructive">*</span></Label>
                  <Input type="password" value={form.adminPassword} onChange={(e) => update("adminPassword", e.target.value)} placeholder="Minimum 6 characters" />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm Password <span className="text-destructive">*</span></Label>
                  <Input type="password" value={form.adminConfirmPassword} onChange={(e) => update("adminConfirmPassword", e.target.value)} placeholder="Re-enter password" />
                </div>
                <div className="md:col-span-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                  <p className="font-medium flex items-center gap-2"><Shield className="h-4 w-4" /> Important</p>
                  <p className="text-xs mt-1">The Super Admin has full access to all modules and settings. Please store these credentials securely. You can create additional admin accounts after installation.</p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-semibold flex items-center gap-2"><School className="h-4 w-4 text-emerald-600" /> School Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {form.schoolName}</div>
                    <div><span className="text-muted-foreground">Session:</span> {form.sessionName}</div>
                    <div><span className="text-muted-foreground">City:</span> {form.city}, {form.state}</div>
                    <div><span className="text-muted-foreground">Currency:</span> {form.currency} ({form.currencyCode})</div>
                  </div>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-semibold flex items-center gap-2"><UserPlus className="h-4 w-4 text-emerald-600" /> Admin Account</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Username:</span> {form.adminUsername}</div>
                    <div><span className="text-muted-foreground">Email:</span> {form.adminEmail}</div>
                  </div>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-semibold flex items-center gap-2"><Database className="h-4 w-4 text-emerald-600" /> Initial Data Setup</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 8 default user roles (Super Admin, Admin, Accountant, Teacher, Receptionist, Librarian, Parent, Student)</li>
                    <li>• 6 departments & 9 designations</li>
                    <li>• 4 student houses (Red, Blue, Green, Yellow)</li>
                    <li>• 17 classes from Creche to SSS 3</li>
                    <li>• 29 subjects (Nigerian curriculum)</li>
                    <li>• Default academic session {form.sessionName}</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900">
                  Click "Complete Installation" to proceed. This will create the database tables and initial data.
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center py-6 space-y-4">
                <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Installation Complete!</h3>
                  <p className="text-sm text-muted-foreground mt-1">Your Smart School system has been successfully installed and configured.</p>
                </div>
                <div className="rounded-lg bg-muted p-4 text-left max-w-md mx-auto">
                  <p className="text-sm font-medium mb-2">Login Credentials:</p>
                  <div className="text-sm space-y-1">
                    <div>Username: <code className="bg-background px-2 py-0.5 rounded">{form.adminUsername}</code></div>
                    <div>Password: <code className="bg-background px-2 py-0.5 rounded">Your chosen password</code></div>
                  </div>
                </div>
                <Button onClick={onInstalled} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  Go to Login <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        {step < 4 && (
          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={next} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Installing...</> : step === 3 ? "Complete Installation" : "Next"}
              {!loading && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>

      <footer className="border-t bg-white py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Smart School v4.0.0 &copy; {new Date().getFullYear()} Sisi Technology Ltd, Jos Plateau State, Nigeria
        </div>
      </footer>
    </div>
  );
}
