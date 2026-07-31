"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Activity, ShieldCheck, Server, AlertTriangle, Database, Wifi,
  HardDrive, Cpu, CheckCircle2, RefreshCw, Wrench, Eye, X, Zap,
  TrendingUp, TrendingDown, Clock,
} from "lucide-react";
import { formatDateTime } from "@/lib/format";

// ========================================
// Types
// ========================================
type Domain = "Database" | "Telemetry" | "WebSockets" | "Auth" | "FileSystem" | "System";
type Status = "Healthy" | "Degraded" | "Offline";

interface DiagnosticCheck {
  id: string;
  domain: Domain;
  name: string;
  description: string;
  status: Status;
  metric: string;
  detail: string;
  lastChecked: string;
  acknowledged: boolean;
  severity: "info" | "warning" | "critical";
  canRepair: boolean;
}

interface DiagnosticsResponse {
  checks: DiagnosticCheck[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    offline: number;
    lastRun: string;
  };
  timestamp: string;
}

// ========================================
// Domain Icons & Colors
// ========================================
const DOMAIN_CONFIG: Record<Domain, { icon: typeof Database; color: string }> = {
  Database: { icon: Database, color: "text-emerald-600" },
  Telemetry: { icon: Activity, color: "text-violet-600" },
  WebSockets: { icon: Wifi, color: "text-sky-600" },
  Auth: { icon: ShieldCheck, color: "text-amber-600" },
  FileSystem: { icon: HardDrive, color: "text-rose-600" },
  System: { icon: Cpu, color: "text-indigo-600" },
};

const STATUS_CONFIG: Record<Status, { color: string; bg: string; ring: string; badge: string }> = {
  Healthy: {
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    ring: "ring-emerald-200 dark:ring-emerald-900",
    badge: "bg-emerald-500 hover:bg-emerald-600 text-white",
  },
  Degraded: {
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    ring: "ring-amber-200 dark:ring-amber-900",
    badge: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  Offline: {
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    ring: "ring-rose-200 dark:ring-rose-900",
    badge: "bg-rose-500 hover:bg-rose-600 text-white",
  },
};

// ========================================
// Main Component
// ========================================
export function DiagnosticsScreen() {
  const queryClient = useQueryClient();
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPolling, setIsPolling] = useState(true);
  const [actionDialog, setActionDialog] = useState<{
    check: DiagnosticCheck;
    action: "acknowledge" | "repair";
  } | null>(null);
  const [notes, setNotes] = useState("");

  // ========================================
  // Data Fetching with Real-Time Polling
  // ========================================
  const { data, isLoading, refetch, isFetching } = useQuery<DiagnosticsResponse>({
    queryKey: ["diagnostics", domainFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (domainFilter !== "all") params.set("domain", domainFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      return api(`/api/diagnostics?${params.toString()}`);
    },
    refetchInterval: isPolling ? 30000 : false, // Poll every 30 seconds
    refetchOnWindowFocus: false,
  });

  // Acknowledge mutation
  const acknowledgeMutation = useMutation({
    mutationFn: (checkId: string) =>
      api("/api/diagnostics", {
        method: "POST",
        body: JSON.stringify({ action: "acknowledge", checkId, notes }),
      }),
    onSuccess: () => {
      toast.success("Diagnostic check acknowledged successfully", {
        description: "The alert has been marked as reviewed by the admin.",
      });
      queryClient.invalidateQueries({ queryKey: ["diagnostics"] });
      setActionDialog(null);
      setNotes("");
    },
    onError: (e: any) => toast.error(e.message || "Failed to acknowledge"),
  });

  // Repair mutation
  const repairMutation = useMutation({
    mutationFn: (checkId: string) =>
      api("/api/diagnostics", {
        method: "POST",
        body: JSON.stringify({ action: "repair", checkId, notes }),
      }),
    onSuccess: (res: any) => {
      toast.success("Repair script executed", {
        description: res.message || "The diagnostic issue has been resolved.",
      });
      queryClient.invalidateQueries({ queryKey: ["diagnostics"] });
      setActionDialog(null);
      setNotes("");
    },
    onError: (e: any) => toast.error(e.message || "Repair failed"),
  });

  const checks = data?.checks || [];
  const summary = data?.summary;

  const handleAction = () => {
    if (!actionDialog) return;
    if (!notes.trim()) {
      toast.error("Notes are required", {
        description: "Please provide a note explaining your action before proceeding.",
      });
      return;
    }
    if (actionDialog.action === "acknowledge") {
      acknowledgeMutation.mutate(actionDialog.check.id);
    } else {
      repairMutation.mutate(actionDialog.check.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================
          Header
          ======================================== */}
      <PageHeader
        title="Diagnostics Sub-Engine"
        description="Real-time monitoring and health diagnostics for all platform subsystems. Polls every 30 seconds for live status updates."
        icon={<Activity className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant={isPolling ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPolling(!isPolling)}
              className={isPolling ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {isPolling ? (
                <>
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  LIVE
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-muted-foreground mr-1.5" />
                  PAUSED
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* ========================================
          Summary Stat Cards
          ======================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total Checks"
          value={summary?.total || 0}
          icon={Server}
          color="bg-indigo-500"
          subtitle="Across all domains"
        />
        <StatCard
          title="Healthy"
          value={summary?.healthy || 0}
          icon={CheckCircle2}
          color="bg-emerald-500"
          subtitle="Systems operational"
        />
        <StatCard
          title="Degraded"
          value={summary?.degraded || 0}
          icon={AlertTriangle}
          color="bg-amber-500"
          subtitle="Needs attention"
        />
        <StatCard
          title="Offline"
          value={summary?.offline || 0}
          icon={X}
          color="bg-rose-500"
          subtitle="Critical failures"
        />
      </div>

      {/* ========================================
          Filter Controls
          ======================================== */}
      <Card className="border-border/60 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Filter by Domain
              </Label>
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  <SelectItem value="Database">Database</SelectItem>
                  <SelectItem value="Telemetry">Telemetry</SelectItem>
                  <SelectItem value="WebSockets">WebSockets</SelectItem>
                  <SelectItem value="Auth">Auth</SelectItem>
                  <SelectItem value="FileSystem">FileSystem</SelectItem>
                  <SelectItem value="System">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Filter by Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Healthy">Healthy</SelectItem>
                  <SelectItem value="Degraded">Degraded</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(domainFilter !== "all" || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDomainFilter("all");
                  setStatusFilter("all");
                }}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
          {data && (
            <div className="mt-3 pt-3 border-t border-border/40 dark:border-slate-800 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Last scan: {formatDateTime(data.timestamp)}</span>
              {isPolling && (
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Auto-refreshing in 30s
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================
          Status Grid / Empty State
          ======================================== */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-border/60 dark:border-slate-800 animate-pulse">
              <CardContent className="p-5">
                <div className="h-4 w-24 bg-muted rounded mb-3" />
                <div className="h-6 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-full bg-muted rounded mb-1.5" />
                <div className="h-3 w-2/3 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : checks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checks.map((check) => (
            <DiagnosticCard
              key={check.id}
              check={check}
              onAcknowledge={() => {
                setActionDialog({ check, action: "acknowledge" });
                setNotes("");
              }}
              onRepair={() => {
                setActionDialog({ check, action: "repair" });
                setNotes("");
              }}
            />
          ))}
        </div>
      )}

      {/* ========================================
          Action Dialog (Acknowledge / Repair)
          ======================================== */}
      <Dialog open={!!actionDialog} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog?.action === "acknowledge" ? (
                <>
                  <Eye className="h-5 w-5 text-amber-600" />
                  Acknowledge Alert
                </>
              ) : (
                <>
                  <Wrench className="h-5 w-5 text-rose-600" />
                  Run Repair Script
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {actionDialog && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm font-medium">{actionDialog.check.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{actionDialog.check.domain}</p>
                <p className="text-xs text-muted-foreground mt-1">{actionDialog.check.detail}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Notes <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    actionDialog.action === "acknowledge"
                      ? "Explain why this alert is being acknowledged..."
                      : "Describe the repair action being performed..."
                  }
                  rows={3}
                  className="resize-none"
                />
                <p className="text-[11px] text-muted-foreground">
                  This note will be recorded in the diagnostic audit log.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={
                acknowledgeMutation.isPending ||
                repairMutation.isPending ||
                !notes.trim()
              }
              className={
                actionDialog?.action === "acknowledge"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }
            >
              {acknowledgeMutation.isPending || repairMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : actionDialog?.action === "acknowledge" ? (
                <>
                  <Eye className="h-4 w-4 mr-1.5" />
                  Confirm Acknowledge
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1.5" />
                  Execute Repair
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========================================
// Diagnostic Card Component
// ========================================
function DiagnosticCard({
  check,
  onAcknowledge,
  onRepair,
}: {
  check: DiagnosticCheck;
  onAcknowledge: () => void;
  onRepair: () => void;
}) {
  const domainConfig = DOMAIN_CONFIG[check.domain];
  const statusConfig = STATUS_CONFIG[check.status];
  const DomainIcon = domainConfig.icon;
  const isCritical = check.status === "Offline";
  const isDegraded = check.status === "Degraded";

  return (
    <Card
      className={`relative overflow-hidden border-border/60 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 ${
        isCritical ? "ring-2 ring-rose-300 dark:ring-rose-900" : ""
      }`}
    >
      {/* Pulsing indicator for critical/degraded systems */}
      {(isCritical || isDegraded) && (
        <div className="absolute top-0 right-0 p-3">
          <span className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isCritical ? "bg-rose-400" : "bg-amber-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isCritical ? "bg-rose-500" : "bg-amber-500"
              }`}
            />
          </span>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${statusConfig.bg} shrink-0`}>
            <DomainIcon className={`h-5 w-5 ${domainConfig.color}`} />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <CardTitle className="text-sm font-semibold leading-tight">
              {check.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{check.domain}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge className={`${statusConfig.badge} text-xs font-medium`}>
            {check.status}
          </Badge>
          <span className="text-xs font-mono text-muted-foreground">{check.metric}</span>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {check.description}
        </p>

        {/* Detail */}
        <div className={`rounded-lg ${statusConfig.bg} p-2.5 border ${statusConfig.ring} ring-1`}>
          <p className="text-xs leading-relaxed text-foreground/80">{check.detail}</p>
        </div>

        {/* Last Checked */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Checked {formatDateTime(check.lastChecked)}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1 border-t border-border/40 dark:border-slate-800">
          {check.status !== "Healthy" && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/30"
              onClick={onAcknowledge}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Acknowledge
            </Button>
          )}
          {check.canRepair && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
              onClick={onRepair}
            >
              <Wrench className="h-3.5 w-3.5 mr-1" />
              Run Repair
            </Button>
          )}
          {check.status === "Healthy" && !check.canRepair && (
            <div className="flex-1 flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              No action needed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ========================================
// Empty State Component
// ========================================
function EmptyState() {
  return (
    <Card className="border-dashed border-2 border-border/60 dark:border-slate-800 rounded-2xl">
      <CardContent className="py-20 px-4 text-center">
        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-200 dark:bg-emerald-900 opacity-30" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            All Systems Operational
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            No diagnostic issues found. All monitored subsystems are running within
            normal parameters. The diagnostics engine will continue monitoring in the background.
          </p>
          <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Database
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Auth
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              WebSockets
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              System
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
