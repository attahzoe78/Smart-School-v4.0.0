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
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Plus, Search, GraduationCap, Users, UserPlus, UserCheck, Eye, Pencil, Trash2,
  Phone, Mail, MapPin, Calendar, BookOpen, Wallet, Activity, FileText, X,
} from "lucide-react";
import { formatCurrency, formatDate, calculateAge, getInitials, getFullName } from "@/lib/format";
import { NIGERIAN_STATES, BLOOD_GROUPS } from "@/lib/constants";
import { useAppStore } from "@/store/app";

export function StudentsScreen() {
  const { activeModule } = useAppStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [viewStudent, setViewStudent] = useState<any>(null);
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students", search, classFilter, genderFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (classFilter) params.set("classId", classFilter);
      if (genderFilter) params.set("gender", genderFilter);
      return api(`/api/students?${params.toString()}`);
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["settings-all"],
    queryFn: () => api("/api/settings"),
  });

  const classes = settings?.classes || [];
  const houses = settings?.houses || [];

  const stats = useMemo(() => ({
    total: students.length,
    male: students.filter((s: any) => s.gender === "Male").length,
    female: students.filter((s: any) => s.gender === "Female").length,
    active: students.filter((s: any) => s.isActive).length,
  }), [students]);

  const paginatedStudents = students.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(students.length / pageSize);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/students?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Student deleted successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Information"
        description="Manage student admissions, profiles, and records"
        icon={<GraduationCap className="h-5 w-5" />}
        action={
          <Button onClick={() => { setEditStudent(null); setAddOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add Student
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Students" value={stats.total} icon={GraduationCap} color="bg-emerald-500" />
        <StatCard title="Male" value={stats.male} icon={Users} color="bg-blue-500" />
        <StatCard title="Female" value={stats.female} icon={Users} color="bg-pink-500" />
        <StatCard title="Active" value={stats.active} icon={UserCheck} color="bg-violet-500" />
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or admission no..." className="pl-9" />
            </div>
            <Select value={classFilter} onValueChange={(v) => setClassFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="All Genders" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading students...</div>
          ) : students.length === 0 ? (
            <EmptyState
              title="No students found"
              description="Add your first student or adjust filters"
              icon={<GraduationCap className="h-7 w-7" />}
              action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Student</Button>}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Admission No</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStudents.map((s: any) => (
                      <TableRow key={s.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={s.photo || undefined} />
                              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{getInitials(s.firstName, s.lastName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{s.firstName} {s.lastName}</p>
                              <p className="text-xs text-muted-foreground">{s.phone || "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                        <TableCell>{s.currentClass?.name || "—"} {s.section?.name ? `(${s.section.name})` : ""}</TableCell>
                        <TableCell>
                          <Badge variant={s.gender === "Male" ? "default" : "secondary"} className={s.gender === "Male" ? "bg-blue-500" : "bg-pink-500 text-white"}>
                            {s.gender || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{s.parent ? getFullName(s.parent) : "—"}</p>
                            <p className="text-xs text-muted-foreground">{s.parent?.phone || ""}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.isActive ? "default" : "destructive"} className={s.isActive ? "bg-emerald-500" : ""}>
                            {s.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewStudent(s)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditStudent(s); setAddOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <ConfirmDialog
                              trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                              title="Delete Student?"
                              description={`This will permanently delete ${s.firstName} ${s.lastName} and all related records.`}
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
                  <p className="text-sm text-muted-foreground">Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, students.length)} of {students.length}</p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <StudentFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        student={editStudent}
        classes={classes}
        houses={houses}
      />

      {/* View Sheet */}
      <StudentDetailSheet student={viewStudent} onClose={() => setViewStudent(null)} />
    </div>
  );
}

function StudentFormDialog({ open, onOpenChange, student, classes, houses }: any) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const isEdit = !!student;

  const [form, setForm] = useState<any>(() => student || {
    firstName: "", lastName: "", middleName: "", gender: "Male", dateOfBirth: "",
    bloodGroup: "", nationality: "Nigerian", stateOfOrigin: "Plateau",
    admissionDate: new Date().toISOString().split("T")[0],
    phone: "", email: "", address: "", city: "Jos", state: "Plateau",
    currentClassId: "", sectionId: "", houseId: "",
    religion: "Christianity", rollNo: "",
    parent: { firstName: "", lastName: "", relation: "Father", phone: "", email: "", occupation: "", address: "" },
  });

  // Reset form when dialog opens
  useMemo(() => {
    if (open) {
      setForm(student || {
        firstName: "", lastName: "", middleName: "", gender: "Male", dateOfBirth: "",
        bloodGroup: "", nationality: "Nigerian", stateOfOrigin: "Plateau",
        admissionDate: new Date().toISOString().split("T")[0],
        phone: "", email: "", address: "", city: "Jos", state: "Plateau",
        currentClassId: "", sectionId: "", houseId: "",
        religion: "Christianity", rollNo: "",
        parent: { firstName: "", lastName: "", relation: "Father", phone: "", email: "", occupation: "", address: "" },
      });
    }
  }, [open, student]);

  const update = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));
  const updateParent = (key: string, value: any) => setForm((f: any) => ({ ...f, parent: { ...f.parent, [key]: value } }));

  const selectedClass = classes.find((c: any) => c.id === form.currentClassId);
  const sections = selectedClass?.sections || [];

  async function handleSave() {
    if (!form.firstName || !form.lastName) { toast.error("First and last name are required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, dateOfBirth: form.dateOfBirth || null, ageAsOn: null };
      if (isEdit) {
        await api(`/api/students`, { method: "PUT", body: JSON.stringify({ id: student.id, ...payload }) });
        toast.success("Student updated successfully");
      } else {
        await api(`/api/students`, { method: "POST", body: JSON.stringify(payload) });
        toast.success("Student admitted successfully! Login: " + (form.admissionNo || "auto-generated").toLowerCase().replace(/\//g, ""));
      }
      queryClient.invalidateQueries({ queryKey: ["students"] });
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
          <DialogTitle>{isEdit ? "Edit Student" : "New Student Admission"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Personal Info */}
          <div>
            <h4 className="text-sm font-semibold mb-2 text-emerald-700">Personal Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1"><Label>First Name <span className="text-destructive">*</span></Label><Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} /></div>
              <div className="space-y-1"><Label>Middle Name</Label><Input value={form.middleName} onChange={(e) => update("middleName", e.target.value)} /></div>
              <div className="space-y-1"><Label>Last Name <span className="text-destructive">*</span></Label><Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} /></div>
              <div className="space-y-1">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} /></div>
              <div className="space-y-1">
                <Label>Blood Group</Label>
                <Select value={form.bloodGroup} onValueChange={(v) => update("bloodGroup", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Religion</Label>
                <Select value={form.religion} onValueChange={(v) => update("religion", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Christianity">Christianity</SelectItem><SelectItem value="Islam">Islam</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>State of Origin</Label>
                <Select value={form.stateOfOrigin} onValueChange={(v) => update("stateOfOrigin", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{NIGERIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Admission Date</Label><Input type="date" value={form.admissionDate} onChange={(e) => update("admissionDate", e.target.value)} /></div>
            </div>
          </div>

          {/* Academic Info */}
          <div>
            <h4 className="text-sm font-semibold mb-2 text-emerald-700">Academic Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Class</Label>
                <Select value={form.currentClassId} onValueChange={(v) => { update("currentClassId", v); update("sectionId", ""); }}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Section</Label>
                <Select value={form.sectionId} onValueChange={(v) => update("sectionId", v)} disabled={!sections.length}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>{sections.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>House</Label>
                <Select value={form.houseId} onValueChange={(v) => update("houseId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select house" /></SelectTrigger>
                  <SelectContent>{houses.map((h: any) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Roll No</Label><Input type="number" value={form.rollNo} onChange={(e) => update("rollNo", parseInt(e.target.value))} /></div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold mb-2 text-emerald-700">Contact Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234..." /></div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
              <div className="space-y-1"><Label>City</Label><Input value={form.city} onChange={(e) => update("city", e.target.value)} /></div>
              <div className="space-y-1">
                <Label>State</Label>
                <Select value={form.state} onValueChange={(v) => update("state", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{NIGERIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => update("address", e.target.value)} /></div>
            </div>
          </div>

          {/* Parent/Guardian */}
          <div>
            <h4 className="text-sm font-semibold mb-2 text-emerald-700">Parent / Guardian</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1"><Label>First Name</Label><Input value={form.parent?.firstName} onChange={(e) => updateParent("firstName", e.target.value)} /></div>
              <div className="space-y-1"><Label>Last Name</Label><Input value={form.parent?.lastName} onChange={(e) => updateParent("lastName", e.target.value)} /></div>
              <div className="space-y-1">
                <Label>Relation</Label>
                <Select value={form.parent?.relation} onValueChange={(v) => updateParent("relation", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Father">Father</SelectItem><SelectItem value="Mother">Mother</SelectItem><SelectItem value="Guardian">Guardian</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Phone</Label><Input value={form.parent?.phone} onChange={(e) => updateParent("phone", e.target.value)} placeholder="+234..." /></div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.parent?.email} onChange={(e) => updateParent("email", e.target.value)} /></div>
              <div className="space-y-1"><Label>Occupation</Label><Input value={form.parent?.occupation} onChange={(e) => updateParent("occupation", e.target.value)} /></div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : isEdit ? "Update Student" : "Admit Student"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StudentDetailSheet({ student, onClose }: any) {
  const [activeTab, setActiveTab] = useState("overview");
  const [detail, setDetail] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["student-detail", student?.id],
    queryFn: () => api(`/api/students?id=${student.id}`),
    enabled: !!student,
  });

  if (!student) return null;
  const s = data || student;

  return (
    <Sheet open={!!student} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetHeader className="p-4 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={s.photo || undefined} />
              <AvatarFallback className="bg-emerald-600 text-white text-xl">{getInitials(s.firstName, s.lastName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-xl">{getFullName(s)}</SheetTitle>
              <p className="text-sm text-muted-foreground">{s.admissionNo} • {s.currentClass?.name} {s.section?.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={s.isActive ? "default" : "destructive"} className={s.isActive ? "bg-emerald-500" : ""}>{s.isActive ? "Active" : "Inactive"}</Badge>
                <Badge variant="secondary">{s.gender}</Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start px-4 border-b rounded-none bg-transparent h-auto p-0">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600">Overview</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600">Attendance</TabsTrigger>
            <TabsTrigger value="fees" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600">Fees</TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600">Timeline</TabsTrigger>
          </TabsList>

          <div className="p-4">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                <TabsContent value="overview" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem icon={Calendar} label="Date of Birth" value={`${formatDate(s.dateOfBirth)} (${calculateAge(s.dateOfBirth)} yrs)`} />
                    <InfoItem icon={Activity} label="Blood Group" value={s.bloodGroup || "—"} />
                    <InfoItem icon={MapPin} label="State of Origin" value={`${s.stateOfOrigin || "—"}, ${s.lga || ""}`} />
                    <InfoItem icon={BookOpen} label="Religion" value={s.religion || "—"} />
                    <InfoItem icon={Phone} label="Phone" value={s.phone || "—"} />
                    <InfoItem icon={Mail} label="Email" value={s.email || "—"} />
                    <InfoItem icon={MapPin} label="Address" value={`${s.address || "—"}, ${s.city || ""}`} />
                    <InfoItem icon={Calendar} label="Admission Date" value={formatDate(s.admissionDate)} />
                  </div>
                  {s.house && <InfoItem icon={Users} label="House" value={s.house.name} />}
                  {s.parent && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2">Parent / Guardian</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <InfoItem icon={Users} label="Name" value={getFullName(s.parent)} />
                        <InfoItem icon={Users} label="Relation" value={s.parent.relation} />
                        <InfoItem icon={Phone} label="Phone" value={s.parent.phone || "—"} />
                        <InfoItem icon={Mail} label="Email" value={s.parent.email || "—"} />
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="attendance" className="mt-0">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {s.attendance?.length ? s.attendance.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between p-2 rounded-lg border">
                        <span className="text-sm">{formatDate(a.date)}</span>
                        <Badge variant={a.status === "Present" ? "default" : "destructive"} className={a.status === "Present" ? "bg-emerald-500" : a.status === "Late" ? "bg-amber-500" : ""}>{a.status}</Badge>
                      </div>
                    )) : <EmptyState title="No attendance records" />}
                  </div>
                </TabsContent>

                <TabsContent value="fees" className="mt-0">
                  <div className="space-y-2">
                    {s.invoices?.length ? s.invoices.map((inv: any) => (
                      <div key={inv.id} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{inv.invoiceNo}</span>
                          <Badge variant={inv.status === "Paid" ? "default" : inv.status === "Partial" ? "secondary" : "destructive"} className={inv.status === "Paid" ? "bg-emerald-500" : inv.status === "Partial" ? "bg-amber-500 text-white" : ""}>{inv.status}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                          <div><span className="text-muted-foreground">Amount:</span> {formatCurrency(inv.amount)}</div>
                          <div><span className="text-muted-foreground">Paid:</span> {formatCurrency(inv.paidAmount)}</div>
                          <div><span className="text-muted-foreground">Balance:</span> {formatCurrency(inv.balance)}</div>
                        </div>
                      </div>
                    )) : <EmptyState title="No fee records" />}
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="mt-0">
                  <div className="space-y-3">
                    {s.timeline?.length ? s.timeline.map((t: any) => (
                      <div key={t.id} className="flex gap-3 p-3 rounded-lg border">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                          {t.description && <p className="text-sm mt-1">{t.description}</p>}
                        </div>
                      </div>
                    )) : <EmptyState title="No timeline events" />}
                  </div>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function InfoItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
