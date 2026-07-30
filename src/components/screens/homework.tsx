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
  Plus, BookOpen, FileText, CheckCircle2, Clock, Eye, Trash2, Download,
  Upload, FileQuestion, FileArchive, GraduationCap, CalendarDays,
} from "lucide-react";
import { formatDate } from "@/lib/format";

const DOWNLOAD_TYPES = ["Assignment", "Notes", "Syllabus", "Study Material"] as const;

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  Assignment: { bg: "bg-amber-100", text: "text-amber-700", icon: FileText },
  Notes: { bg: "bg-emerald-100", text: "text-emerald-700", icon: BookOpen },
  Syllabus: { bg: "bg-violet-100", text: "text-violet-700", icon: FileArchive },
  "Study Material": { bg: "bg-sky-100", text: "text-sky-700", icon: FileQuestion },
};

export function HomeworkScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("homework");
  const [assignOpen, setAssignOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [evaluateOpen, setEvaluateOpen] = useState(false);
  const [selectedHw, setSelectedHw] = useState<any>(null);

  const { data: homework = [], isLoading } = useQuery({
    queryKey: ["homework"],
    queryFn: () => api("/api/homework?action=list"),
  });
  const { data: downloads = [] } = useQuery({
    queryKey: ["downloads"],
    queryFn: () => api("/api/homework?action=downloads"),
  });
  const { data: settings } = useQuery({
    queryKey: ["settings-all"],
    queryFn: () => api("/api/settings"),
  });

  const classes = settings?.classes || [];
  const subjects = settings?.subjects || [];

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    const evaluated = homework.reduce(
      (acc: number, h: any) => acc + (h.submissions?.filter((s: any) => s.marks !== null && s.marks !== undefined).length || 0),
      0
    );
    const pending = homework.reduce(
      (acc: number, h: any) => acc + (h.submissions?.filter((s: any) => s.marks === null || s.marks === undefined).length || 0),
      0
    );
    const thisWeek = homework.filter((h: any) => new Date(h.homeworkDate) >= weekStart).length;
    return { total: homework.length, pending, evaluated, thisWeek };
  }, [homework]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/homework?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      toast.success("Homework deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteDownloadMutation = useMutation({
    mutationFn: (id: string) => api(`/api/homework?id=${id}&action=download`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["downloads"] });
      toast.success("Content removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework & Downloads"
        description="Assign homework, evaluate submissions, and share study materials"
        icon={<BookOpen className="h-5 w-5" />}
        action={
          activeTab === "homework" ? (
            <Button onClick={() => setAssignOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Assign Homework
            </Button>
          ) : (
            <Button onClick={() => setUploadOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Upload className="h-4 w-4" /> Upload Content
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Homework" value={stats.total} icon={BookOpen} color="bg-emerald-500" />
        <StatCard title="Pending Submissions" value={stats.pending} icon={Clock} color="bg-amber-500" />
        <StatCard title="Evaluated" value={stats.evaluated} icon={CheckCircle2} color="bg-violet-500" />
        <StatCard title="This Week" value={stats.thisWeek} icon={FileText} color="bg-sky-500" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full sm:w-auto grid-cols-2">
          <TabsTrigger value="homework">Homework List</TabsTrigger>
          <TabsTrigger value="downloads">Download Center</TabsTrigger>
        </TabsList>

        <TabsContent value="homework" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading homework...</div>
              ) : homework.length === 0 ? (
                <EmptyState
                  title="No homework assigned"
                  description="Assign your first homework to a class"
                  icon={<BookOpen className="h-7 w-7" />}
                  action={
                    <Button onClick={() => setAssignOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4" /> Assign Homework
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Homework Date</TableHead>
                        <TableHead>Submission Date</TableHead>
                        <TableHead>Submissions</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {homework.map((h: any) => {
                        const submitted = h.submissions?.filter((s: any) => s.submitted).length || 0;
                        const total = h._count?.submissions || h.submissions?.length || 0;
                        const overdue = new Date(h.submissionDate) < new Date();
                        return (
                          <TableRow key={h.id} className="hover:bg-muted/50">
                            <TableCell>
                              <p className="text-sm font-medium line-clamp-1">{h.title}</p>
                              {h.description && <p className="text-xs text-muted-foreground line-clamp-1">{h.description}</p>}
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{h.class?.name || "—"}</p>
                              {h.section?.name && <p className="text-xs text-muted-foreground">{h.section.name}</p>}
                            </TableCell>
                            <TableCell><Badge variant="secondary">{h.subject?.name || "—"}</Badge></TableCell>
                            <TableCell className="text-sm">{formatDate(h.homeworkDate)}</TableCell>
                            <TableCell>
                              <span className={`text-sm ${overdue ? "text-red-600 font-medium" : ""}`}>{formatDate(h.submissionDate)}</span>
                              {overdue && <Badge variant="destructive" className="ml-1 text-[10px]">Overdue</Badge>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-emerald-50">{submitted}/{total}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => { setSelectedHw(h); setEvaluateOpen(true); }}
                                  title="View & Evaluate"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <ConfirmDialog
                                  trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                                  title="Delete Homework?"
                                  description={`This will permanently delete "${h.title}" and all related submissions.`}
                                  confirmText="Delete"
                                  onConfirm={() => deleteMutation.mutate(h.id)}
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

        <TabsContent value="downloads" className="mt-4">
          {downloads.length === 0 ? (
            <Card>
              <CardContent className="p-4">
                <EmptyState
                  title="No downloads yet"
                  description="Upload study materials, notes, syllabi, and assignments for students"
                  icon={<Download className="h-7 w-7" />}
                  action={
                    <Button onClick={() => setUploadOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                      <Upload className="h-4 w-4" /> Upload Content
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {downloads.map((d: any) => {
                const style = TYPE_STYLES[d.type] || TYPE_STYLES["Study Material"];
                const Icon = style.icon;
                return (
                  <Card key={d.id} className="overflow-hidden border-border/60 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${style.bg} ${style.text}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge variant="secondary" className={`${style.bg} ${style.text}`}>{d.type}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-semibold line-clamp-2">{d.title}</p>
                        {d.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{d.description}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {d.class?.name || "All"}</div>
                        <div className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {d.subject?.name || "—"}</div>
                        <div className="flex items-center gap-1 col-span-2"><CalendarDays className="h-3 w-3" /> {formatDate(d.uploadDate)}</div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <a
                          href={d.fileUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 h-8 flex-1 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-xs font-medium px-3"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                        <ConfirmDialog
                          trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                          title="Delete Content?"
                          description={`Remove "${d.title}" from the download center.`}
                          confirmText="Delete"
                          onConfirm={() => deleteDownloadMutation.mutate(d.id)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AssignHomeworkDialog open={assignOpen} onOpenChange={setAssignOpen} classes={classes} subjects={subjects} />
      <UploadContentDialog open={uploadOpen} onOpenChange={setUploadOpen} classes={classes} subjects={subjects} />
      <EvaluateDialog open={evaluateOpen} onOpenChange={setEvaluateOpen} homework={selectedHw} />
    </div>
  );
}

function AssignHomeworkDialog({ open, onOpenChange, classes, subjects }: any) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<any>({
    title: "", description: "", classId: "", sectionId: "", subjectId: "",
    submissionDate: today,
  });

  useMemo(() => {
    if (open) {
      setForm({
        title: "", description: "", classId: "", sectionId: "", subjectId: "",
        submissionDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [open]);

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const selectedClass = classes.find((c: any) => c.id === form.classId);
  const sections = selectedClass?.sections || [];

  async function handleSave() {
    if (!form.title || !form.classId || !form.subjectId) {
      toast.error("Title, class, and subject are required");
      return;
    }
    setSaving(true);
    try {
      await api("/api/homework", {
        method: "POST",
        body: JSON.stringify({ action: "create", ...form, homeworkDate: new Date().toISOString() }),
      });
      toast.success("Homework assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["homework"] });
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
          <DialogTitle>Assign Homework</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Chapter 5 Exercises" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Detailed instructions..." rows={3} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <Label>Subject <span className="text-destructive">*</span></Label>
              <Select value={form.subjectId} onValueChange={(v) => update("subjectId", v)}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Submission Date <span className="text-destructive">*</span></Label>
            <Input type="date" value={form.submissionDate} onChange={(e) => update("submissionDate", e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Assigning..." : "Assign Homework"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadContentDialog({ open, onOpenChange, classes, subjects }: any) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    title: "", description: "", type: "Notes", classId: "", sectionId: "", subjectId: "", fileUrl: "",
  });

  useMemo(() => {
    if (open) {
      setForm({
        title: "", description: "", type: "Notes", classId: "", sectionId: "", subjectId: "", fileUrl: "",
      });
    }
  }, [open]);

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const selectedClass = classes.find((c: any) => c.id === form.classId);
  const sections = selectedClass?.sections || [];

  async function handleSave() {
    if (!form.title || !form.type || !form.fileUrl) {
      toast.error("Title, type, and file URL are required");
      return;
    }
    setSaving(true);
    try {
      await api("/api/homework", {
        method: "POST",
        body: JSON.stringify({ action: "upload-content", ...form }),
      });
      toast.success("Content uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["downloads"] });
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
          <DialogTitle>Upload Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. JSS 1 Mathematics Notes - Term 1" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Brief description of the content..." rows={2} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Type <span className="text-destructive">*</span></Label>
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DOWNLOAD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Subject</Label>
              <Select value={form.subjectId} onValueChange={(v) => update("subjectId", v)}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Class</Label>
              <Select value={form.classId} onValueChange={(v) => { update("classId", v); update("sectionId", ""); }}>
                <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
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
          </div>
          <div className="space-y-1">
            <Label>File URL <span className="text-destructive">*</span></Label>
            <Input value={form.fileUrl} onChange={(e) => update("fileUrl", e.target.value)} placeholder="https://... or /uploads/file.pdf" />
            <p className="text-xs text-muted-foreground">Provide a direct link to the file (PDF, DOCX, etc.)</p>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Uploading..." : "Upload Content"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EvaluateDialog({ open, onOpenChange, homework }: any) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["homework-detail", homework?.id],
    queryFn: () => api(`/api/homework?action=single&id=${homework.id}`),
    enabled: !!homework && open,
  });

  useMemo(() => {
    if (data?.submissions) {
      setSubmissions(data.submissions.map((s: any) => ({
        id: s.id,
        studentId: s.student?.id,
        name: `${s.student?.firstName || ""} ${s.student?.lastName || ""}`.trim(),
        admissionNo: s.student?.admissionNo || "",
        submitted: s.submitted,
        marks: s.marks ?? "",
        remarks: s.remarks || "",
      })));
    }
  }, [data]);

  const updateSubmission = (id: string, key: string, value: any) => {
    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, [key]: value } : s));
  };

  async function handleSave() {
    const evaluations = submissions
      .filter((s) => s.marks !== "" && s.marks !== null && s.marks !== undefined)
      .map((s) => ({ submissionId: s.id, marks: Number(s.marks), remarks: s.remarks || "" }));

    if (evaluations.length === 0) {
      toast.error("Enter marks for at least one submission");
      return;
    }
    setSaving(true);
    try {
      await Promise.all(evaluations.map((ev) =>
        api("/api/homework", { method: "POST", body: JSON.stringify({ action: "evaluate", ...ev }) })
      ));
      toast.success(`Saved ${evaluations.length} evaluation(s)`);
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      queryClient.invalidateQueries({ queryKey: ["homework-detail", homework?.id] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!homework) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            {homework.title}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
            <Badge variant="secondary">{homework.class?.name} {homework.section?.name}</Badge>
            <Badge variant="outline">{homework.subject?.name}</Badge>
            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Due: {formatDate(homework.submissionDate)}</span>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <EmptyState
            title="No submissions"
            description="No students have been linked to this homework yet."
            icon={<FileQuestion className="h-7 w-7" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Marks</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.admissionNo}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={s.submitted ? "default" : "secondary"}
                          className={s.submitted ? "bg-emerald-500" : "bg-muted text-muted-foreground"}
                        >
                          {s.submitted ? "Submitted" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={s.marks}
                          onChange={(e) => updateSubmission(s.id, "marks", e.target.value)}
                          className="h-8 w-20"
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={s.remarks}
                          onChange={(e) => updateSubmission(s.id, "remarks", e.target.value)}
                          className="h-8"
                          placeholder="e.g. Good work"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? "Saving..." : "Save Evaluations"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
