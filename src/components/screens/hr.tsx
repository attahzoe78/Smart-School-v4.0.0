"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Wallet, Clock, Building2, Plus, CheckCircle2, XCircle, Play, Banknote,
  CalendarDays, Users, Briefcase, Loader2, Trash2,
} from "lucide-react";
import {
  formatCurrency, formatDate, getInitials, getFullName,
} from "@/lib/format";
import { PAYMENT_MODES } from "@/lib/constants";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

export function HrScreen() {
  const [activeTab, setActiveTab] = useState("payroll");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human Resources"
        description="Payroll, leave management, and department administration"
        icon={<Wallet className="h-5 w-5" />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="payroll" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Payroll
          </TabsTrigger>
          <TabsTrigger value="leave" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Leave
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Departments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="mt-4">
          <PayrollTab />
        </TabsContent>
        <TabsContent value="leave" className="mt-4">
          <LeaveTab />
        </TabsContent>
        <TabsContent value="departments" className="mt-4">
          <DepartmentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// PAYROLL TAB
// ============================================================
function PayrollTab() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [payDialog, setPayDialog] = useState<any>(null);

  const { data: payroll = [], isLoading } = useQuery({
    queryKey: ["hr-payroll", month, year],
    queryFn: () => api(`/api/hr?action=payroll&month=${month}&year=${year}`),
  });

  const stats = useMemo(() => ({
    total: payroll.length,
    paid: payroll.filter((p: any) => p.status === "Paid").length,
    pending: payroll.filter((p: any) => p.status === "Generated").length,
    totalNet: payroll.reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0),
    totalPaid: payroll.filter((p: any) => p.status === "Paid").reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0),
  }), [payroll]);

  const generateMutation = useMutation({
    mutationFn: () =>
      api(`/api/hr`, {
        method: "POST",
        body: JSON.stringify({ action: "generate-payroll", month, year }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["hr-payroll"] });
      toast.success(`Payroll generated: ${res.generated || 0} new records`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const payMutation = useMutation({
    mutationFn: (data: any) =>
      api(`/api/hr`, {
        method: "POST",
        body: JSON.stringify({ action: "pay-salary", ...data }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-payroll"] });
      queryClient.invalidateQueries({ queryKey: ["staff-detail"] });
      toast.success("Salary paid successfully");
      setPayDialog(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Records" value={stats.total} icon={Wallet} color="bg-emerald-500" subtitle={`${MONTHS[month - 1]} ${year}`} />
        <StatCard title="Paid" value={stats.paid} icon={CheckCircle2} color="bg-teal-500" subtitle="This period" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} color="bg-amber-500" subtitle="Awaiting payment" />
        <StatCard title="Total Net" value={formatCurrency(stats.totalNet)} icon={Banknote} color="bg-violet-500" subtitle={`Paid: ${formatCurrency(stats.totalPaid)}`} />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="grid grid-cols-2 gap-3 flex-1 max-w-md">
              <div className="space-y-1">
                <Label className="text-xs">Month</Label>
                <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Year</Label>
                <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 sm:ml-auto"
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Generate Payroll
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading payroll...</div>
          ) : payroll.length === 0 ? (
            <EmptyState
              title="No payroll records"
              description={`Generate payroll for ${MONTHS[month - 1]} ${year} to get started.`}
              icon={<Wallet className="h-7 w-7" />}
              action={
                <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                  <Play className="h-4 w-4" /> Generate Now
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Basic</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.map((p: any) => (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                              {getInitials(p.staff?.firstName || "", p.staff?.lastName || "")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {p.staff ? getFullName(p.staff) : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {p.staff?.staffId} • {p.staff?.designation?.name || p.staff?.department?.name || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatCurrency(p.basicSalary)}</TableCell>
                      <TableCell className="text-sm text-emerald-600">+{formatCurrency(p.allowances)}</TableCell>
                      <TableCell className="text-sm text-red-500">-{formatCurrency(p.deductions)}</TableCell>
                      <TableCell className="text-sm font-semibold">{formatCurrency(p.netSalary)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={p.status === "Paid" ? "default" : "secondary"}
                          className={p.status === "Paid" ? "bg-emerald-500" : "bg-amber-100 text-amber-700"}
                        >
                          {p.status}
                        </Badge>
                        {p.paymentDate && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(p.paymentDate)}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === "Paid" ? (
                          <Badge variant="outline" className="text-xs">Paid via {p.paymentMode || "—"}</Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            onClick={() => setPayDialog(p)}
                          >
                            <Banknote className="h-3.5 w-3.5" /> Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {payDialog && (
        <PayDialog
          payroll={payDialog}
          open={true}
          onOpenChange={(o) => !o && setPayDialog(null)}
          onConfirm={(data) => payMutation.mutate(data)}
          loading={payMutation.isPending}
        />
      )}
    </div>
  );
}

function PayDialog({ payroll, open, onOpenChange, onConfirm, loading }: any) {
  const [form, setForm] = useState({ paymentMode: "Bank Transfer", transactionId: "" });

  const handleConfirm = () => {
    if (!payroll) return;
    if (!form.transactionId.trim()) {
      toast.error("Transaction ID is required");
      return;
    }
    onConfirm({ id: payroll.id, paymentMode: form.paymentMode, transactionId: form.transactionId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-emerald-600" /> Process Salary Payment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Staff</span>
              <span className="text-sm font-medium">
                {payroll?.staff ? getFullName(payroll.staff) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Period</span>
              <span className="text-sm font-medium">{payroll ? `${MONTHS[payroll.month - 1]} ${payroll.year}` : "—"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Net Salary</span>
              <span className="text-base font-bold text-emerald-700">{formatCurrency(payroll?.netSalary || 0)}</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Payment Mode</Label>
            <Select value={form.paymentMode} onValueChange={(v) => setForm((f) => ({ ...f, paymentMode: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Transaction ID / Reference <span className="text-destructive">*</span></Label>
            <Input
              value={form.transactionId}
              onChange={(e) => setForm((f) => ({ ...f, transactionId: e.target.value }))}
              placeholder="e.g. TRX-0012345"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? "Processing..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// LEAVE TAB
// ============================================================
function LeaveTab() {
  const queryClient = useQueryClient();
  const [applyOpen, setApplyOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ["hr-leave"],
    queryFn: () => api(`/api/hr?action=leave-requests`),
  });

  const { data: leaveTypes = [] } = useQuery({
    queryKey: ["hr-leave-types"],
    queryFn: () => api(`/api/hr?action=leave-types`),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-all-leave"],
    queryFn: () => api(`/api/staff?status=active`),
  });

  const filtered = useMemo(() =>
    statusFilter === "all" ? leaveRequests : leaveRequests.filter((r: any) => r.status === statusFilter),
    [leaveRequests, statusFilter]
  );

  const stats = useMemo(() => ({
    total: leaveRequests.length,
    pending: leaveRequests.filter((r: any) => r.status === "Pending").length,
    approved: leaveRequests.filter((r: any) => r.status === "Approved").length,
    rejected: leaveRequests.filter((r: any) => r.status === "Rejected").length,
  }), [leaveRequests]);

  const approveMutation = useMutation({
    mutationFn: ({ id, status, note }: any) =>
      api(`/api/hr`, {
        method: "POST",
        body: JSON.stringify({ action: "approve-leave", id, status, note }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-leave"] });
      queryClient.invalidateQueries({ queryKey: ["staff-detail"] });
      toast.success("Leave request updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Requests" value={stats.total} icon={Clock} color="bg-emerald-500" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} color="bg-amber-500" />
        <StatCard title="Approved" value={stats.approved} icon={CheckCircle2} color="bg-teal-500" />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="bg-rose-500" />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setApplyOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 sm:ml-auto">
              <Plus className="h-4 w-4" /> Apply Leave
            </Button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading leave requests...</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No leave requests"
              description="Apply for leave on behalf of staff, or change the filter."
              icon={<Clock className="h-7 w-7" />}
              action={
                <Button onClick={() => setApplyOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4" /> Apply Leave
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>From - To</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r: any) => (
                    <TableRow key={r.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                              {getInitials(r.staff?.firstName || "", r.staff?.lastName || "")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {r.staff ? getFullName(r.staff) : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">{r.staff?.staffId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {r.leaveType?.name || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                          {formatDate(r.fromDate)} - {formatDate(r.toDate)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{r.days}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate" title={r.reason}>
                        {r.reason || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={r.status === "Approved" ? "default" : r.status === "Rejected" ? "destructive" : "secondary"}
                          className={
                            r.status === "Approved" ? "bg-emerald-500" :
                            r.status === "Pending" ? "bg-amber-100 text-amber-700" : ""
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === "Pending" ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 h-8"
                              onClick={() => approveMutation.mutate({ id: r.id, status: "Approved", note: "Approved by HR" })}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 h-8"
                              onClick={() => approveMutation.mutate({ id: r.id, status: "Rejected", note: "Rejected by HR" })}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{r.note || "—"}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ApplyLeaveDialog
        open={applyOpen}
        onOpenChange={setApplyOpen}
        staffList={staffList}
        leaveTypes={leaveTypes}
      />
    </div>
  );
}

function ApplyLeaveDialog({ open, onOpenChange, staffList, leaveTypes }: any) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    staffId: "",
    leaveTypeId: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  useMemo(() => {
    if (open) {
      setForm({ staffId: "", leaveTypeId: "", fromDate: "", toDate: "", reason: "" });
    }
  }, [open]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const days = useMemo(() => {
    if (!form.fromDate || !form.toDate) return 0;
    const ms = new Date(form.toDate).getTime() - new Date(form.fromDate).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1);
  }, [form.fromDate, form.toDate]);

  async function handleSave() {
    if (!form.staffId || !form.leaveTypeId || !form.fromDate || !form.toDate || !form.reason) {
      toast.error("All fields are required");
      return;
    }
    if (days <= 0) {
      toast.error("End date must be on or after start date");
      return;
    }
    setSaving(true);
    try {
      await api(`/api/hr`, {
        method: "POST",
        body: JSON.stringify({
          action: "apply-leave",
          staffId: form.staffId,
          leaveTypeId: form.leaveTypeId,
          fromDate: form.fromDate,
          toDate: form.toDate,
          days,
          reason: form.reason,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["hr-leave"] });
      toast.success("Leave request submitted");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600" /> Apply for Leave
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Staff Member <span className="text-destructive">*</span></Label>
            <Select value={form.staffId} onValueChange={(v) => update("staffId", v)}>
              <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {staffList.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {getFullName(s)} ({s.staffId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Leave Type <span className="text-destructive">*</span></Label>
            <Select value={form.leaveTypeId} onValueChange={(v) => update("leaveTypeId", v)}>
              <SelectTrigger><SelectValue placeholder="Select leave type" /></SelectTrigger>
              <SelectContent>
                {leaveTypes.length === 0 ? (
                  <SelectItem value="_none" disabled>No leave types configured</SelectItem>
                ) : (
                  leaveTypes.map((lt: any) => (
                    <SelectItem key={lt.id} value={lt.id}>
                      {lt.name}{lt.days ? ` (${lt.days} days/yr)` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.fromDate} onChange={(e) => update("fromDate", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.toDate} onChange={(e) => update("toDate", e.target.value)} min={form.fromDate} />
            </div>
          </div>
          {days > 0 && (
            <div className="p-2 rounded bg-emerald-50 border border-emerald-100 text-sm text-center">
              <span className="text-muted-foreground">Total leave days: </span>
              <span className="font-semibold text-emerald-700">{days}</span>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Reason <span className="text-destructive">*</span></Label>
            <Textarea
              value={form.reason}
              onChange={(e) => update("reason", e.target.value)}
              placeholder="Brief reason for leave..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// DEPARTMENTS TAB
// ============================================================
function DepartmentsTab() {
  const queryClient = useQueryClient();
  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [addDesigOpen, setAddDesigOpen] = useState(false);
  const [view, setView] = useState<"departments" | "designations">("departments");

  const { data: departments = [], isLoading: loadDepts } = useQuery({
    queryKey: ["hr-departments"],
    queryFn: () => api(`/api/hr?action=departments`),
  });
  const { data: designations = [], isLoading: loadDesigs } = useQuery({
    queryKey: ["hr-designations"],
    queryFn: () => api(`/api/hr?action=designations`),
  });

  const totalStaff = useMemo(() =>
    (view === "departments" ? departments : designations).reduce((s: number, d: any) => s + (d._count?.staff || 0), 0),
    [departments, designations, view]
  );

  const deleteMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api(`/api/hr?id=${id}&action=${action}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-departments"] });
      queryClient.invalidateQueries({ queryKey: ["hr-designations"] });
      queryClient.invalidateQueries({ queryKey: ["settings-all"] });
      toast.success("Deleted successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          title={view === "departments" ? "Total Departments" : "Total Designations"}
          value={view === "departments" ? departments.length : designations.length}
          icon={view === "departments" ? Building2 : Briefcase}
          color="bg-emerald-500"
        />
        <StatCard title="Staff Assigned" value={totalStaff} icon={Users} color="bg-teal-500" subtitle="Across all" />
        <StatCard
          title="Active " value={(view === "departments" ? departments : designations).filter((d: any) => d.isActive !== false).length}
          icon={CheckCircle2}
          color="bg-violet-500"
        />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList>
                <TabsTrigger value="departments" className="gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Departments
                </TabsTrigger>
                <TabsTrigger value="designations" className="gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> Designations
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              onClick={() => (view === "departments" ? setAddDeptOpen(true) : setAddDesigOpen(true))}
              className="bg-emerald-600 hover:bg-emerald-700 sm:ml-auto"
            >
              <Plus className="h-4 w-4" />
              {view === "departments" ? "Add Department" : "Add Designation"}
            </Button>
          </div>

          {(view === "departments" ? loadDepts : loadDesigs) ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
          ) : (view === "departments" ? departments : designations).length === 0 ? (
            <EmptyState
              title={`No ${view} yet`}
              description={`Create your first ${view === "departments" ? "department" : "designation"} to organise staff.`}
              icon={view === "departments" ? <Building2 className="h-7 w-7" /> : <Briefcase className="h-7 w-7" />}
            />
          ) : view === "departments" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {departments.map((d: any) => (
                <Card key={d.id} className="overflow-hidden border-border/60 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        }
                        title="Delete Department?"
                        description={`This will permanently delete "${d.name}". Staff assigned to it will be unassigned.`}
                        confirmText="Delete"
                        onConfirm={() => deleteMutation.mutate({ id: d.id, action: "department" })}
                      />
                    </div>
                    <h3 className="text-base font-semibold mt-3 truncate">{d.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 min-h-[2rem]">
                      {d.description || "No description provided."}
                    </p>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Staff
                      </span>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {d._count?.staff || 0}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Designation</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Staff Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designations.map((d: any) => (
                    <TableRow key={d.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                        {d.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {d._count?.staff || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className={d.isActive !== false ? "bg-emerald-500" : "bg-muted"}>
                          {d.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          title="Delete Designation?"
                          description={`This will permanently delete "${d.name}".`}
                          confirmText="Delete"
                          onConfirm={() => deleteMutation.mutate({ id: d.id, action: "designation" })}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddSimpleDialog
        open={addDeptOpen}
        onOpenChange={setAddDeptOpen}
        title="Add Department"
        icon={<Building2 className="h-4 w-4 text-emerald-600" />}
        action="add-department"
        invalidateKeys={["hr-departments", "settings-all"]}
        nameLabel="Department Name"
      />
      <AddSimpleDialog
        open={addDesigOpen}
        onOpenChange={setAddDesigOpen}
        title="Add Designation"
        icon={<Briefcase className="h-4 w-4 text-emerald-600" />}
        action="add-designation"
        invalidateKeys={["hr-designations", "settings-all"]}
        nameLabel="Designation Name"
      />
    </div>
  );
}

function AddSimpleDialog({ open, onOpenChange, title, icon, action, invalidateKeys, nameLabel }: any) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  useMemo(() => {
    if (open) {
      setForm({ name: "", description: "" });
    }
  }, [open]);

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      await api(`/api/hr`, {
        method: "POST",
        body: JSON.stringify({ action, name: form.name.trim(), description: form.description.trim() || undefined }),
      });
      invalidateKeys.forEach((k: string) => queryClient.invalidateQueries({ queryKey: [k] }));
      toast.success(`${title.replace("Add ", "")} created`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{icon} {title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">{nameLabel} <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Science Department" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
