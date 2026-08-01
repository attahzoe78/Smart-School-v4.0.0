"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAppStore } from "@/store/app";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Stethoscope, X, Loader2, Send, Activity, ShieldCheck, Database,
  Wifi, Cpu, HardDrive, Zap, AlertCircle, CheckCircle2, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ========================================
// Types
// ========================================
type Domain =
  | "Database"
  | "Telemetry"
  | "WebSockets"
  | "Auth"
  | "FileSystem"
  | "System";

interface DiagnosticTag {
  label: string;
  icon: typeof Zap;
}

// ========================================
// Domain Configuration
// ========================================
const DOMAINS: { value: Domain; label: string; icon: typeof Database; color: string }[] = [
  { value: "Database", label: "Database", icon: Database, color: "text-emerald-600" },
  { value: "Telemetry", label: "Telemetry", icon: Activity, color: "text-violet-600" },
  { value: "WebSockets", label: "WebSockets", icon: Wifi, color: "text-sky-600" },
  { value: "Auth", label: "Auth", icon: ShieldCheck, color: "text-amber-600" },
  { value: "FileSystem", label: "FileSystem", icon: HardDrive, color: "text-rose-600" },
  { value: "System", label: "System", icon: Cpu, color: "text-indigo-600" },
];

// ========================================
// Diagnostic Tags (clickable category chips)
// ========================================
const DIAGNOSTIC_TAGS: Record<Domain, DiagnosticTag[]> = {
  Database: [
    { label: "Slow Query", icon: Zap },
    { label: "Connection Drop", icon: AlertCircle },
    { label: "Data Mismatch", icon: AlertCircle },
    { label: "Schema Error", icon: AlertCircle },
    { label: "Deadlock", icon: AlertCircle },
    { label: "Timeout", icon: Zap },
  ],
  Telemetry: [
    { label: "High Latency", icon: Zap },
    { label: "Memory Spike", icon: AlertCircle },
    { label: "CPU Throttle", icon: AlertCircle },
    { label: "Metric Gap", icon: AlertCircle },
    { label: "Dashboard Freeze", icon: AlertCircle },
  ],
  WebSockets: [
    { label: "Desync", icon: AlertCircle },
    { label: "Disconnect", icon: AlertCircle },
    { label: "Reconnect Loop", icon: AlertCircle },
    { label: "Message Loss", icon: AlertCircle },
    { label: "Latency Spike", icon: Zap },
  ],
  Auth: [
    { label: "Login Failure", icon: AlertCircle },
    { label: "Session Expired", icon: AlertCircle },
    { label: "Permission Denied", icon: AlertCircle },
    { label: "Token Invalid", icon: AlertCircle },
    { label: "RBAC Error", icon: AlertCircle },
  ],
  FileSystem: [
    { label: "File Not Found", icon: AlertCircle },
    { label: "Permission Denied", icon: AlertCircle },
    { label: "Disk Full", icon: AlertCircle },
    { label: "Corrupt File", icon: AlertCircle },
    { label: "Upload Failed", icon: AlertCircle },
  ],
  System: [
    { label: "Crash", icon: AlertCircle },
    { label: "Data Loss", icon: AlertCircle },
    { label: "Boot Failure", icon: AlertCircle },
    { label: "Config Error", icon: AlertCircle },
    { label: "UI Glitch", icon: AlertCircle },
    { label: "API Error", icon: Zap },
  ],
};

// ========================================
// Module → Domain Auto-Detection Map
// ========================================
const MODULE_DOMAIN_MAP: Record<string, Domain> = {
  // Academic modules → Database
  students: "Database",
  attendance: "Database",
  examinations: "Database",
  homework: "Database",
  "download-center": "Database",
  // Finance → Database
  fees: "Database",
  expenses: "Database",
  // HR → Auth
  staff: "Auth",
  departments: "Auth",
  "staff-attendance": "Auth",
  payroll: "Auth",
  leave: "Auth",
  // Front Office → System
  "front-office": "System",
  "visitor-book": "System",
  complaints: "System",
  // Library → FileSystem
  library: "FileSystem",
  // Content → System
  cms: "System",
  pages: "System",
  news: "System",
  gallery: "System",
  banners: "System",
  menus: "System",
  media: "System",
  // Facilities → System
  hostel: "System",
  transport: "System",
  // System modules
  calendar: "Telemetry",
  certificates: "FileSystem",
  roles: "Auth",
  settings: "System",
  diagnostics: "Telemetry",
  dashboard: "Telemetry",
};

// ========================================
// Main Component
// ========================================
export function DiagnosticsFAB() {
  const { user, activeModule } = useAppStore();

  // ========================================
  // State
  // ========================================
  const [isOpen, setIsOpen] = useState(false);
  const [domain, setDomain] = useState<Domain>("Database");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // ========================================
  // Auto-detect domain from active module
  // ========================================
  const detectedDomain = useMemo(() => {
    return MODULE_DOMAIN_MAP[activeModule] || "System";
  }, [activeModule]);

  // Update domain when module changes (only if modal is closed)
  useEffect(() => {
    if (!isOpen) {
      setDomain(detectedDomain);
    }
  }, [detectedDomain, isOpen]);

  // ========================================
  // Tag toggle handler
  // ========================================
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  // ========================================
  // Reset form
  // ========================================
  const resetForm = useCallback(() => {
    setDomain(detectedDomain);
    setSelectedTags([]);
    setDescription("");
    setHasSubmitted(false);
  }, [detectedDomain]);

  // ========================================
  // Open/close handlers
  // ========================================
  const handleOpen = useCallback(() => {
    setDomain(detectedDomain);
    setIsOpen(true);
  }, [detectedDomain]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(resetForm, 200); // Reset after modal close animation
  }, [resetForm]);

  // ========================================
  // Early return: Don't render if user not logged in
  // or if user is not Super Admin / Admin
  // (placed after all hooks to satisfy rules-of-hooks)
  // ========================================
  if (!user) return null;
  if (user.role !== "Super Admin" && user.role !== "Admin") return null;

  // ========================================
  // Submit handler
  // ========================================
  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Description required", {
        description: "Please describe the diagnostic issue you're reporting.",
      });
      return;
    }

    if (selectedTags.length === 0) {
      toast.error("Select at least one tag", {
        description: "Choose one or more diagnostic tags that best describe the issue.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api<{ success: boolean; reportId: string; message: string; severity: string }>(
        "/api/diagnostics",
        {
          method: "POST",
          body: JSON.stringify({
            action: "report",
            domain,
            categories: selectedTags,
            description: description.trim(),
            moduleContext: activeModule,
            reportedBy: user.name,
          }),
        }
      );

      toast.success("Diagnostic report submitted", {
        description: res.message,
      });

      setHasSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (e: any) {
      toast.error("Failed to submit report", {
        description: e.message || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================
  // Current domain config
  // ========================================
  const currentDomainConfig = DOMAINS.find((d) => d.value === domain) || DOMAINS[0];
  const currentTags = DIAGNOSTIC_TAGS[domain] || [];

  return (
    <>
      {/* ========================================
          Floating Action Button (FAB)
          ======================================== */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-[90] group flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl shadow-emerald-600/40 hover:scale-110 active:scale-95 transition-all duration-300"
        title="Report Diagnostic Issue"
        aria-label="Open Diagnostics Report"
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-60 animate-ping [animation-duration:2s]" />

        {/* Icon */}
        <Stethoscope className="relative h-6 w-6 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />

        {/* Tooltip badge */}
        <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Report Issue
          <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </span>
      </button>

      {/* ========================================
          Glassmorphic Modal
          ======================================== */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ========================================
                Modal Header
                ======================================== */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Diagnostics Report
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Report a system issue for investigation
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ========================================
                Modal Body
                ======================================== */}
            {hasSubmitted ? (
              <div className="p-8 text-center">
                <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-emerald-200 dark:bg-emerald-900 opacity-50 animate-ping" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Report Submitted!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Thank you for reporting this issue. The diagnostics team will investigate shortly.
                </p>
              </div>
            ) : (
              <div className="p-5 space-y-5">
                {/* ========================================
                    Auto-Detected Context Banner
                    ======================================== */}
                {activeModule !== "dashboard" && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900">
                    <Zap className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <p className="text-xs text-sky-800 dark:text-sky-300">
                      Auto-detected from{" "}
                      <span className="font-semibold capitalize">
                        {activeModule.replace(/-/g, " ")}
                      </span>{" "}
                      module
                    </p>
                  </div>
                )}

                {/* ========================================
                    Domain Selector
                    ======================================== */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Diagnostic Domain
                  </Label>
                  <Select value={domain} onValueChange={(v) => { setDomain(v as Domain); setSelectedTags([]); }}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAINS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          <div className="flex items-center gap-2">
                            <d.icon className={cn("h-4 w-4", d.color)} />
                            <span>{d.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ========================================
                    Diagnostic Tags (clickable chips)
                    ======================================== */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Issue Tags{" "}
                    <span className="text-slate-400 normal-case font-normal">
                      (select all that apply)
                    </span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {currentTags.map((tag) => {
                      const isActive = selectedTags.includes(tag.label);
                      const TagIcon = tag.icon;
                      return (
                        <button
                          key={tag.label}
                          onClick={() => toggleTag(tag.label)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150",
                            isActive
                              ? "bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/30"
                              : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          <TagIcon className="h-3 w-3" />
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                  {selectedTags.length > 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>

                {/* ========================================
                    Description Textarea
                    ======================================== */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Description <span className="text-rose-500">*</span>
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`Describe the ${currentDomainConfig.label.toLowerCase()} issue you're experiencing... Include steps to reproduce if possible.`}
                    rows={4}
                    className="resize-none text-sm"
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">
                      Be as detailed as possible for faster resolution.
                    </p>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {description.length}/500
                    </span>
                  </div>
                </div>

                {/* ========================================
                    Reporter Info
                    ======================================== */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {user.role} • {activeModule} module
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================
                Modal Footer
                ======================================== */}
            {!hasSubmitted && (
              <div className="sticky bottom-0 flex items-center justify-end gap-2 p-5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-b-2xl">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="h-9"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !description.trim() || selectedTags.length === 0}
                  className="h-9 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1.5" />
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
