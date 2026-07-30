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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus, ClipboardList, FileText, Eye, Trash2, Save, GraduationCap,
  CheckCircle2, Activity, Pencil, X,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { GRADE_SCALE, getGrade } from "@/lib/constants";

function getExamStatus(startDate: string | Date, endDate: string | Date | null | undefined): "active" | "upcoming" | "completed" {
  const now = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  if (start > now) return "upcoming";
  if (end && end < now) return "completed";
  if (!end && start <= now) return "active";
  return "active";
}

export function ExamsScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("exams");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: () => api("/api/exams?action=exams"),
  });
  const { data: settings } = useQuery({
    queryKey: ["settings-all"],
    queryFn: () => api("/api/settings"),
  });

  const classes = settings?.classes || [];
  const subjects = settings?.subjects || [];

  const stats = useMemo(() => {
    const now = new Date();
    const active = exams.filter((e: any) => getExamStatus(e.startDate, e.endDate) === "active").length;
    const totalResults = exams.reduce((acc: number, e: any) => acc + (e._count?.results || 0), 0);
    return { total: exams.length, active, totalResults, avg: 0 };
  }, [exams]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/exams?id=${id}&action=exam`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Exam deleted successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Examinations"
        description="Create exams, record results, and manage grades"
        icon={<ClipboardList className="h-5 w-5" />}
        action={
          <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Create Exam
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Exams" value={stats.total} icon={ClipboardList} color="bg-emerald-500" />
        <StatCard title="Active Exams" value={stats.active} icon={Activity} color="bg-amber-500" />
        <StatCard title="Total Results" value={stats.totalResults} icon={FileText} color="bg-violet-500" />
        <StatCard title="Average Score" value={`${stats.avg}%`} icon={CheckCircle2} color="bg-sky-500" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full sm:w-auto grid-cols-2">
          <TabsTrigger value="exams">Examinations</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading exams...</div>
              ) : exams.length === 0 ? (
                <EmptyState
                  title="No exams yet"
                  description="Create your first examination to start recording results"
                  icon={<ClipboardList className="h-7 w-7" />}
                  action={
                    <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4" /> Create Exam
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Results</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.map((e: any) => {
                        const status = getExamStatus(e.startDate, e.endDate);
                        const count = e._count?.results || 0;
                        return (
                          <TableRow key={e.id} className="hover:bg-muted/50">
                            <TableCell>
                              <p className="text-sm font-medium">{e.name}</p>
                              {e.description && <p className="text-xs text-muted-foreground line-clamp-1">{e.description}</p>}
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{e.class?.name || "—"}</p>
                              {e.section?.name && <p className="text-xs text-muted-foreground">{e.section.name}</p>}
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(e.startDate)}</TableCell>
                            <TableCell className="text-sm">{formatDate(e.endDate)}</TableCell>
                            <TableCell><Badge variant="outline">{count}</Badge></TableCell>
                            <TableCell>
                              <Badge
                                variant={status === "active" ? "default" : status === "upcoming" ? "secondary" : "outline"}
                                className={
                                  status === "active" ? "bg-emerald-500" :
                                  status === "upcoming" ? "bg-amber-100 text-amber-700" : ""
                                }
                              >
                                {status === "active" ? "Active" : status === "upcoming" ? "Upcoming" : "Completed"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setActiveTab("results")}
                                  title="Enter Results"
                                >
                                  <Eye className="h-4 w-4" /> Results
                                </Button>
                                <ConfirmDialog
                                  trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                                  title="Delete Exam?"
                                  description={`This will permanently delete "${e.name}" and all ${count} result(s).`}
                                  confirmText="Delete"
                                  onConfirm={() => deleteMutation.mutate(e.id)}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <ResultsTab exams={exams} classes={classes} subjects={subjects} />
        </TabsContent>
      </Tabs>

      <CreateExamDialog open={createOpen} onOpenChange={setCreateOpen} classes={classes} />
    </div>
  );
}

function CreateExamDialog({ open, onOpenChange, classes }: any) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<any>({
    name: "", description: "", classId: "", sectionId: "",
    startDate: today, endDate: today,
  });

  useMemo(() => {
    if (open) {
      const t = new Date().toISOString().split("T")[0];
      setForm({ name: "", description: "", classId: "", sectionId: "", startDate: t, endDate: t });
    }
  }, [open]);

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const selectedClass = classes.find((c: any) => c.id === form.classId);
  const sections = selectedClass?.sections || [];

  async function handleSave() {
    if (!form.name) { toast.error("Exam name is required"); return; }
    if (!form.classId) { toast.error("Class is required"); return; }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error("End date must be after start date");
      return;
    }
    setSaving(true);
    try {
      await api("/api/exams", {
        method: "POST",
        body: JSON.stringify({ action: "create-exam", ...form }),
      });
      toast.success("Exam created successfully");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Exam</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Exam Name <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. First Term Examination 2025" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Exam description..." rows={2} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Class <span className="text-destructive">*</span></Label>
              <Select value={form.classId} onValueChange={(v) => { update("classId", v); update("sectionId", ""); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Section</Label>
              <Select value={form.sectionId || "none"} onValueChange={(v) => update("sectionId", v === "none" ? "" : v)} disabled={!sections.length}>
                <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Sections</SelectItem>
                  {sections.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Start Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>End Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Creating..." : "Create Exam"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultsTab({ exams, classes, subjects }: any) {
  const queryClient = useQueryClient();
  const [examId, setExamId] = useState("");
  const [classId, setClassId] = useState("");
  const [saving, setSaving] = useState(false);
  // rows = new results being entered (one per student per subject)
  const [rows, setRows] = useState<any[]>([]);
  const [subjectFilter, setSubjectFilter] = useState("");

  const selectedExam = exams.find((e: any) => e.id === examId);
  const effectiveClassId = classId || selectedExam?.classId;

  const { data: students = [] } = useQuery({
    queryKey: ["students-by-class", effectiveClassId],
    queryFn: () => api(`/api/students?classId=${effectiveClassId}`),
    enabled: !!effectiveClassId,
  });

  const { data: existingResults = [], refetch } = useQuery({
    queryKey: ["exam-results", examId],
    queryFn: () => api(`/api/exams?action=results&examId=${examId}`),
    enabled: !!examId,
  });

  // Group existing results by student
  const resultsByStudent = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const r of existingResults) {
      if (!map[r.studentId]) map[r.studentId] = [];
      map[r.studentId].push(r);
    }
    return map;
  }, [existingResults]);

  const updateRow = (idx: number, key: string, value: any) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [key]: value } : r));
  };

  const addRow = () => {
    setRows((prev) => [...prev, {
      studentId: "",
      subjectName: "",
      marks: "",
      totalMarks: 100,
    }]);
  };

  const removeRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const fillAllStudents = () => {
    if (!students.length) { toast.error("No students in this class"); return; }
    const subject = subjectFilter || (subjects[0]?.name || "");
    setRows(students.map((s: any) => ({
      studentId: s.id,
      studentName: `${s.firstName} ${s.lastName}`,
      admissionNo: s.admissionNo,
      subjectName: subject,
      marks: "",
      totalMarks: 100,
    })));
    toast.success(`Added ${students.length} students`);
  };

  async function handleSave() {
    if (!examId) { toast.error("Select an exam first"); return; }
    const valid = rows.filter((r) => r.studentId && r.subjectName && r.marks !== "" && r.marks !== null);
    if (valid.length === 0) { toast.error("Add at least one valid result with student, subject, and marks"); return; }
    setSaving(true);
    try {
      const res = await api("/api/exams", {
        method: "POST",
        body: JSON.stringify({
          action: "save-results",
          examId,
          results: valid.map((r) => ({
            studentId: r.studentId,
            subjectName: r.subjectName,
            marks: Number(r.marks),
            totalMarks: Number(r.totalMarks) || 100,
          })),
        }),
      });
      toast.success(`Saved ${res.total} result(s) — ${res.saved} new, ${res.updated} updated`);
      queryClient.invalidateQueries({ queryKey: ["exam-results", examId] });
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      setRows([]);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteResult(id: string) {
    try {
      await api("/api/exams", {
        method: "POST",
        body: JSON.stringify({ action: "delete-result", id }),
      });
      toast.success("Result deleted");
      queryClient.invalidateQueries({ queryKey: ["exam-results", examId] });
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Exam <span className="text-destructive">*</span></Label>
              <Select value={examId || "none"} onValueChange={(v) => { setExamId(v === "none" ? "" : v); setRows([]); }}>
                <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Select an exam...</SelectItem>
                  {exams.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Class (override exam's class)</Label>
              <Select value={classId || "none"} onValueChange={(v) => { setClassId(v === "none" ? "" : v); setRows([]); }}>
                <SelectTrigger><SelectValue placeholder="Use exam's class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Use exam's class ({selectedExam?.class?.name || "—"})</SelectItem>
                  {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grade Scale Reference */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" /> Grade Scale Reference
            </p>
            <div className="flex flex-wrap gap-2">
              {GRADE_SCALE.map((g) => (
                <div key={g.grade} className="flex items-center gap-1 text-xs bg-background px-2 py-1 rounded-md border">
                  <Badge variant="outline" className="font-mono">{g.grade}</Badge>
                  <span className="text-muted-foreground">{g.min}-{g.max}%</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{g.remark}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {!examId ? (
        <Card>
          <CardContent className="p-4">
            <EmptyState
              title="Select an exam to enter results"
              description="Pick an exam from the dropdown above to start recording student marks"
              icon={<ClipboardList className="h-7 w-7" />}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Enter Results Card */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Enter New Results</h3>
                  <p className="text-xs text-muted-foreground">Add results for students. You can enter multiple subjects per student.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {students.length > 0 && (
                    <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                      <SelectTrigger className="w-40 h-8"><SelectValue placeholder="Subject" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">All Subjects</SelectItem>
                        {subjects.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="outline" size="sm" onClick={addRow} disabled={!students.length}>
                    <Plus className="h-3.5 w-3.5" /> Add Row
                  </Button>
                  <Button variant="outline" size="sm" onClick={fillAllStudents} disabled={!students.length}>
                    <GraduationCap className="h-3.5 w-3.5" /> Fill All Students
                  </Button>
                </div>
              </div>

              {rows.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground border rounded-lg border-dashed">
                  No results entered yet. Click "Add Row" to enter a single result, or "Fill All Students" to add all students from the class.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[180px]">Student</TableHead>
                          <TableHead className="min-w-[160px]">Subject</TableHead>
                          <TableHead className="w-28">Marks</TableHead>
                          <TableHead className="w-28">Total</TableHead>
                          <TableHead className="w-20">Grade</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r, idx) => {
                          const hasMarks = r.marks !== "" && r.marks !== null;
                          const marks = hasMarks ? Number(r.marks) : 0;
                          const total = Number(r.totalMarks) || 100;
                          const grade = hasMarks ? getGrade(marks, total) : null;
                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                <Select value={r.studentId || "none"} onValueChange={(v) => updateRow(idx, "studentId", v === "none" ? "" : v)}>
                                  <SelectTrigger className="h-8"><SelectValue placeholder="Select student" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none" disabled>Select student...</SelectItem>
                                    {students.map((s: any) => (
                                      <SelectItem key={s.id} value={s.id}>
                                        {s.firstName} {s.lastName} ({s.admissionNo})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select value={r.subjectName || "none"} onValueChange={(v) => updateRow(idx, "subjectName", v === "none" ? "" : v)}>
                                  <SelectTrigger className="h-8"><SelectValue placeholder="Select subject" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none" disabled>Select subject...</SelectItem>
                                    {subjects.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={r.marks}
                                  onChange={(e) => updateRow(idx, "marks", e.target.value)}
                                  className="h-8 w-24"
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={r.totalMarks}
                                  onChange={(e) => updateRow(idx, "totalMarks", e.target.value)}
                                  className="h-8 w-24"
                                  placeholder="100"
                                />
                              </TableCell>
                              <TableCell>
                                {grade ? (
                                  <Badge variant="outline" className="font-mono">{grade.grade}</Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeRow(idx)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                      <Save className="h-4 w-4" /> {saving ? "Saving..." : `Save ${rows.length} Result(s)`}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Existing Results Card */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Saved Results ({existingResults.length})</h3>
                {existingResults.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => refetch()}>
                    <Eye className="h-3.5 w-3.5" /> Refresh
                  </Button>
                )}
              </div>
              {existingResults.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No results saved yet for this exam.</p>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Marks</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {existingResults.map((r: any) => {
                          const grade = getGrade(r.marks, r.totalMarks);
                          return (
                            <TableRow key={r.id}>
                              <TableCell>
                                <p className="text-sm font-medium">{r.student?.firstName} {r.student?.lastName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{r.student?.admissionNo}</p>
                              </TableCell>
                              <TableCell className="text-sm">{r.student?.currentClass?.name || "—"}</TableCell>
                              <TableCell className="text-sm">{r.subjectName}</TableCell>
                              <TableCell className="text-sm font-medium">{r.marks}/{r.totalMarks}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">{grade.grade}</Badge>
                                <span className="text-xs text-muted-foreground ml-1">{grade.remark}</span>
                              </TableCell>
                              <TableCell className="text-right">
                                <ConfirmDialog
                                  trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                                  title="Delete Result?"
                                  description="This will permanently delete this exam result."
                                  confirmText="Delete"
                                  onConfirm={() => deleteResult(r.id)}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
