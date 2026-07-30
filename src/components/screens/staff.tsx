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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus, Search, UserCog, Users, UserCheck, Building2, Eye, Pencil, Trash2,
  Phone, Mail, MapPin, Calendar, Briefcase, GraduationCap, Wallet, Activity,
  Clock, Lock,
} from "lucide-react";
import {
  formatCurrency, formatDate, calculateAge, getInitials, getFullName,
} from "@/lib/format";
import { NIGERIAN_STATES, BLOOD_GROUPS } from "@/lib/constants";
import { useAppStore } from "@/store/app";

const STAFF_ROLES = ["Admin", "Teacher", "Accountant", "Receptionist", "Librarian"] as const;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function StaffScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<any>(null);
  const [viewStaff, setViewStaff] = useState<any>(null);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ["staff", search, departmentFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (departmentFilter) params.set("departmentId", departmentFilter);
      if (statusFilter) params.set("status", statusFilter);
      return api(`/api/staff?${params.toString()}`);
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["settings-all"],
    queryFn: () => api("/api/settings"),
  });

  const departments = settings?.departments || [];
  const designations = settings?.designations || [];

  const stats = useMemo(() => ({
    total: staffList.length,
    active: staffList.filter((s: any) => s.isActive).length,
    departments: new Set(staffList.map((s: any) => s.departmentId).filter(Boolean)).size,
    teachers: staffList.filter((s: any) =>
      s.designation?.name?.toLowerCase().includes("teach") ||
      s.role === "Teacher"
    ).length,
  }), [staffList]);

  const paginated = staffList.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(staffList.length / pageSize);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/staff?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Staff member deleted successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Directory"
        description="Manage teaching & non-teaching staff, payroll and access"
        icon={<UserCog className="h-5 w-5" />}
        action={
          <Button
            onClick={() => { setEditStaff(null); setAddOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Staff" value={stats.total} icon={UserCog} color="bg-emerald-500" subtitle="All employees" />
        <StatCard title="Active" value={stats.active} icon={UserCheck} color="bg-teal-500" subtitle="Currently employed" />
        <StatCard title="Departments" value={stats.departments} icon={Building2} color="bg-amber-500" subtitle="Across the school" />
        <StatCard title="Teachers" value={stats.teachers} icon={GraduationCap} color="bg-violet-500" subtitle="Academic staff" />
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search by name or staff ID..."
                className="pl-9"
              />
            </div>
            <Select
              value={departmentFilter}
              onValueChange={(v) => { setDepartmentFilter(v === "all" ? "" : v); setPage(0); }}
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d: any) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(0); }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading staff...</div>
          ) : staffList.length === 0 ? (
            <EmptyState
              title="No staff found"
              description="Add your first staff member or adjust filters"
              icon={<UserCog className="h-7 w-7" />}
              action={
                <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4" /> Add Staff
                </Button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Staff ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((s: any) => (
                      <TableRow key={s.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={s.photo || undefined} />
                              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                                {getInitials(s.firstName, s.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {getFullName(s)}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {s.email || "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{s.staffId}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {s.department?.name || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>{s.designation?.name || "—"}</TableCell>
                        <TableCell className="text-sm">{s.phone || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={s.isActive ? "default" : "destructive"}
                            className={s.isActive ? "bg-emerald-500" : ""}
                          >
                            {s.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewStaff(s)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => { setEditStaff(s); setAddOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <ConfirmDialog
                              trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              }
                              title="Delete Staff Member?"
                              description={`This will permanently delete ${getFullName(s)} and all related records.`}
                              confirmText="Delete"
                              onConfirm={() => deleteMutation.mutate(s.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, staffList.length)} of {staffList.length}
                  </p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <StaffFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        staff={editStaff}
        departments={departments}
        designations={designations}
      />

      <StaffDetailSheet staff={viewStaff} onClose={() => setViewStaff(null)} />
    </div>
  );
}

// ============================================================
// ADD / EDIT FORM DIALOG
// ============================================================
function StaffFormDialog({ open, onOpenChange, staff, departments, designations }: any) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const isEdit = !!staff;

  const emptyForm = {
    firstName: "",
    lastName: "",
    middleName: "",
    gender: "Male",
    dateOfBirth: "",
    bloodGroup: "",
    phone: "",
    email: "",
    address: "",
    city: "Jos",
    state: "Plateau",
    qualification: "",
    experience: "",
    joiningDate: new Date().toISOString().split("T")[0],
    departmentId: "",
    designationId: "",
    basicSalary: 0,
    houseAllowance: 0,
    transportAllowance: 0,
    medicalAllowance: 0,
    role: "Teacher",
    username: "",
    password: "",
  };

  const [form, setForm] = useState<any>(emptyForm);

  useMemo(() => {
    if (open) {
      setForm(staff
        ? {
            ...emptyForm,
            ...staff,
            dateOfBirth: staff.dateOfBirth ? new Date(staff.dateOfBirth).toISOString().split("T")[0] : "",
            joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            basicSalary: staff.basicSalary || 0,
            houseAllowance: staff.houseAllowance || 0,
            transportAllowance: staff.transportAllowance || 0,
            medicalAllowance: staff.medicalAllowance || 0,
            role: staff.role || "Teacher",
            username: staff.email?.split("@")[0] || "",
            password: "",
          }
        : emptyForm
      );
    }
  }, [open, staff]);

  const update = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  async function handleSave() {
    if (!form.firstName || !form.lastName) {
      toast.error("First and last name are required");
      return;
    }
    if (!isEdit && (!form.username || !form.password)) {
      toast.error("Username and password are required for new staff");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName || undefined,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || null,
        bloodGroup: form.bloodGroup || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        qualification: form.qualification || undefined,
        experience: form.experience || undefined,
        joiningDate: form.joiningDate,
        departmentId: form.departmentId || undefined,
        designationId: form.designationId || undefined,
        basicSalary: parseFloat(form.basicSalary) || 0,
        houseAllowance: parseFloat(form.houseAllowance) || 0,
        transportAllowance: parseFloat(form.transportAllowance) || 0,
        medicalAllowance: parseFloat(form.medicalAllowance) || 0,
      };
      if (isEdit) {
        await api(`/api/staff`, { method: "PUT", body: JSON.stringify({ id: staff.id, ...payload }) });
        toast.success("Staff updated successfully");
      } else {
        payload.role = form.role;
        payload.username = form.username;
        payload.password = form.password;
        await api(`/api/staff`, { method: "POST", body: JSON.stringify(payload) });
        toast.success(`Staff added! Login: ${form.username}`);
      }
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Staff Member" : "Add New Staff"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Personal Info */}
          <section>
            <h4 className="text-sm font-semibold mb-2 text-emerald-700 flex items-center gap-1.5">
              <UserCog className="h-3.5 w-3.5" /> Personal Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="First Name" required>
                <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
              </Field>
              <Field label="Middle Name">
                <Input value={form.middleName} onChange={(e) => update("middleName", e.target.value)} />
              </Field>
              <Field label="Last Name" required>
                <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
              </Field>
              <Field label="Gender">
                <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
              </Field>
              <Field label="Blood Group">
                <Select value={form.bloodGroup || ""} onValueChange={(v) => update("bloodGroup", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h4 className="text-sm font-semibold mb-2 text-emerald-700 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Contact Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234..." />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
              </Field>
              <Field label="State">
                <Select value={form.state} onValueChange={(v) => update("state", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Address">
                  <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
                </Field>
              </div>
            </div>
          </section>

          {/* Professional */}
          <section>
            <h4 className="text-sm font-semibold mb-2 text-emerald-700 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> Professional Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Qualification">
                <Input value={form.qualification} onChange={(e) => update("qualification", e.target.value)} placeholder="B.Ed, M.Sc..." />
              </Field>
              <Field label="Experience (years)">
                <Input value={form.experience} onChange={(e) => update("experience", e.target.value)} placeholder="5" />
              </Field>
              <Field label="Joining Date">
                <Input type="date" value={form.joiningDate} onChange={(e) => update("joiningDate", e.target.value)} />
              </Field>
              <Field label="Department">
                <Select value={form.departmentId || ""} onValueChange={(v) => update("departmentId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Designation">
                <Select value={form.designationId || ""} onValueChange={(v) => update("designationId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                  <SelectContent>
                    {designations.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          {/* Salary */}
          <section>
            <h4 className="text-sm font-semibold mb-2 text-emerald-700 flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" /> Salary & Allowances
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Basic Salary (₦)">
                <Input type="number" value={form.basicSalary} onChange={(e) => update("basicSalary", e.target.value)} />
              </Field>
              <Field label="House Allowance">
                <Input type="number" value={form.houseAllowance} onChange={(e) => update("houseAllowance", e.target.value)} />
              </Field>
              <Field label="Transport">
                <Input type="number" value={form.transportAllowance} onChange={(e) => update("transportAllowance", e.target.value)} />
              </Field>
              <Field label="Medical">
                <Input type="number" value={form.medicalAllowance} onChange={(e) => update("medicalAllowance", e.target.value)} />
              </Field>
            </div>
            <div className="mt-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Gross Monthly:</span>
              <span className="font-semibold text-emerald-700">
                {formatCurrency(
                  (parseFloat(form.basicSalary) || 0) +
                  (parseFloat(form.houseAllowance) || 0) +
                  (parseFloat(form.transportAllowance) || 0) +
                  (parseFloat(form.medicalAllowance) || 0)
                )}
              </span>
            </div>
          </section>

          {/* Login / Account */}
          <section>
            <h4 className="text-sm font-semibold mb-2 text-emerald-700 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Account & Login {isEdit && <span className="text-xs text-muted-foreground font-normal">(leave blank to keep unchanged)</span>}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Role">
                <Select value={form.role} onValueChange={(v) => update("role", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Username" required={!isEdit}>
                <Input value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="e.g. j.doe" />
              </Field>
              <Field label="Password" required={!isEdit}>
                <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="••••••" />
              </Field>
            </div>
          </section>

          <Separator />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : isEdit ? "Update Staff" : "Add Staff"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// DETAIL SHEET (with tabs)
// ============================================================
function StaffDetailSheet({ staff, onClose }: any) {
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["staff-detail", staff?.id],
    queryFn: () => api(`/api/staff?id=${staff.id}`),
    enabled: !!staff,
  });

  if (!staff) return null;
  const s = data || staff;

  const attendanceStats = (s.attendance || []).reduce((acc: any, a: any) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const payrollPaid = (s.payroll || []).filter((p: any) => p.status === "Paid");
  const payrollTotal = (s.payroll || []).reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);
  const payrollPaidTotal = payrollPaid.reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);

  return (
    <Sheet open={!!staff} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetHeader className="p-4 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={s.photo || undefined} />
              <AvatarFallback className="bg-emerald-600 text-white text-xl">
                {getInitials(s.firstName, s.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl truncate">{getFullName(s)}</SheetTitle>
              <p className="text-sm text-muted-foreground truncate">
                {s.staffId} • {s.designation?.name || "—"}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant={s.isActive ? "default" : "destructive"} className={s.isActive ? "bg-emerald-500" : ""}>
                  {s.isActive ? "Active" : "Inactive"}
                </Badge>
                {s.department?.name && (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {s.department.name}
                  </Badge>
                )}
                {s.gender && <Badge variant="outline">{s.gender}</Badge>}
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start px-4 border-b rounded-none bg-transparent h-auto p-0">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600">Overview</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600">Attendance</TabsTrigger>
            <TabsTrigger value="payroll" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600">Payroll</TabsTrigger>
            <TabsTrigger value="leave" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600">Leave Requests</TabsTrigger>
          </TabsList>

          <div className="p-4">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                {/* OVERVIEW */}
                <TabsContent value="overview" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem icon={Calendar} label="Date of Birth" value={`${formatDate(s.dateOfBirth)}${s.dateOfBirth ? ` (${calculateAge(s.dateOfBirth)} yrs)` : ""}`} />
                    <InfoItem icon={Activity} label="Blood Group" value={s.bloodGroup || "—"} />
                    <InfoItem icon={Phone} label="Phone" value={s.phone || "—"} />
                    <InfoItem icon={Mail} label="Email" value={s.email || "—"} />
                    <InfoItem icon={MapPin} label="Address" value={[s.address, s.city, s.state].filter(Boolean).join(", ") || "—"} />
                    <InfoItem icon={Calendar} label="Joining Date" value={formatDate(s.joiningDate)} />
                    <InfoItem icon={GraduationCap} label="Qualification" value={s.qualification || "—"} />
                    <InfoItem icon={Briefcase} label="Experience" value={s.experience ? `${s.experience} years` : "—"} />
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-emerald-700 flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5" /> Salary Structure
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <SalaryRow label="Basic Salary" value={s.basicSalary} />
                      <SalaryRow label="House Allowance" value={s.houseAllowance} />
                      <SalaryRow label="Transport" value={s.transportAllowance} />
                      <SalaryRow label="Medical" value={s.medicalAllowance} />
                    </div>
                    <div className="mt-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                      <span className="text-sm font-medium text-emerald-700">Gross Monthly</span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(
                          (s.basicSalary || 0) + (s.houseAllowance || 0) +
                          (s.transportAllowance || 0) + (s.medicalAllowance || 0)
                        )}
                      </span>
                    </div>
                  </div>

                  {s.classTeachers?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-emerald-700">Class Teacher Assignments</h4>
                      <div className="flex flex-wrap gap-2">
                        {s.classTeachers.map((ct: any) => (
                          <Badge key={ct.id} variant="secondary">
                            {ct.class?.name} {ct.section?.name ? `(${ct.section.name})` : ""}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* ATTENDANCE */}
                <TabsContent value="attendance" className="mt-0 space-y-3">
                  {Object.keys(attendanceStats).length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {["Present", "Absent", "Late", "Half Day"].map((st) => (
                          <div key={st} className="p-3 rounded-lg border text-center">
                            <p className="text-2xl font-bold">{attendanceStats[st] || 0}</p>
                            <p className="text-xs text-muted-foreground">{st}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {(s.attendance || []).map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{formatDate(a.date)}</span>
                            </div>
                            <Badge
                              variant={a.status === "Present" ? "default" : "destructive"}
                              className={
                                a.status === "Present" ? "bg-emerald-500" :
                                a.status === "Late" ? "bg-amber-500" :
                                a.status === "Half Day" ? "bg-sky-500" : ""
                              }
                            >
                              {a.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <EmptyState title="No attendance records" description="Staff attendance has not been marked yet." icon={<Calendar className="h-7 w-7" />} />
                  )}
                </TabsContent>

                {/* PAYROLL */}
                <TabsContent value="payroll" className="mt-0 space-y-3">
                  {(s.payroll || []).length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                          <p className="text-xs text-muted-foreground">Total Paid</p>
                          <p className="text-lg font-bold text-emerald-700">{formatCurrency(payrollPaidTotal)}</p>
                        </div>
                        <div className="p-3 rounded-lg border">
                          <p className="text-xs text-muted-foreground">Total Generated</p>
                          <p className="text-lg font-bold">{formatCurrency(payrollTotal)}</p>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {(s.payroll || []).map((p: any) => (
                          <div key={p.id} className="p-3 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{MONTHS[(p.month || 1) - 1]} {p.year}</p>
                                <p className="text-xs text-muted-foreground">
                                  {p.paymentDate ? `Paid on ${formatDate(p.paymentDate)}` : "Awaiting payment"}
                                </p>
                              </div>
                              <Badge
                                variant={p.status === "Paid" ? "default" : "secondary"}
                                className={p.status === "Paid" ? "bg-emerald-500" : "bg-amber-100 text-amber-700"}
                              >
                                {p.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                              <div><span className="text-muted-foreground">Basic:</span> {formatCurrency(p.basicSalary)}</div>
                              <div><span className="text-muted-foreground">Allowances:</span> {formatCurrency(p.allowances)}</div>
                              <div><span className="text-muted-foreground">Net:</span> <span className="font-semibold text-emerald-700">{formatCurrency(p.netSalary)}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <EmptyState title="No payroll records" description="Generate payroll from HR module to see records here." icon={<Wallet className="h-7 w-7" />} />
                  )}
                </TabsContent>

                {/* LEAVE REQUESTS */}
                <TabsContent value="leave" className="mt-0">
                  {(s.leaveRequests || []).length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {s.leaveRequests.map((lr: any) => (
                        <div key={lr.id} className="p-3 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{lr.leaveType?.name || "Leave"}</span>
                            </div>
                            <Badge
                              variant={lr.status === "Approved" ? "default" : lr.status === "Rejected" ? "destructive" : "secondary"}
                              className={
                                lr.status === "Approved" ? "bg-emerald-500" :
                                lr.status === "Pending" ? "bg-amber-100 text-amber-700" : ""
                              }
                            >
                              {lr.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
                            <div>From: <span className="text-foreground">{formatDate(lr.fromDate)}</span></div>
                            <div>To: <span className="text-foreground">{formatDate(lr.toDate)}</span></div>
                            <div>Days: <span className="text-foreground font-medium">{lr.days}</span></div>
                          </div>
                          {lr.reason && (
                            <p className="text-xs mt-2 text-muted-foreground italic">"{lr.reason}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No leave requests" description="Staff has not applied for any leave." icon={<Clock className="h-7 w-7" />} />
                  )}
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// HELPERS
// ============================================================
function Field({ label, required, children }: any) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

function SalaryRow({ label, value }: any) {
  return (
    <div className="flex items-center justify-between p-2 rounded border">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{formatCurrency(value || 0)}</span>
    </div>
  );
}
