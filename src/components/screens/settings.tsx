"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus, Settings as SettingsIcon, GraduationCap, BookOpen, Building2, Home, Bus,
  CalendarDays, Pencil, Trash2, Save, Users, DoorOpen, Route, Server, RefreshCw, Database, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { NIGERIAN_STATES } from "@/lib/constants";
import { useAppStore } from "@/store/app";

type TabValue = "general" | "classes" | "subjects" | "departments" | "hostel" | "transport" | "sessions" | "system";

const TABS: { value: TabValue; label: string; icon: typeof SettingsIcon }[] = [
  { value: "general", label: "General", icon: SettingsIcon },
  { value: "classes", label: "Classes", icon: GraduationCap },
  { value: "subjects", label: "Subjects", icon: BookOpen },
  { value: "departments", label: "Departments", icon: Building2 },
  { value: "hostel", label: "Hostel", icon: Home },
  { value: "transport", label: "Transport", icon: Bus },
  { value: "sessions", label: "Sessions", icon: CalendarDays },
  { value: "system", label: "System", icon: Server },
];

export function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<TabValue>("general");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure school information, classes, subjects, departments, hostel, transport & sessions"
        icon={<SettingsIcon className="h-5 w-5" />}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-full sm:w-auto flex justify-start">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                <t.icon className="h-4 w-4" />
                <span className="hidden md:inline">{t.label}</span>
                <span className="md:hidden">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="general" className="mt-4"><GeneralPanel /></TabsContent>
        <TabsContent value="classes" className="mt-4"><ClassesPanel /></TabsContent>
        <TabsContent value="subjects" className="mt-4"><SubjectsPanel /></TabsContent>
        <TabsContent value="departments" className="mt-4"><DepartmentsPanel /></TabsContent>
        <TabsContent value="hostel" className="mt-4"><HostelPanel /></TabsContent>
        <TabsContent value="transport" className="mt-4"><TransportPanel /></TabsContent>
        <TabsContent value="sessions" className="mt-4"><SessionsPanel /></TabsContent>
        <TabsContent value="system" className="mt-4"><SystemPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* General Settings                                                */
/* -------------------------------------------------------------- */

function GeneralPanel() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "settings"],
    queryFn: () => api("/api/settings?type=settings"),
  });

  const [form, setForm] = useState<any>({
    schoolName: "", schoolCode: "", tagLine: "", phone: "", email: "",
    address: "", city: "", state: "", country: "Nigeria",
    currency: "₦", currencyCode: "NGN", language: "English", timezone: "Africa/Lagos",
    logo: "", favicon: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        schoolName: settings.schoolName || "",
        schoolCode: settings.schoolCode || "",
        tagLine: settings.tagLine || "",
        phone: settings.phone || "",
        email: settings.email || "",
        address: settings.address || "",
        city: settings.city || "",
        state: settings.state || "",
        country: settings.country || "Nigeria",
        currency: settings.currency || "₦",
        currencyCode: settings.currencyCode || "NGN",
        language: settings.language || "English",
        timezone: settings.timezone || "Africa/Lagos",
        logo: settings.logo || "",
        favicon: settings.favicon || "",
      });
    }
  }, [settings]);

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      await api("/api/settings", { method: "POST", body: JSON.stringify({ type: "settings", ...form }) });
      toast.success("School settings saved");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <div className="py-12 text-center text-sm text-muted-foreground">Loading settings...</div>;

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">School Information</h3>
            <p className="text-xs text-muted-foreground">General configuration for your school</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 text-emerald-700">Identity</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>School Name <span className="text-destructive">*</span></Label>
                <Input value={form.schoolName} onChange={(e) => update("schoolName", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>School Code</Label>
                <Input value={form.schoolCode} onChange={(e) => update("schoolCode", e.target.value)} placeholder="SSJ-001" />
              </div>
              <div className="space-y-1">
                <Label>Tag Line</Label>
                <Input value={form.tagLine} onChange={(e) => update("tagLine", e.target.value)} placeholder="Knowledge • Discipline • Excellence" />
              </div>
              <div className="space-y-1">
                <Label>Logo URL</Label>
                <Input value={form.logo} onChange={(e) => update("logo", e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <Label>Favicon URL</Label>
                <Input value={form.favicon} onChange={(e) => update("favicon", e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2 text-emerald-700">Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234 803..." />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => update("country", e.target.value)} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2 text-emerald-700">Location</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>State</Label>
                <Select value={form.state} onValueChange={(v) => update("state", v)}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2 text-emerald-700">Localization</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Currency Symbol</Label>
                <Input value={form.currency} onChange={(e) => update("currency", e.target.value)} placeholder="₦" />
              </div>
              <div className="space-y-1">
                <Label>Currency Code</Label>
                <Input value={form.currencyCode} onChange={(e) => update("currencyCode", e.target.value)} placeholder="NGN" />
              </div>
              <div className="space-y-1">
                <Label>Language</Label>
                <Select value={form.language} onValueChange={(v) => update("language", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hausa">Hausa</SelectItem>
                    <SelectItem value="Yoruba">Yoruba</SelectItem>
                    <SelectItem value="Igbo">Igbo</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Timezone</Label>
                <Select value={form.timezone} onValueChange={(v) => update("timezone", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                    <SelectItem value="Africa/Abuja">Africa/Abuja</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => settings && setForm({
              schoolName: settings.schoolName || "", schoolCode: settings.schoolCode || "",
              tagLine: settings.tagLine || "", phone: settings.phone || "", email: settings.email || "",
              address: settings.address || "", city: settings.city || "", state: settings.state || "",
              country: settings.country || "Nigeria", currency: settings.currency || "₦",
              currencyCode: settings.currencyCode || "NGN", language: settings.language || "English",
              timezone: settings.timezone || "Africa/Lagos", logo: settings.logo || "", favicon: settings.favicon || "",
            })}>Reset</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------- */
/* Shared hook                                                     */
/* -------------------------------------------------------------- */

function useSettingsList() {
  return useQuery({
    queryKey: ["settings", "all"],
    queryFn: () => api("/api/settings?type=all"),
  });
}

/* -------------------------------------------------------------- */
/* Classes Panel                                                   */
/* -------------------------------------------------------------- */

function ClassesPanel() {
  const { data, isLoading } = useSettingsList();
  const classes = data?.classes || [];
  const [addOpen, setAddOpen] = useState(false);
  const [manageClass, setManageClass] = useState<any>(null);

  const queryClient = useQueryClient();
  const delMutation = useMutation({
    mutationFn: (id: string) => api(`/api/settings?id=${id}&type=class`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Class deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Classes & Sections</h3>
          <p className="text-xs text-muted-foreground">{classes.length} classes configured</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Add Class
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading classes...</div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="No classes"
              description="Add your first class"
              icon={<GraduationCap className="h-7 w-7" />}
              action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Class</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map((c: any) => (
            <Card key={c.id} className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c._count?.students || 0} students</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">{c.sections?.length || 0} sections</Badge>
                </div>
                {c.sections?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {c.sections.map((s: any) => (
                      <Badge key={s.id} variant="outline" className="text-xs">{s.name}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => setManageClass(c)}>
                    <Pencil className="h-3.5 w-3.5" /> Manage Sections
                  </Button>
                  <ConfirmDialog
                    trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                    title="Delete Class?"
                    description={`This will delete "${c.name}" and all its sections.`}
                    confirmText="Delete"
                    onConfirm={() => delMutation.mutate(c.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClassDialog open={addOpen} onOpenChange={setAddOpen} />
      <SectionsDialog classData={manageClass} onClose={() => setManageClass(null)} />
    </div>
  );
}

function ClassDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  async function handleSave() {
    if (!name) { toast.error("Class name is required"); return; }
    setSaving(true);
    try {
      await api("/api/settings", { method: "POST", body: JSON.stringify({ type: "class", name }) });
      toast.success("Class added with default sections A & B");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setName("");
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
        <DialogHeader><DialogTitle>Add New Class</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Class Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. JSS 1, Primary 5, SSS 2" />
            <p className="text-xs text-muted-foreground">Default sections A and B will be created automatically.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Add Class"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionsDialog({ classData, onClose }: { classData: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<any[]>([]);
  const [newSection, setNewSection] = useState({ name: "", capacity: 40 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (classData) {
      setSections(classData.sections || []);
      setNewSection({ name: "", capacity: 40 });
    }
  }, [classData]);

  async function addSection() {
    if (!newSection.name) { toast.error("Section name is required"); return; }
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "POST",
        body: JSON.stringify({ type: "section", name: newSection.name, capacity: newSection.capacity, classId: classData.id }),
      });
      toast.success(`Section ${newSection.name} added`);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setNewSection({ name: "", capacity: 40 });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSection(id: string) {
    try {
      await api(`/api/settings?id=${id}&type=section`, { method: "DELETE" });
      toast.success("Section deleted");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (!classData) return null;

  return (
    <Dialog open={!!classData} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Sections — {classData.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={newSection.name} onChange={(e) => setNewSection({ ...newSection, name: e.target.value })} placeholder="Section name (e.g. C, Gold)" className="flex-1" />
            <Input type="number" value={newSection.capacity} onChange={(e) => setNewSection({ ...newSection, capacity: parseInt(e.target.value || "0") })} className="w-28" placeholder="Capacity" />
            <Button onClick={addSection} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No sections yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sections.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">{s.name}</Badge>
                    <span className="text-xs text-muted-foreground">Capacity: {s.capacity}</span>
                  </div>
                  <ConfirmDialog
                    trigger={<Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
                    title="Delete Section?"
                    description={`This will delete section ${s.name}.`}
                    confirmText="Delete"
                    onConfirm={() => deleteSection(s.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- */
/* Subjects Panel                                                  */
/* -------------------------------------------------------------- */

function SubjectsPanel() {
  const { data, isLoading } = useSettingsList();
  const subjects = data?.subjects || [];
  const [addOpen, setAddOpen] = useState(false);

  const queryClient = useQueryClient();
  const delMutation = useMutation({
    mutationFn: (id: string) => api(`/api/settings?id=${id}&type=subject`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Subject deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Subjects</h3>
          <p className="text-xs text-muted-foreground">{subjects.length} subjects offered</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Add Subject
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading subjects...</div>
      ) : subjects.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="No subjects"
              description="Add your first subject"
              icon={<BookOpen className="h-7 w-7" />}
              action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Subject</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {subjects.map((s: any) => (
                <div key={s.id} className="group flex items-center gap-2 pl-3 pr-1 py-1.5 rounded-full border bg-card hover:shadow-sm transition-shadow">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-sm font-medium">{s.name}</span>
                  {s.code && <span className="text-xs text-muted-foreground font-mono">({s.code})</span>}
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">{s.type || "Theory"}</Badge>
                  <ConfirmDialog
                    trigger={<Button size="icon" variant="ghost" className="h-6 w-6 text-destructive opacity-60 group-hover:opacity-100"><Trash2 className="h-3 w-3" /></Button>}
                    title="Delete Subject?"
                    description={`This will permanently delete "${s.name}".`}
                    confirmText="Delete"
                    onConfirm={() => delMutation.mutate(s.id)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <SubjectDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function SubjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", type: "Theory" });

  async function handleSave() {
    if (!form.name) { toast.error("Subject name is required"); return; }
    setSaving(true);
    try {
      await api("/api/settings", { method: "POST", body: JSON.stringify({ type: "subject", ...form }) });
      toast.success("Subject added");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setForm({ name: "", code: "", type: "Theory" });
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
        <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Subject Name <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mathematics" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="MTH" />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Theory">Theory</SelectItem>
                  <SelectItem value="Practical">Practical</SelectItem>
                  <SelectItem value="Theory & Practical">Theory & Practical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Add Subject"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- */
/* Departments Panel                                               */
/* -------------------------------------------------------------- */

function DepartmentsPanel() {
  const { data, isLoading } = useSettingsList();
  const departments = data?.departments || [];
  const [addOpen, setAddOpen] = useState(false);

  const queryClient = useQueryClient();
  const delMutation = useMutation({
    mutationFn: (id: string) => api(`/api/settings?id=${id}&type=department`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Department deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Departments</h3>
          <p className="text-xs text-muted-foreground">{departments.length} departments</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Add Department
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading departments...</div>
      ) : departments.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="No departments"
              description="Add your first department"
              icon={<Building2 className="h-7 w-7" />}
              action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Department</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map((d: any) => (
            <Card key={d.id} className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{d.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {d._count?.staff || 0} staff
                      </p>
                    </div>
                  </div>
                  <ConfirmDialog
                    trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                    title="Delete Department?"
                    description={`This will permanently delete "${d.name}".`}
                    confirmText="Delete"
                    onConfirm={() => delMutation.mutate(d.id)}
                  />
                </div>
                {d.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{d.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DepartmentDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function DepartmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  async function handleSave() {
    if (!form.name) { toast.error("Department name is required"); return; }
    setSaving(true);
    try {
      await api("/api/settings", { method: "POST", body: JSON.stringify({ type: "department", ...form }) });
      toast.success("Department added");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setForm({ name: "", description: "" });
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
        <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Department Name <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Science" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Add Department"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- */
/* Hostel Panel                                                    */
/* -------------------------------------------------------------- */

function HostelPanel() {
  const { data, isLoading } = useSettingsList();
  const hostels = data?.hostels || [];
  const [addHostelOpen, setAddHostelOpen] = useState(false);
  const [addRoomOpen, setAddRoomOpen] = useState(false);

  const queryClient = useQueryClient();
  const delHostel = useMutation({
    mutationFn: (id: string) => api(`/api/settings?id=${id}&type=hostel`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Hostel deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
  const delRoom = useMutation({
    mutationFn: (id: string) => api(`/api/settings?id=${id}&type=hostel-room`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Room deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Hostels</h3>
          <p className="text-xs text-muted-foreground">{hostels.length} hostels • {hostels.reduce((a: number, h: any) => a + (h.rooms?.length || 0), 0)} rooms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddRoomOpen(true)}>
            <DoorOpen className="h-4 w-4" /> Add Room
          </Button>
          <Button onClick={() => setAddHostelOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add Hostel
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading hostels...</div>
      ) : hostels.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="No hostels"
              description="Add your first hostel"
              icon={<Home className="h-7 w-7" />}
              action={<Button onClick={() => setAddHostelOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Hostel</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {hostels.map((h: any) => (
            <Card key={h.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <Home className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{h.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">{h.type}</Badge>
                        <span>Capacity: {h.capacity}</span>
                        <span>•</span>
                        <span>{h.rooms?.length || 0} rooms</span>
                      </div>
                    </div>
                  </div>
                  <ConfirmDialog
                    trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                    title="Delete Hostel?"
                    description={`This will delete "${h.name}" and all its rooms.`}
                    confirmText="Delete"
                    onConfirm={() => delHostel.mutate(h.id)}
                  />
                </div>
                {h.address && <p className="text-xs text-muted-foreground mt-2">{h.address}</p>}
                {h.rooms?.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Rooms</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {h.rooms.map((r: any) => (
                        <div key={r.id} className="group flex items-center justify-between p-2 rounded-md border bg-muted/30">
                          <div>
                            <p className="text-xs font-medium">Room {r.roomNo}</p>
                            <p className="text-[10px] text-muted-foreground">{r.roomType} • {formatCurrency(r.fee)}</p>
                          </div>
                          <ConfirmDialog
                            trigger={<Button size="icon" variant="ghost" className="h-6 w-6 text-destructive opacity-60 group-hover:opacity-100"><Trash2 className="h-3 w-3" /></Button>}
                            title="Delete Room?"
                            description={`This will delete Room ${r.roomNo}.`}
                            confirmText="Delete"
                            onConfirm={() => delRoom.mutate(r.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <HostelDialog open={addHostelOpen} onOpenChange={setAddHostelOpen} />
      <RoomDialog open={addRoomOpen} onOpenChange={setAddRoomOpen} hostels={hostels} />
    </div>
  );
}

function HostelDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Boys", address: "", capacity: 100 });

  async function handleSave() {
    if (!form.name) { toast.error("Hostel name is required"); return; }
    setSaving(true);
    try {
      await api("/api/settings", { method: "POST", body: JSON.stringify({ type: "hostel", ...form }) });
      toast.success("Hostel added");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setForm({ name: "", type: "Boys", address: "", capacity: 100 });
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
        <DialogHeader><DialogTitle>Add Hostel</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Hostel Name <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="King David Hostel" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Boys">Boys</SelectItem>
                  <SelectItem value="Girls">Girls</SelectItem>
                  <SelectItem value="Co-ed">Co-ed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Capacity</Label>
              <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value || "0") })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Address</Label>
            <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Add Hostel"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RoomDialog({ open, onOpenChange, hostels }: { open: boolean; onOpenChange: (v: boolean) => void; hostels: any[] }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ hostelId: "", roomNo: "", roomType: "Shared", capacity: 2, fee: 0 });

  useEffect(() => {
    if (open && hostels.length > 0 && !form.hostelId) {
      setForm((f) => ({ ...f, hostelId: hostels[0].id }));
    }
  }, [open, hostels, form.hostelId]);

  async function handleSave() {
    if (!form.hostelId || !form.roomNo) { toast.error("Hostel and room number are required"); return; }
    setSaving(true);
    try {
      await api("/api/settings", { method: "POST", body: JSON.stringify({ type: "hostel-room", ...form }) });
      toast.success("Room added");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setForm({ hostelId: form.hostelId, roomNo: "", roomType: "Shared", capacity: 2, fee: 0 });
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
        <DialogHeader><DialogTitle>Add Hostel Room</DialogTitle></DialogHeader>
        {hostels.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Please add a hostel first.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Hostel <span className="text-destructive">*</span></Label>
              <Select value={form.hostelId} onValueChange={(v) => setForm({ ...form, hostelId: v })}>
                <SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger>
                <SelectContent>
                  {hostels.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Room No <span className="text-destructive">*</span></Label>
                <Input value={form.roomNo} onChange={(e) => setForm({ ...form, roomNo: e.target.value })} placeholder="A-101" />
              </div>
              <div className="space-y-1">
                <Label>Room Type</Label>
                <Select value={form.roomType} onValueChange={(v) => setForm({ ...form, roomType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Shared">Shared</SelectItem>
                    <SelectItem value="Dormitory">Dormitory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Capacity</Label>
                <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value || "0") })} />
              </div>
              <div className="space-y-1">
                <Label>Fee (₦)</Label>
                <Input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: parseFloat(e.target.value || "0") })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? "Saving..." : "Add Room"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- */
/* Transport Panel                                                 */
/* -------------------------------------------------------------- */

function TransportPanel() {
  const { data, isLoading } = useSettingsList();
  const routes = data?.routes || [];
  const [addOpen, setAddOpen] = useState(false);

  const queryClient = useQueryClient();
  const delMutation = useMutation({
    mutationFn: (id: string) => api(`/api/settings?id=${id}&type=transport-route`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Route deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Transport Routes</h3>
          <p className="text-xs text-muted-foreground">{routes.length} routes configured</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Add Route
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading routes...</div>
      ) : routes.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="No transport routes"
              description="Add your first route"
              icon={<Bus className="h-7 w-7" />}
              action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Route</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {routes.map((r: any) => (
            <Card key={r.id} className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                      <Route className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{r.routeName}</p>
                      {r.vehicleNo && <p className="text-xs text-muted-foreground font-mono">{r.vehicleNo}</p>}
                    </div>
                  </div>
                  <ConfirmDialog
                    trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                    title="Delete Route?"
                    description={`This will permanently delete "${r.routeName}".`}
                    confirmText="Delete"
                    onConfirm={() => delMutation.mutate(r.id)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">From</p>
                    <p className="font-medium">{r.startPoint || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">To</p>
                    <p className="font-medium">{r.endPoint || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Driver</p>
                    <p className="font-medium">{r.driverName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{r.driverPhone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fare</p>
                    <p className="font-medium text-emerald-600">{formatCurrency(r.fare)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Capacity</p>
                    <p className="font-medium">{r.capacity} seats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RouteDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function RouteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    routeName: "", vehicleNo: "", driverName: "", driverPhone: "",
    startPoint: "", endPoint: "", fare: 0, capacity: 30,
  });

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.routeName) { toast.error("Route name is required"); return; }
    setSaving(true);
    try {
      await api("/api/settings", { method: "POST", body: JSON.stringify({ type: "transport-route", ...form }) });
      toast.success("Route added");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setForm({ routeName: "", vehicleNo: "", driverName: "", driverPhone: "", startPoint: "", endPoint: "", fare: 0, capacity: 30 });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Transport Route</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Route Name <span className="text-destructive">*</span></Label>
              <Input value={form.routeName} onChange={(e) => update("routeName", e.target.value)} placeholder="Jos - Bukuru" />
            </div>
            <div className="space-y-1">
              <Label>Vehicle No</Label>
              <Input value={form.vehicleNo} onChange={(e) => update("vehicleNo", e.target.value)} placeholder="XYZ 123 AB" />
            </div>
            <div className="space-y-1">
              <Label>Driver Name</Label>
              <Input value={form.driverName} onChange={(e) => update("driverName", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Driver Phone</Label>
              <Input value={form.driverPhone} onChange={(e) => update("driverPhone", e.target.value)} placeholder="+234..." />
            </div>
            <div className="space-y-1">
              <Label>Start Point</Label>
              <Input value={form.startPoint} onChange={(e) => update("startPoint", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>End Point</Label>
              <Input value={form.endPoint} onChange={(e) => update("endPoint", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Fare (₦)</Label>
              <Input type="number" value={form.fare} onChange={(e) => update("fare", parseFloat(e.target.value || "0"))} />
            </div>
            <div className="space-y-1">
              <Label>Capacity</Label>
              <Input type="number" value={form.capacity} onChange={(e) => update("capacity", parseInt(e.target.value || "0"))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Add Route"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- */
/* Sessions Panel                                                  */
/* -------------------------------------------------------------- */

function SessionsPanel() {
  const { data, isLoading } = useSettingsList();
  const sessions = data?.sessions || [];
  const [addOpen, setAddOpen] = useState(false);

  const queryClient = useQueryClient();
  const delMutation = useMutation({
    mutationFn: (id: string) => api(`/api/settings?id=${id}&type=session`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Session deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Academic Sessions</h3>
          <p className="text-xs text-muted-foreground">{sessions.length} sessions • {sessions.filter((s: any) => s.isActive).length} active</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Add Session
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="No academic sessions"
              description="Add your first session"
              icon={<CalendarDays className="h-7 w-7" />}
              action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Session</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s: any) => (
                    <TableRow key={s.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{s.session}</TableCell>
                      <TableCell>
                        <Badge variant={s.isActive ? "default" : "secondary"} className={s.isActive ? "bg-emerald-500" : ""}>
                          {s.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {s.isDefault ? <Badge className="bg-amber-500">Default</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <ConfirmDialog
                          trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                          title="Delete Session?"
                          description={`This will permanently delete session "${s.session}".`}
                          confirmText="Delete"
                          onConfirm={() => delMutation.mutate(s.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <SessionDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function SessionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ session: "", isActive: true, isDefault: false });

  async function handleSave() {
    if (!form.session) { toast.error("Session is required"); return; }
    setSaving(true);
    try {
      await api("/api/settings", { method: "POST", body: JSON.stringify({ type: "session", ...form }) });
      toast.success("Session added");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setForm({ session: "", isActive: true, isDefault: false });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const currentYear = new Date().getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Academic Session</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Session <span className="text-destructive">*</span></Label>
            <Input value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} placeholder={`${currentYear}/${currentYear + 1}`} />
            <p className="text-xs text-muted-foreground">Format: YYYY/YYYY (e.g. 2024/2025)</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} id="session-active" />
              <Label htmlFor="session-active" className="text-sm cursor-pointer">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isDefault} onCheckedChange={(v) => setForm({ ...form, isDefault: v })} id="session-default" />
              <Label htmlFor="session-default" className="text-sm cursor-pointer">Default</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Add Session"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- */
/* System Panel - Install Info, Reset, Reinstall                  */
/* -------------------------------------------------------------- */

function SystemPanel() {
  const { logout } = useAppStore();
  const [resetting, setResetting] = useState(false);
  const [clearing, setClearing] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["settings", "settings"],
    queryFn: () => api("/api/settings?type=settings"),
  });

  const { data: installStatus } = useQuery({
    queryKey: ["install-status"],
    queryFn: () => api("/api/install"),
  });

  async function handleReset() {
    setResetting(true);
    try {
      const res = await api("/api/reset", {
        method: "POST",
        body: JSON.stringify({ action: "reset-system" }),
      });
      toast.success(res.message);
      setTimeout(() => {
        logout();
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setResetting(false);
    }
  }

  async function handleClearDemo() {
    setClearing(true);
    try {
      const res = await api("/api/reset", {
        method: "POST",
        body: JSON.stringify({ action: "clear-demo-data" }),
      });
      toast.success(res.message);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Installation Status */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-semibold">Installation Status</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-muted-foreground">System Status</p>
                <p className="text-sm font-medium">{installStatus?.installed ? "Installed" : "Not Installed"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <Database className="h-5 w-5 text-violet-600" />
              <div>
                <p className="text-xs text-muted-foreground">Version</p>
                <p className="text-sm font-medium">Smart School v4.0.0</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <SettingsIcon className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">School Name</p>
                <p className="text-sm font-medium">{settings?.schoolName || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <CalendarDays className="h-5 w-5 text-sky-600" />
              <div>
                <p className="text-xs text-muted-foreground">Install Date</p>
                <p className="text-sm font-medium">{settings?.startDate ? formatDate(settings.startDate) : "—"}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm">
            <p className="font-medium text-emerald-900">Web Install Application</p>
            <p className="text-xs text-emerald-800 mt-1">
              This Smart School installation was set up via the web-based installation wizard. The system is fully configured and ready to use.
              You can reset the system to run the installer again, or clear demo data while keeping your configuration.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-violet-600" />
            <h3 className="text-base font-semibold">System Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <InfoRow label="Software" value="Smart School" />
            <InfoRow label="Version" value="4.0.0" />
            <InfoRow label="Developer" value="Sisi Technology Ltd" />
            <InfoRow label="Location" value="Jos, Plateau State, Nigeria" />
            <InfoRow label="Framework" value="Next.js 16" />
            <InfoRow label="Database" value="SQLite (Prisma ORM)" />
            <InfoRow label="Currency" value={`${settings?.currency || "₦"} (${settings?.currencyCode || "NGN"})`} />
            <InfoRow label="Timezone" value={settings?.timezone || "Africa/Lagos"} />
            <InfoRow label="Language" value={settings?.language || "English"} />
            <InfoRow label="Modules" value="25+" />
            <InfoRow label="User Roles" value="8 (Super Admin, Admin, Accountant, Teacher, Receptionist, Librarian, Parent, Student)" />
            <InfoRow label="License" value="Proprietary" />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-base font-semibold text-red-700">Danger Zone</h3>
          </div>

          {/* Clear Demo Data */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50">
            <div>
              <p className="text-sm font-medium">Clear All Data</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Removes all students, staff, fees, exams, and other records. Keeps school settings and admin account.
              </p>
            </div>
            <ConfirmDialog
              trigger={
                <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100" disabled={clearing}>
                  <RefreshCw className={`h-4 w-4 ${clearing ? "animate-spin" : ""}`} /> {clearing ? "Clearing..." : "Clear Data"}
                </Button>
              }
              title="Clear All Data?"
              description="This will permanently delete ALL students, staff, fees, attendance, exams, and other records. Your school settings and admin login will be preserved. This action cannot be undone."
              confirmText="Yes, Clear All Data"
              onConfirm={handleClearDemo}
            />
          </div>

          {/* Reset System */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-red-200 bg-red-50">
            <div>
              <p className="text-sm font-medium">Reset System (Reinstall)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Completely resets the system to factory state. You will be redirected to the installation wizard to set up again.
              </p>
            </div>
            <ConfirmDialog
              trigger={
                <Button variant="destructive" disabled={resetting}>
                  <AlertTriangle className="h-4 w-4" /> {resetting ? "Resetting..." : "Reset System"}
                </Button>
              }
              title="Reset Entire System?"
              description="WARNING: This will completely erase ALL data including school settings, admin accounts, and all records. You will be redirected to the installation wizard to set up the system from scratch. This action cannot be undone."
              confirmText="Yes, Reset Everything"
              onConfirm={handleReset}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xs font-medium text-right">{value}</span>
    </div>
  );
}
