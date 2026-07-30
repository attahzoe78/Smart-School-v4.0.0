"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  CalendarCheck, Users, UserCheck, UserX, Clock, Save, Search,
  CheckCircle2, AlertCircle, CalendarDays, GraduationCap, UserCog,
  TrendingUp, ListChecks,
} from "lucide-react";
import { formatDate, getInitials, getFullName } from "@/lib/format";
import { ATTENDANCE_STATUS } from "@/lib/constants";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; short: string }> = {
  Present:  { bg: "bg-emerald-500 hover:bg-emerald-600",  text: "text-emerald-700 dark:text-emerald-400",  label: "Present",  short: "P" },
  Absent:   { bg: "bg-rose-500 hover:bg-rose-600",        text: "text-rose-700 dark:text-rose-400",        label: "Absent",   short: "A" },
  Late:     { bg: "bg-amber-500 hover:bg-amber-600",      text: "text-amber-700 dark:text-amber-400",      label: "Late",     short: "L" },
  Excused:  { bg: "bg-sky-500 hover:bg-sky-600",          text: "text-sky-700 dark:text-sky-400",          label: "Excused",  short: "E" },
};

const STUDENT_STATUS_LIST = ["Present", "Absent", "Late", "Excused"];
const STAFF_STATUS_LIST = ["Present", "Absent", "Late", "Half Day", "Holiday"];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AttendanceScreen() {
  const [activeTab, setActiveTab] = useState("student");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Mark and track student & staff attendance"
        icon={<CalendarCheck className="h-5 w-5" />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="student"><GraduationCap className="h-4 w-4 mr-1.5" /> Student Attendance</TabsTrigger>
          <TabsTrigger value="staff"><UserCog className="h-4 w-4 mr-1.5" /> Staff Attendance</TabsTrigger>
        </TabsList>
        <TabsContent value="student" className="mt-4">
          <StudentAttendanceTab />
        </TabsContent>
        <TabsContent value="staff" className="mt-4">
          <StaffAttendanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================================
   STUDENT ATTENDANCE TAB
   ============================================================ */
function StudentAttendanceTab() {
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [noteOverrides, setNoteOverrides] = useState<Record<string, string>>({});

  // Settings
  const { data: settings } = useQuery({
    queryKey: ["settings-all"],
    queryFn: () => api("/api/settings"),
  });
  const classes = settings?.classes || [];
  const selectedClass = classes.find((c: any) => c.id === classId);
  const sections = selectedClass?.sections || [];

  // Students of class/section
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["students-by-class", classId, sectionId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (classId) params.set("classId", classId);
      if (sectionId) params.set("sectionId", sectionId);
      params.set("take", "500");
      return api(`/api/students?${params.toString()}`);
    },
    enabled: !!classId,
  });

  // Existing attendance for class+date
  const { data: existingRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["student-attendance", classId, sectionId, date],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("type", "student");
      params.set("classId", classId);
      if (sectionId) params.set("sectionId", sectionId);
      params.set("date", date);
      return api(`/api/attendance?${params.toString()}`);
    },
    enabled: !!classId && !!date,
  });

  // Derive statusMap from existing records + user overrides (pure computed state, no setState in effect)
  const statusMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of students) {
      const rec = existingRecords.find((r: any) => r.studentId === s.id);
      map[s.id] = overrides[s.id] ?? rec?.status ?? "Present";
    }
    return map;
  }, [students, existingRecords, overrides]);

  const noteMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of students) {
      const rec = existingRecords.find((r: any) => r.studentId === s.id);
      map[s.id] = noteOverrides[s.id] ?? rec?.note ?? "";
    }
    return map;
  }, [students, existingRecords, noteOverrides]);

  function setStatus(studentId: string, status: string) {
    setOverrides((o) => ({ ...o, [studentId]: status }));
  }

  const saveMutation = useMutation({
    mutationFn: (records: any[]) => api("/api/attendance", {
      method: "POST",
      body: JSON.stringify({ type: "student", records }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Attendance saved for ${students.length} students`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    const values = Object.values(statusMap);
    const present = values.filter((s) => s === "Present").length;
    const absent = values.filter((s) => s === "Absent").length;
    const late = values.filter((s) => s === "Late").length;
    const excused = values.filter((s) => s === "Excused").length;
    const total = values.length || 1;
    const rate = Math.round(((present + late) / total) * 100);
    return { present, absent, late, excused, total: values.length, rate };
  }, [statusMap]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter((s: any) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      (s.admissionNo || "").toLowerCase().includes(q)
    );
  }, [students, search]);

  function setAllStatus(status: string) {
    const map: Record<string, string> = {};
    for (const s of students) map[s.id] = status;
    setOverrides(map);
    toast.success(`All students marked ${status}`);
  }

  function handleSave() {
    if (!classId) { toast.error("Please select a class"); return; }
    if (students.length === 0) { toast.error("No students to mark"); return; }
    const records = students.map((s: any) => ({
      studentId: s.id,
      date,
      status: statusMap[s.id] || "Present",
      note: noteMap[s.id] || "",
      classId,
      sectionId: sectionId || null,
    }));
    saveMutation.mutate(records);
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Present" value={stats.present} icon={UserCheck} color="bg-emerald-500" subtitle={`of ${stats.total} students`} />
        <StatCard title="Absent" value={stats.absent} icon={UserX} color="bg-rose-500" subtitle={`of ${stats.total} students`} />
        <StatCard title="Late" value={stats.late} icon={Clock} color="bg-amber-500" subtitle={`of ${stats.total} students`} />
        <StatCard title="Attendance Rate" value={`${stats.rate}%`} icon={TrendingUp} color="bg-violet-500" subtitle={`${stats.present + stats.late} of ${stats.total} present`} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Class <span className="text-destructive">*</span></Label>
              <Select value={classId} onValueChange={(v) => { setClassId(v); setSectionId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Section</Label>
              <Select value={sectionId} onValueChange={(v) => setSectionId(v === "all" ? "" : v)} disabled={!sections.length}>
                <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayISO()} />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSave} disabled={saveMutation.isPending || !classId || students.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Save className="h-4 w-4 mr-1.5" /> {saveMutation.isPending ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </div>

          {classId && (
            <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student by name or admission no..." className="pl-9" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Bulk:</span>
                <Button size="sm" variant="outline" onClick={() => setAllStatus("Present")} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> All Present
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAllStatus("Absent")} className="border-rose-300 text-rose-700 hover:bg-rose-50">
                  <UserX className="h-3.5 w-3.5 mr-1" /> All Absent
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance List */}
      {!classId ? (
        <Card>
          <CardContent className="p-4">
            <EmptyState
              title="Select a class to begin"
              description="Choose a class, section and date above to mark attendance"
              icon={<CalendarDays className="h-7 w-7" />}
            />
          </CardContent>
        </Card>
      ) : studentsLoading || recordsLoading ? (
        <Card><CardContent className="p-4"><div className="py-12 text-center text-sm text-muted-foreground">Loading students...</div></CardContent></Card>
      ) : students.length === 0 ? (
        <Card><CardContent className="p-4">
          <EmptyState title="No students found" description="There are no students in the selected class/section" icon={<Users className="h-7 w-7" />} />
        </CardContent></Card>
      ) : (
        <>
          {/* Summary Bar */}
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold">{selectedClass?.name} {sectionId ? `- ${sections.find((s: any) => s.id === sectionId)?.name || ""}` : "(All Sections)"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(date)} • {filteredStudents.length} students</p>
                  </div>
                </div>
                <div className="flex-1" />
                <div className="flex flex-wrap items-center gap-3">
                  {STUDENT_STATUS_LIST.map((s) => {
                    const style = STATUS_STYLES[s];
                    const count = Object.values(statusMap).filter((v) => v === s).length;
                    return (
                      <div key={s} className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${style.bg}`} />
                        <span className="text-xs text-muted-foreground">{s}:</span>
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Attendance Rate</span>
                  <span className="text-xs font-semibold">{stats.rate}%</span>
                </div>
                <Progress value={stats.rate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mark Attendance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[600px]">
                <div className="divide-y">
                  {filteredStudents.map((s: any, idx: number) => {
                    const status = statusMap[s.id] || "Present";
                    return (
                      <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 hover:bg-muted/30">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground w-6 shrink-0">{idx + 1}.</span>
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={s.photo || undefined} />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{getInitials(s.firstName, s.lastName)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{getFullName(s)}</p>
                            <p className="text-xs text-muted-foreground">{s.admissionNo} {s.rollNo ? `• #${s.rollNo}` : ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:ml-auto">
                          {STUDENT_STATUS_LIST.map((st) => {
                            const style = STATUS_STYLES[st];
                            const isActive = status === st;
                            return (
                              <Button
                                key={st}
                                size="sm"
                                onClick={() => setStatus(s.id, st)}
                                className={`h-8 px-2.5 text-xs transition-all ${
                                  isActive ? `${style.bg} text-white shadow-sm` : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                                title={st}
                              >
                                <span className="hidden sm:inline">{st}</span>
                                <span className="sm:hidden">{style.short}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/* ============================================================
   STAFF ATTENDANCE TAB
   ============================================================ */
function StaffAttendanceTab() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [noteOverrides, setNoteOverrides] = useState<Record<string, string>>({});

  // All staff
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => api("/api/staff?take=500"),
  });

  // Existing staff attendance for date
  const { data: existingRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["staff-attendance", date],
    queryFn: () => api(`/api/attendance?type=staff&date=${date}`),
    enabled: !!date,
  });

  // Derive statusMap from existing records + user overrides
  const statusMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of staff) {
      const rec = existingRecords.find((r: any) => r.staffId === s.id);
      map[s.id] = overrides[s.id] ?? rec?.status ?? "Present";
    }
    return map;
  }, [staff, existingRecords, overrides]);

  const noteMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of staff) {
      const rec = existingRecords.find((r: any) => r.staffId === s.id);
      map[s.id] = noteOverrides[s.id] ?? rec?.note ?? "";
    }
    return map;
  }, [staff, existingRecords, noteOverrides]);

  function setStatus(staffId: string, status: string) {
    setOverrides((o) => ({ ...o, [staffId]: status }));
  }

  const saveMutation = useMutation({
    mutationFn: (records: any[]) => api("/api/attendance", {
      method: "POST",
      body: JSON.stringify({ type: "staff", records }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Staff attendance saved for ${staff.length} members`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    const values = Object.values(statusMap);
    const present = values.filter((s) => s === "Present").length;
    const absent = values.filter((s) => s === "Absent").length;
    const late = values.filter((s) => s === "Late").length;
    const halfDay = values.filter((s) => s === "Half Day").length;
    const holiday = values.filter((s) => s === "Holiday").length;
    const total = values.length || 1;
    const rate = Math.round(((present + late) / total) * 100);
    return { present, absent, late, halfDay, holiday, total: values.length, rate };
  }, [statusMap]);

  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.toLowerCase();
    return staff.filter((s: any) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      (s.staffId || "").toLowerCase().includes(q)
    );
  }, [staff, search]);

  function setAllStatus(status: string) {
    const map: Record<string, string> = {};
    for (const s of staff) map[s.id] = status;
    setOverrides(map);
    toast.success(`All staff marked ${status}`);
  }

  function handleSave() {
    if (staff.length === 0) { toast.error("No staff to mark"); return; }
    const records = staff.map((s: any) => ({
      staffId: s.id,
      date,
      status: statusMap[s.id] || "Present",
      note: noteMap[s.id] || "",
    }));
    saveMutation.mutate(records);
  }

  const STAFF_STYLES: Record<string, { bg: string; short: string }> = {
    Present:  { bg: "bg-emerald-500 hover:bg-emerald-600", short: "P" },
    Absent:   { bg: "bg-rose-500 hover:bg-rose-600",       short: "A" },
    Late:     { bg: "bg-amber-500 hover:bg-amber-600",     short: "L" },
    "Half Day": { bg: "bg-sky-500 hover:bg-sky-600",       short: "HD" },
    Holiday:  { bg: "bg-violet-500 hover:bg-violet-600",   short: "H" },
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Present" value={stats.present} icon={UserCheck} color="bg-emerald-500" subtitle={`of ${stats.total} staff`} />
        <StatCard title="Absent" value={stats.absent} icon={UserX} color="bg-rose-500" subtitle={`of ${stats.total} staff`} />
        <StatCard title="Late / Half Day" value={stats.late + stats.halfDay} icon={Clock} color="bg-amber-500" subtitle={`${stats.late} late, ${stats.halfDay} half day`} />
        <StatCard title="Attendance Rate" value={`${stats.rate}%`} icon={TrendingUp} color="bg-violet-500" subtitle={`${stats.present + stats.late} of ${stats.total} present`} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayISO()} />
            </div>
            <div className="relative sm:col-span-2 flex items-end">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff by name or staff ID..." className="pl-9" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
            <span className="text-xs text-muted-foreground">Bulk actions:</span>
            <Button size="sm" variant="outline" onClick={() => setAllStatus("Present")} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> All Present
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAllStatus("Absent")} className="border-rose-300 text-rose-700 hover:bg-rose-50">
              <UserX className="h-3.5 w-3.5 mr-1" /> All Absent
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAllStatus("Holiday")} className="border-violet-300 text-violet-700 hover:bg-violet-50">
              <CalendarDays className="h-3.5 w-3.5 mr-1" /> Mark Holiday
            </Button>
            <div className="flex-1" />
            <Button onClick={handleSave} disabled={saveMutation.isPending || staff.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="h-4 w-4 mr-1.5" /> {saveMutation.isPending ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Bar */}
      {staff.length > 0 && (
        <Card className="border-emerald-200 dark:border-emerald-900">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold">Staff Attendance</p>
                  <p className="text-xs text-muted-foreground">{formatDate(date)} • {filteredStaff.length} staff</p>
                </div>
              </div>
              <div className="flex-1" />
              <div className="flex flex-wrap items-center gap-3">
                {STAFF_STATUS_LIST.map((s) => {
                  const count = Object.values(statusMap).filter((v) => v === s).length;
                  return (
                    <div key={s} className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${STAFF_STYLES[s].bg}`} />
                      <span className="text-xs text-muted-foreground">{s}:</span>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Attendance Rate</span>
                <span className="text-xs font-semibold">{stats.rate}%</span>
              </div>
              <Progress value={stats.rate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff List */}
      {staffLoading || recordsLoading ? (
        <Card><CardContent className="p-4"><div className="py-12 text-center text-sm text-muted-foreground">Loading staff...</div></CardContent></Card>
      ) : staff.length === 0 ? (
        <Card><CardContent className="p-4">
          <EmptyState title="No staff found" description="Add staff members to begin marking attendance" icon={<UserCog className="h-7 w-7" />} />
        </CardContent></Card>
      ) : filteredStaff.length === 0 ? (
        <Card><CardContent className="p-4">
          <EmptyState title="No matching staff" description="Try adjusting your search" icon={<Search className="h-7 w-7" />} />
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mark Staff Attendance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[600px]">
              <div className="divide-y">
                {filteredStaff.map((s: any, idx: number) => {
                  const status = statusMap[s.id] || "Present";
                  return (
                    <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 hover:bg-muted/30">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xs text-muted-foreground w-6 shrink-0">{idx + 1}.</span>
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={s.photo || undefined} />
                          <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">{getInitials(s.firstName, s.lastName)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{getFullName(s)}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.staffId} {s.department?.name ? `• ${s.department.name}` : ""} {s.designation?.name ? `• ${s.designation.name}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:ml-auto flex-wrap">
                        {STAFF_STATUS_LIST.map((st) => {
                          const style = STAFF_STYLES[st];
                          const isActive = status === st;
                          return (
                            <Button
                              key={st}
                              size="sm"
                              onClick={() => setStatus(s.id, st)}
                              className={`h-8 px-2.5 text-xs transition-all ${
                                isActive ? `${style.bg} text-white shadow-sm` : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                              title={st}
                            >
                              <span className="hidden md:inline">{st}</span>
                              <span className="md:hidden">{style.short}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
