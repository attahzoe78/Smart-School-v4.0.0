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
import { toast } from "sonner";
import {
  Plus, ClipboardList, FileText, Eye, Trash2, Save, GraduationCap,
  CheckCircle2, Activity,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { GRADE_SCALE, getGrade } from "@/lib/constants";

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
    const active = exams.filter(
      (e: any) => new Date(e.startDate) <= now && new Date(e.endDate) >= now
    ).length;
    const totalResults = exams.reduce(
      (acc: number, e: any) => acc + (e._count?.results || 0), 0
    );
    return { total: exams.length, active, totalResults, avg: 0 };
  }, [exams]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/exams?id=${id}&action=exam`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam deleted");
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
                  description="Create your first examination"
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
                        const now = new Date();
                        const isActive = new Date(e.startDate) <= now && new Date(e.endDate) >= now;
                        const upcoming = new Date(e.startDate) > now;
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
                                variant={isActive ? "default" : upcoming ? "secondary" : "outline"}
                                className={isActive ? "bg-emerald-500" : upcoming ? "bg-amber-100 text-amber-700" : ""}
                              >
                                {isActive ? "Active" : upcoming ? "Upcoming" : "Completed"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setActiveTab("results")}
                                  title="View Results"
                                >
                                  <Eye className="h-4 w-4" /> Results
                                </Button>
                                <ConfirmDialog
                                  trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                                  title="Delete Exam?"
                                  description={`This will permanently delete "${e.name}" and all related results.`}
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
    if (!form.name || !form.classId) {
      toast.error("Name and class are required");
      return;
    }
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
              <Select value={form.sectionId} onValueChange={(v) => update("sectionId", v)} disabled={!sections.length}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>{sections.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
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
  const [rows, setRows] = useState<any[]>([]);

  const selectedExam = exams.find((e: any) => e.id === examId);
  const effectiveClassId = classId || selectedExam?.classId;

  const { data: students = [] } = useQuery({
    queryKey: ["students-by-class", effectiveClassId],
    queryFn: () => api(`/api/students?classId=${effectiveClassId}`),
    enabled: !!effectiveClassId,
  });

  const { data: existingResults = [] } = useQuery({
    queryKey: ["exam-results", examId],
    queryFn: () => api(`/api/exams?action=results&examId=${examId}`),
    enabled: !!examId,
  });

  useMemo(() => {
    if (students.length) {
      setRows(students.map((s: any) => {
        const existing = existingResults.find((r: any) => r.studentId === s.id);
        return {
          studentId: s.id,
          name: `${s.firstName} ${s.lastName}`.trim(),
          admissionNo: s.admissionNo,
          subjectName: existing?.subjectName || "",
          marks: existing?.marks ?? "",
          totalMarks: existing?.totalMarks || 100,
        };
      }));
    } else {
      setRows([]);
    }
  }, [students, existingResults]);

  const updateRow = (studentId: string, key: string, value: any) => {
    setRows((prev) => prev.map((r) => r.studentId === studentId ? { ...r, [key]: value } : r));
  };

  async function handleSave() {
    if (!examId) { toast.error("Select an exam first"); return; }
    const valid = rows.filter((r) => r.subjectName && r.marks !== "" && r.marks !== null);
    if (valid.length === 0) { toast.error("Add at least one valid result with subject and marks"); return; }
    setSaving(true);
    try {
      await api("/api/exams", {
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
      toast.success(`Saved ${valid.length} result(s)`);
      queryClient.invalidateQueries({ queryKey: ["exam-results", examId] });
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Exam <span className="text-destructive">*</span></Label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
              <SelectContent>
                {exams.length === 0 ? (
                  <SelectItem value="" disabled>No exams available</SelectItem>
                ) : (
                  exams.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Class (override exam&apos;s class)</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger><SelectValue placeholder="Use exam's class" /></SelectTrigger>
              <SelectContent>
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

        {!examId ? (
          <EmptyState
            title="Select an exam to enter results"
            description="Pick an exam from the dropdown above to start recording student marks"
            icon={<ClipboardList className="h-7 w-7" />}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No students found"
            description="No students are enrolled in this class"
            icon={<GraduationCap className="h-7 w-7" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-48">Subject</TableHead>
                    <TableHead className="w-28">Marks</TableHead>
                    <TableHead className="w-28">Total</TableHead>
                    <TableHead className="w-20">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const hasMarks = r.marks !== "" && r.marks !== null;
                    const marks = hasMarks ? Number(r.marks) : 0;
                    const total = Number(r.totalMarks) || 100;
                    const grade = hasMarks ? getGrade(marks, total) : null;
                    return (
                      <TableRow key={r.studentId}>
                        <TableCell>
                          <p className="text-sm font-medium">{r.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{r.admissionNo}</p>
                        </TableCell>
                        <TableCell>
                          <Select value={r.subjectName} onValueChange={(v) => updateRow(r.studentId, "subjectName", v)}>
                            <SelectTrigger className="h-8"><SelectValue placeholder="Select subject" /></SelectTrigger>
                            <SelectContent>
                              {subjects.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={r.marks}
                            onChange={(e) => updateRow(r.studentId, "marks", e.target.value)}
                            className="h-8 w-24"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={r.totalMarks}
                            onChange={(e) => updateRow(r.studentId, "totalMarks", e.target.value)}
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
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Results"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
