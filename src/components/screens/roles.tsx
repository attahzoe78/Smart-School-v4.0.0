"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus, ShieldCheck, Lock, Users, Pencil, Trash2, Save, KeyRound,
  Settings as SettingsIcon, ToggleLeft,
} from "lucide-react";
import { MODULES, MODULE_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export function RolesScreen() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editRole, setEditRole] = useState<any>(null);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api("/api/roles"),
  });

  const stats = useMemo(() => ({
    total: roles.length,
    system: roles.filter((r: any) => r.isSystem).length,
    custom: roles.filter((r: any) => !r.isSystem).length,
    users: roles.reduce((a: number, r: any) => a + (r._count?.users || 0), 0),
  }), [roles]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/roles?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Manage access control — roles, permissions, and module visibility"
        icon={<ShieldCheck className="h-5 w-5" />}
        action={
          <Button onClick={() => { setEditRole(null); setAddOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add Role
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total Roles" value={stats.total} icon={ShieldCheck} color="bg-emerald-500" />
        <StatCard title="System Roles" value={stats.system} icon={Lock} color="bg-amber-500" subtitle="Built-in" />
        <StatCard title="Custom Roles" value={stats.custom} icon={KeyRound} color="bg-violet-500" subtitle="User-defined" />
        <StatCard title="Total Users" value={stats.users} icon={Users} color="bg-cyan-500" subtitle="Assigned to roles" />
      </div>

      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading roles...</div>
          ) : roles.length === 0 ? (
            <EmptyState
              title="No roles found"
              description="Create your first custom role"
              icon={<ShieldCheck className="h-7 w-7" />}
              action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Role</Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((r: any) => (
                    <TableRow key={r.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${r.isSystem ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {r.isSystem ? <Lock className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
                          </div>
                          <span className="text-sm font-medium">{r.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{r.description || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" /> {r._count?.users || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.isSystem ? "default" : "secondary"} className={r.isSystem ? "bg-amber-500" : "bg-emerald-500"}>
                          {r.isSystem ? "System" : "Custom"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.isActive ? "default" : "destructive"} className={r.isActive ? "bg-emerald-500" : ""}>
                          {r.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditRole(r); setAddOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {r.isSystem ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled title="System roles cannot be deleted">
                              <Trash2 className="h-4 w-4 text-muted-foreground/50" />
                            </Button>
                          ) : (
                            <ConfirmDialog
                              trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                              title="Delete Role?"
                              description={`This will permanently delete the role "${r.name}". Users assigned this role will need to be reassigned.`}
                              confirmText="Delete"
                              onConfirm={() => deleteMutation.mutate(r.id)}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ModuleToggleCard />

      <RoleDialog open={addOpen} onOpenChange={setAddOpen} role={editRole} />
    </div>
  );
}

/* -------------------------------------------------------------- */
/* Module enable/disable card                                      */
/* -------------------------------------------------------------- */

function ModuleToggleCard() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ["settings", "settings"],
    queryFn: () => api("/api/settings?type=settings"),
  });

  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Default: all modules enabled unless explicit config exists
    try {
      const stored = settings?.theme ? JSON.parse(settings.theme) : null;
      if (stored && typeof stored === "object") {
        setEnabled(stored);
      } else {
        const init: Record<string, boolean> = {};
        MODULES.forEach((m) => (init[m.id] = true));
        setEnabled(init);
      }
    } catch {
      const init: Record<string, boolean> = {};
      MODULES.forEach((m) => (init[m.id] = true));
      setEnabled(init);
    }
  }, [settings]);

  const toggle = (id: string, v: boolean) => setEnabled((s) => ({ ...s, [id]: v }));

  const toggleAll = (cat: string, v: boolean) => {
    setEnabled((s) => {
      const next = { ...s };
      MODULES.filter((m) => m.category === cat).forEach((m) => (next[m.id] = v));
      return next;
    });
  };

  async function saveModules() {
    setSaving(true);
    try {
      await api("/api/roles", { method: "POST", body: JSON.stringify({ action: "toggle-module", modules: enabled }) });
      toast.success("Module visibility saved");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <ToggleLeft className="h-4 w-4 text-emerald-600" /> Module Visibility
        </CardTitle>
        <Button onClick={saveModules} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">Toggle modules on/off across the application. Disabled modules will be hidden from navigation.</p>
        <div className="space-y-4">
          {MODULE_CATEGORIES.map((cat) => {
            const mods = MODULES.filter((m) => m.category === cat);
            if (mods.length === 0) return null;
            const activeCount = mods.filter((m) => enabled[m.id]).length;
            return (
              <div key={cat} className="rounded-lg border p-3 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold">{cat}</h4>
                    <Badge variant="outline" className="text-xs">{activeCount}/{mods.length}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleAll(cat, true)}>Enable all</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleAll(cat, false)}>Disable all</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {mods.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded-md bg-background border">
                      <div className="flex items-center gap-2 min-w-0">
                        <m.icon className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-medium truncate">{m.label}</span>
                      </div>
                      <Switch checked={!!enabled[m.id]} onCheckedChange={(v) => toggle(m.id, v)} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------- */
/* Role Add/Edit Dialog                                            */
/* -------------------------------------------------------------- */

function RoleDialog({ open, onOpenChange, role }: { open: boolean; onOpenChange: (v: boolean) => void; role: any }) {
  const queryClient = useQueryClient();
  const isEdit = !!role;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", isActive: true });
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (role) {
        setForm({ name: role.name, description: role.description || "", isActive: role.isActive });
        try {
          const parsed = typeof role.permissions === "string" ? JSON.parse(role.permissions) : (role.permissions || []);
          setPermissions(Array.isArray(parsed) ? parsed : []);
        } catch {
          setPermissions([]);
        }
      } else {
        setForm({ name: "", description: "", isActive: true });
        setPermissions([]);
      }
    }
  }, [open, role]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const togglePermission = (id: string) => {
    setPermissions((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const toggleCategory = (cat: string, on: boolean) => {
    const ids = MODULES.filter((m) => m.category === cat).map((m) => m.id);
    setPermissions((p) => {
      const next = new Set(p);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return Array.from(next);
    });
  };

  const toggleAll = (on: boolean) => {
    setPermissions(on ? MODULES.map((m) => m.id) : []);
  };

  async function handleSave() {
    if (!form.name) { toast.error("Role name is required"); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api("/api/roles", {
          method: "POST",
          body: JSON.stringify({
            action: "update",
            id: role.id,
            name: form.name,
            description: form.description,
            permissions,
            isActive: form.isActive,
          }),
        });
        toast.success("Role updated successfully");
      } else {
        await api("/api/roles", {
          method: "POST",
          body: JSON.stringify({
            action: "create",
            name: form.name,
            description: form.description,
            permissions,
            isActive: form.isActive,
          }),
        });
        toast.success("Role created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = permissions.length;
  const totalCount = MODULES.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEdit ? `Edit Role — ${role.name}` : "Create New Role"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[70vh]">
          <div className="p-4 border-b space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Role Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Exam Officer" />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch checked={form.isActive} onCheckedChange={(v) => update("isActive", v)} id="role-active" />
                  <Label htmlFor="role-active" className="text-sm cursor-pointer">{form.isActive ? "Active" : "Inactive"}</Label>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} placeholder="Brief description of what this role can do" />
            </div>
          </div>

          <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold">Permissions</span>
              <Badge variant="secondary" className="text-xs">{selectedCount} / {totalCount} modules</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleAll(true)}>Select all</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleAll(false)}>Clear all</Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {MODULE_CATEGORIES.map((cat) => {
                const mods = MODULES.filter((m) => m.category === cat);
                if (mods.length === 0) return null;
                const selected = mods.filter((m) => permissions.includes(m.id)).length;
                const allOn = selected === mods.length;
                const someOn = selected > 0 && !allOn;
                return (
                  <div key={cat} className="rounded-lg border">
                    <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={allOn ? true : someOn ? "indeterminate" : false}
                          onCheckedChange={(v) => toggleCategory(cat, !!v)}
                        />
                        <span className="text-sm font-semibold">{cat}</span>
                        <Badge variant="outline" className="text-[10px]">{selected}/{mods.length}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2">
                      {mods.map((m) => {
                        const checked = permissions.includes(m.id);
                        return (
                          <label key={m.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                            <Checkbox checked={checked} onCheckedChange={() => togglePermission(m.id)} />
                            <m.icon className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="text-xs flex-1 truncate">{m.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <Separator />
          <div className="p-4 flex justify-end gap-2 bg-background">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : isEdit ? "Update Role" : "Create Role"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
