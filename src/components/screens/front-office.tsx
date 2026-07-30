"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Plus, Search, Phone, Users, Mail, Send, Inbox,
  Eye, Trash2, PhoneCall, BookUser, LogOut,
  Calendar, Clock, User, CheckCircle2, AlertTriangle,
  PhoneIncoming, PhoneOutgoing, ArrowRightLeft, Building2,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/format";

const ENQUIRY_SOURCES = ["Walk-in", "Phone", "Website", "Referral"] as const;
const COMPLAIN_SOURCES = ["Student", "Parent", "Staff", "Visitor", "Other"] as const;
const COMPLAIN_TYPES = ["Academic", "Behavior", "Facility", "Fee", "Transport", "Harassment", "Other"] as const;

/* ============================================================
 * MAIN SCREEN
 * ============================================================ */
export function FrontOfficeScreen() {
  const [activeTab, setActiveTab] = useState("enquiry");

  const { data: enquiries = [], isLoading: enqLoading } = useQuery<any[]>({
    queryKey: ["front-office", "enquiry"],
    queryFn: () => api("/api/front-office?type=enquiry"),
  });
  const { data: visitors = [] } = useQuery<any[]>({
    queryKey: ["front-office", "visitor"],
    queryFn: () => api("/api/front-office?type=visitor"),
  });
  const { data: calls = [] } = useQuery<any[]>({
    queryKey: ["front-office", "call"],
    queryFn: () => api("/api/front-office?type=call"),
  });
  const { data: complains = [] } = useQuery<any[]>({
    queryKey: ["front-office", "complain"],
    queryFn: () => api("/api/front-office?type=complain"),
  });

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      activeEnquiries: enquiries.filter((e) => e.status === "Active").length,
      visitorsToday: visitors.filter((v) => new Date(v.checkIn).toDateString() === today).length,
      phoneCalls: calls.length,
      pendingComplaints: complains.filter((c) => c.status === "Pending" || c.status === "In Progress").length,
    };
  }, [enquiries, visitors, calls, complains]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Front Office"
        description="Manage enquiries, visitors, calls, postal records & complaints"
        icon={<Building2 className="h-5 w-5" />}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Active Enquiries" value={stats.activeEnquiries} icon={PhoneCall} color="bg-emerald-500" subtitle="Awaiting follow-up" />
        <StatCard title="Visitors Today" value={stats.visitorsToday} icon={Users} color="bg-teal-500" subtitle="Checked in today" />
        <StatCard title="Phone Calls" value={stats.phoneCalls} icon={Phone} color="bg-amber-500" subtitle="Logged in total" />
        <StatCard title="Pending Complaints" value={stats.pendingComplaints} icon={AlertTriangle} color="bg-rose-500" subtitle="Need resolution" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1">
          <TabsTrigger value="enquiry" className="gap-1.5"><PhoneCall className="h-4 w-4" /> Admission Enquiry</TabsTrigger>
          <TabsTrigger value="visitor" className="gap-1.5"><Users className="h-4 w-4" /> Visitor Book</TabsTrigger>
          <TabsTrigger value="call" className="gap-1.5"><Phone className="h-4 w-4" /> Phone Call Log</TabsTrigger>
          <TabsTrigger value="postal" className="gap-1.5"><Send className="h-4 w-4" /> Postal</TabsTrigger>
          <TabsTrigger value="complaints" className="gap-1.5"><AlertTriangle className="h-4 w-4" /> Complaints</TabsTrigger>
        </TabsList>

        <TabsContent value="enquiry" className="mt-4">
          <EnquiryTab enquiries={enquiries} isLoading={enqLoading} />
        </TabsContent>
        <TabsContent value="visitor" className="mt-4">
          <VisitorTab visitors={visitors} />
        </TabsContent>
        <TabsContent value="call" className="mt-4">
          <CallLogTab calls={calls} />
        </TabsContent>
        <TabsContent value="postal" className="mt-4">
          <PostalTab />
        </TabsContent>
        <TabsContent value="complaints" className="mt-4">
          <ComplaintsTab complains={complains} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================================
 * ENQUIRY TAB
 * ============================================================ */
function EnquiryTab({ enquiries, isLoading }: { enquiries: any[]; isLoading: boolean }) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [viewEnquiry, setViewEnquiry] = useState<any>(null);
  const [followUpEnquiry, setFollowUpEnquiry] = useState<any>(null);

  const { data: settings } = useQuery({
    queryKey: ["settings-all"],
    queryFn: () => api("/api/settings"),
  });
  const classes = settings?.classes || [];

  const filtered = useMemo(() => {
    if (!search) return enquiries;
    const q = search.toLowerCase();
    return enquiries.filter((e) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
      e.phone?.toLowerCase().includes(q) ||
      e.enquiryNo?.toLowerCase().includes(q) ||
      e.classApplied?.toLowerCase().includes(q)
    );
  }, [enquiries, search]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/front-office?id=${id}&type=enquiry`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Enquiry deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, enquiry no..." className="pl-9" />
          </div>
          <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
            <Plus className="h-4 w-4" /> Add Enquiry
          </Button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading enquiries...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No enquiries found"
            description="Add your first admission enquiry to get started"
            icon={<PhoneCall className="h-7 w-7" />}
            action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Enquiry</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enquiry No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Class Applied</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{e.enquiryNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium shrink-0">
                          {`${e.firstName?.[0] || ""}${e.lastName?.[0] || ""}`.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{e.firstName} {e.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{e.phone || "—"}</TableCell>
                    <TableCell className="text-sm">{e.classApplied || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{e.source || "—"}</Badge>
                    </TableCell>
                    <TableCell><EnquiryStatusBadge status={e.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(e.date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewEnquiry(e)} title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFollowUpEnquiry(e)} title="Follow Up">
                          <PhoneCall className="h-4 w-4" />
                        </Button>
                        <ConfirmDialog
                          trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                          title="Delete Enquiry?"
                          description={`This will permanently delete enquiry ${e.enquiryNo} and all follow-ups.`}
                          confirmText="Delete"
                          onConfirm={() => deleteMutation.mutate(e.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <EnquiryFormDialog open={addOpen} onOpenChange={setAddOpen} classes={classes} />
      <FollowUpDialog enquiry={followUpEnquiry} onClose={() => setFollowUpEnquiry(null)} />
      <EnquiryDetailSheet enquiry={viewEnquiry} onClose={() => setViewEnquiry(null)} />
    </Card>
  );
}

function EnquiryStatusBadge({ status }: { status: string }) {
  if (status === "Active") return <Badge className="bg-emerald-500 hover:bg-emerald-500">Active</Badge>;
  if (status === "Admitted") return <Badge className="bg-teal-600 hover:bg-teal-600">Admitted</Badge>;
  if (status === "Closed") return <Badge variant="secondary">Closed</Badge>;
  if (status === "Inactive") return <Badge variant="outline">Inactive</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

function EnquiryFormDialog({ open, onOpenChange, classes }: { open: boolean; onOpenChange: (o: boolean) => void; classes: any[] }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    firstName: "", lastName: "", phone: "", email: "", address: "",
    classApplied: "", source: "Walk-in", description: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        firstName: "", lastName: "", phone: "", email: "", address: "",
        classApplied: "", source: "Walk-in", description: "",
      });
    }
  }, [open]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.firstName || !form.lastName || !form.phone) {
      toast.error("First name, last name and phone are required");
      return;
    }
    setSaving(true);
    try {
      await api("/api/front-office", {
        method: "POST",
        body: JSON.stringify({ type: "enquiry", ...form }),
      });
      toast.success("Enquiry added successfully");
      queryClient.invalidateQueries({ queryKey: ["front-office"] });
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
          <DialogTitle className="flex items-center gap-2"><PhoneCall className="h-5 w-5 text-emerald-600" /> New Admission Enquiry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>First Name <span className="text-destructive">*</span></Label>
              <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="John" />
            </div>
            <div className="space-y-1">
              <Label>Last Name <span className="text-destructive">*</span></Label>
              <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Doe" />
            </div>
            <div className="space-y-1">
              <Label>Phone <span className="text-destructive">*</span></Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234..." />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com" />
            </div>
            <div className="space-y-1">
              <Label>Class Applied</Label>
              <Select value={form.classApplied} onValueChange={(v) => update("classApplied", v)}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => update("source", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENQUIRY_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Street, city" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Additional notes about the enquiry..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Save Enquiry"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FollowUpDialog({ enquiry, onClose }: { enquiry: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    response: "",
    nextAction: "",
    followUpDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (enquiry) {
      setForm({ response: "", nextAction: "", followUpDate: new Date().toISOString().split("T")[0] });
    }
  }, [enquiry]);

  async function handleSave() {
    if (!form.response) { toast.error("Response is required"); return; }
    setSaving(true);
    try {
      await api("/api/front-office", {
        method: "POST",
        body: JSON.stringify({
          type: "followup",
          enquiryId: enquiry.id,
          response: form.response,
          nextAction: form.nextAction,
          followUpDate: form.followUpDate,
        }),
      });
      toast.success("Follow-up recorded");
      queryClient.invalidateQueries({ queryKey: ["front-office", "enquiry"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!enquiry} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PhoneCall className="h-5 w-5 text-emerald-600" /> Record Follow-up</DialogTitle>
        </DialogHeader>
        {enquiry && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-sm font-medium">{enquiry.firstName} {enquiry.lastName}</p>
              <p className="text-xs text-muted-foreground">{enquiry.enquiryNo} • {enquiry.phone}</p>
            </div>
            <div className="space-y-1">
              <Label>Response <span className="text-destructive">*</span></Label>
              <Textarea rows={3} value={form.response} onChange={(e) => setForm((f) => ({ ...f, response: e.target.value }))} placeholder="What was the response from the prospect?" />
            </div>
            <div className="space-y-1">
              <Label>Next Action</Label>
              <Input value={form.nextAction} onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))} placeholder="e.g. Schedule campus visit" />
            </div>
            <div className="space-y-1">
              <Label>Follow-up Date</Label>
              <Input type="date" value={form.followUpDate} onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? "Saving..." : "Save Follow-up"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EnquiryDetailSheet({ enquiry, onClose }: { enquiry: any; onClose: () => void }) {
  if (!enquiry) return null;
  return (
    <Sheet open={!!enquiry} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-3 border-b">
          <SheetTitle className="flex items-center gap-2"><BookUser className="h-5 w-5 text-emerald-600" /> Enquiry Details</SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-lg font-bold">
              {`${enquiry.firstName?.[0] || ""}${enquiry.lastName?.[0] || ""}`.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold">{enquiry.firstName} {enquiry.lastName}</p>
              <p className="text-sm text-muted-foreground">{enquiry.enquiryNo}</p>
            </div>
            <EnquiryStatusBadge status={enquiry.status} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={Phone} label="Phone" value={enquiry.phone} />
            <InfoRow icon={Mail} label="Email" value={enquiry.email} />
            <InfoRow icon={Building2} label="Class Applied" value={enquiry.classApplied} />
            <InfoRow icon={ArrowRightLeft} label="Source" value={enquiry.source} />
            <InfoRow icon={Calendar} label="Date" value={formatDate(enquiry.date)} />
            <InfoRow icon={User} label="Address" value={enquiry.address} />
          </div>

          {enquiry.description && (
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{enquiry.description}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-emerald-600" /> Follow-up History
            </h4>
            {enquiry.followUps?.length ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {enquiry.followUps.map((f: any) => (
                  <div key={f.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{formatDateTime(f.date)}</span>
                      <Badge variant={f.status === "Done" ? "default" : "secondary"} className={f.status === "Done" ? "bg-emerald-500" : ""}>{f.status}</Badge>
                    </div>
                    {f.response && <p className="text-sm">{f.response}</p>}
                    {f.nextAction && <p className="text-xs text-muted-foreground mt-1">Next: {f.nextAction} — {formatDate(f.followUpDate)}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No follow-ups yet" description="Record the first follow-up for this enquiry." />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ============================================================
 * VISITOR TAB
 * ============================================================ */
function VisitorTab({ visitors }: { visitors: any[] }) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return visitors;
    const q = search.toLowerCase();
    return visitors.filter((v) =>
      v.visitorName?.toLowerCase().includes(q) ||
      v.phone?.toLowerCase().includes(q) ||
      v.whomToMeet?.toLowerCase().includes(q) ||
      v.purpose?.toLowerCase().includes(q)
    );
  }, [visitors, search]);

  const checkoutMutation = useMutation({
    mutationFn: (id: string) => api("/api/front-office", {
      method: "POST",
      body: JSON.stringify({ type: "visitor-checkout", id }),
    }),
    onSuccess: () => toast.success("Visitor checked out"),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, purpose..." className="pl-9" />
          </div>
          <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
            <Plus className="h-4 w-4" /> Add Visitor
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No visitors recorded"
            description="Add a visitor entry when someone checks in"
            icon={<Users className="h-7 w-7" />}
            action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Visitor</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Whom to Meet</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs font-medium shrink-0">
                          {v.visitorName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{v.visitorName}</p>
                          {v.noOfPerson > 1 && <p className="text-xs text-muted-foreground">{v.noOfPerson} persons</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{v.phone || "—"}</TableCell>
                    <TableCell className="text-sm max-w-[160px] truncate" title={v.purpose}>{v.purpose || "—"}</TableCell>
                    <TableCell className="text-sm">{v.whomToMeet || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(v.checkIn)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {v.checkOut ? (
                        <span className="text-sm text-muted-foreground">{formatDateTime(v.checkOut)}</span>
                      ) : (
                        <Badge className="bg-amber-500 hover:bg-amber-500 gap-1"><Clock className="h-3 w-3" /> In</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!v.checkOut && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                          onClick={() => checkoutMutation.mutate(v.id)}
                          disabled={checkoutMutation.isPending}
                        >
                          <LogOut className="h-3.5 w-3.5" /> Check Out
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

      <VisitorFormDialog open={addOpen} onOpenChange={setAddOpen} />
    </Card>
  );
}

function VisitorFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    visitorName: "", phone: "", email: "", purpose: "", whomToMeet: "", noOfPerson: 1, note: "",
  });

  useEffect(() => {
    if (open) setForm({ visitorName: "", phone: "", email: "", purpose: "", whomToMeet: "", noOfPerson: 1, note: "" });
  }, [open]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.visitorName) { toast.error("Visitor name is required"); return; }
    setSaving(true);
    try {
      await api("/api/front-office", {
        method: "POST",
        body: JSON.stringify({ type: "visitor", ...form, noOfPerson: Number(form.noOfPerson) || 1 }),
      });
      toast.success("Visitor added");
      queryClient.invalidateQueries({ queryKey: ["front-office", "visitor"] });
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-emerald-600" /> New Visitor Check-in</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <Label>Visitor Name <span className="text-destructive">*</span></Label>
              <Input value={form.visitorName} onChange={(e) => update("visitorName", e.target.value)} />
            </div>
            <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234..." /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
            <div className="space-y-1"><Label>Purpose</Label><Input value={form.purpose} onChange={(e) => update("purpose", e.target.value)} placeholder="e.g. PTA meeting" /></div>
            <div className="space-y-1"><Label>Whom to Meet</Label><Input value={form.whomToMeet} onChange={(e) => update("whomToMeet", e.target.value)} placeholder="Staff or student name" /></div>
            <div className="space-y-1">
              <Label>No. of Persons</Label>
              <Input type="number" min={1} value={form.noOfPerson} onChange={(e) => update("noOfPerson", e.target.value)} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Note</Label>
              <Textarea rows={2} value={form.note} onChange={(e) => update("note", e.target.value)} placeholder="Optional note..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Check In Visitor"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 * PHONE CALL LOG TAB
 * ============================================================ */
function CallLogTab({ calls }: { calls: any[] }) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = useMemo(() => {
    let r = calls;
    if (typeFilter) r = r.filter((c) => c.callType === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((c) => c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q));
    }
    return r;
  }, [calls, search, typeFilter]);

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone..." className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Incoming">Incoming</SelectItem>
              <SelectItem value="Outgoing">Outgoing</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
            <Plus className="h-4 w-4" /> Log Call
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No calls logged"
            description="Log incoming and outgoing phone calls"
            icon={<Phone className="h-7 w-7" />}
            action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Log Call</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/50">
                    <TableCell>
                      {c.callType === "Incoming" ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-500 gap-1"><PhoneIncoming className="h-3 w-3" /> Incoming</Badge>
                      ) : (
                        <Badge className="bg-amber-500 hover:bg-amber-500 gap-1"><PhoneOutgoing className="h-3 w-3" /> Outgoing</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm">{c.phone}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(c.date)}</TableCell>
                    <TableCell className="text-sm">{c.duration || "—"}</TableCell>
                    <TableCell className="text-sm max-w-[240px] truncate text-muted-foreground" title={c.note}>{c.note || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CallFormDialog open={addOpen} onOpenChange={setAddOpen} />
    </Card>
  );
}

function CallFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    callType: "Incoming", name: "", phone: "", duration: "", note: "",
  });

  useEffect(() => {
    if (open) setForm({ callType: "Incoming", name: "", phone: "", duration: "", note: "" });
  }, [open]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.name || !form.phone) { toast.error("Name and phone are required"); return; }
    setSaving(true);
    try {
      await api("/api/front-office", {
        method: "POST",
        body: JSON.stringify({ type: "call", ...form }),
      });
      toast.success("Call logged");
      queryClient.invalidateQueries({ queryKey: ["front-office", "call"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-emerald-600" /> Log Phone Call</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Call Type</Label>
            <Select value={form.callType} onValueChange={(v) => update("callType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Incoming">Incoming</SelectItem>
                <SelectItem value="Outgoing">Outgoing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Name <span className="text-destructive">*</span></Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
            <div className="space-y-1"><Label>Phone <span className="text-destructive">*</span></Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234..." /></div>
            <div className="space-y-1"><Label>Duration</Label><Input value={form.duration} onChange={(e) => update("duration", e.target.value)} placeholder="e.g. 5 min" /></div>
          </div>
          <div className="space-y-1">
            <Label>Note</Label>
            <Textarea rows={3} value={form.note} onChange={(e) => update("note", e.target.value)} placeholder="Call summary..." />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Save Call"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 * POSTAL TAB (Dispatch / Receive)
 * ============================================================ */
function PostalTab() {
  const [subTab, setSubTab] = useState("dispatch");
  const { data: dispatch = [] } = useQuery<any[]>({
    queryKey: ["front-office", "postal-dispatch"],
    queryFn: () => api("/api/front-office?type=postal-dispatch"),
  });
  const { data: receive = [] } = useQuery<any[]>({
    queryKey: ["front-office", "postal-receive"],
    queryFn: () => api("/api/front-office?type=postal-receive"),
  });

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <Tabs value={subTab} onValueChange={setSubTab}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <TabsList>
              <TabsTrigger value="dispatch" className="gap-1.5"><Send className="h-4 w-4" /> Dispatch</TabsTrigger>
              <TabsTrigger value="receive" className="gap-1.5"><Inbox className="h-4 w-4" /> Receive</TabsTrigger>
            </TabsList>
            {subTab === "dispatch" ? (
              <PostalFormDialog type="dispatch" trigger={
                <Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Dispatch</Button>
              } />
            ) : (
              <PostalFormDialog type="receive" trigger={
                <Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Receive</Button>
              } />
            )}
          </div>

          <TabsContent value="dispatch" className="mt-0">
            <PostalTable items={dispatch} type="dispatch" emptyTitle="No dispatch records" />
          </TabsContent>
          <TabsContent value="receive" className="mt-0">
            <PostalTable items={receive} type="receive" emptyTitle="No receive records" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function PostalTable({ items, type, emptyTitle }: { items: any[]; type: string; emptyTitle: string }) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/front-office?id=${id}&type=postal-${type}`, { method: "DELETE" }),
    onSuccess: () => toast.success("Record deleted"),
    onError: (e: any) => toast.error(e.message),
  });

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description="Add postal records to keep track of mail" icon={type === "dispatch" ? <Send className="h-7 w-7" /> : <Inbox className="h-7 w-7" />} />;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ref No</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((p) => (
            <TableRow key={p.id} className="hover:bg-muted/50">
              <TableCell className="font-mono text-xs">{p.refNo || "—"}</TableCell>
              <TableCell className="text-sm font-medium">{p.fromTitle}</TableCell>
              <TableCell className="text-sm">{p.toTitle}</TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(p.date)}</TableCell>
              <TableCell className="text-sm max-w-[240px] truncate text-muted-foreground" title={p.note}>{p.note || "—"}</TableCell>
              <TableCell className="text-right">
                <ConfirmDialog
                  trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                  title="Delete Record?"
                  description="This will permanently delete the postal record."
                  confirmText="Delete"
                  onConfirm={() => deleteMutation.mutate(p.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PostalFormDialog({ type, trigger }: { type: "dispatch" | "receive"; trigger: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    refNo: "", fromTitle: "", toTitle: "", note: "",
  });

  useEffect(() => {
    if (open) setForm({ refNo: "", fromTitle: "", toTitle: "", note: "" });
  }, [open]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.fromTitle || !form.toTitle) { toast.error("From and To are required"); return; }
    setSaving(true);
    try {
      await api("/api/front-office", {
        method: "POST",
        body: JSON.stringify({ type: `postal-${type}`, ...form }),
      });
      toast.success(type === "dispatch" ? "Dispatch added" : "Receive added");
      queryClient.invalidateQueries({ queryKey: ["front-office", `postal-${type}`] });
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const isDispatch = type === "dispatch";
  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isDispatch ? <Send className="h-5 w-5 text-emerald-600" /> : <Inbox className="h-5 w-5 text-emerald-600" />}
              {isDispatch ? "New Postal Dispatch" : "New Postal Receive"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Reference No</Label>
              <Input value={form.refNo} onChange={(e) => update("refNo", e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <Label>From <span className="text-destructive">*</span></Label>
              <Input value={form.fromTitle} onChange={(e) => update("fromTitle", e.target.value)} placeholder={isDispatch ? "Sender name/address" : "Sender name/address"} />
            </div>
            <div className="space-y-1">
              <Label>To <span className="text-destructive">*</span></Label>
              <Input value={form.toTitle} onChange={(e) => update("toTitle", e.target.value)} placeholder={isDispatch ? "Recipient name/address" : "Recipient name/address"} />
            </div>
            <div className="space-y-1">
              <Label>Note</Label>
              <Textarea rows={3} value={form.note} onChange={(e) => update("note", e.target.value)} placeholder="Optional details..." />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? "Saving..." : isDispatch ? "Add Dispatch" : "Add Receive"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ============================================================
 * COMPLAINTS TAB
 * ============================================================ */
function ComplaintsTab({ complains }: { complains: any[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [resolveComplain, setResolveComplain] = useState<any>(null);

  const filtered = useMemo(() => {
    let r = complains;
    if (statusFilter) r = r.filter((c) => c.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((c) => c.name?.toLowerCase().includes(q) || c.complainNo?.toLowerCase().includes(q) || c.complain?.toLowerCase().includes(q));
    }
    return r;
  }, [complains, search, statusFilter]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/front-office?id=${id}&type=complain`, { method: "DELETE" }),
    onSuccess: () => toast.success("Complaint deleted"),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, no, or content..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
            <Plus className="h-4 w-4" /> Add Complaint
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No complaints"
            description="Log complaints from students, parents, or staff"
            icon={<AlertTriangle className="h-7 w-7" />}
            action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Complaint</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Complain No</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{c.complainNo}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{c.source || "—"}</Badge></TableCell>
                    <TableCell className="text-sm font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm">{c.complainType || "—"}</TableCell>
                    <TableCell><ComplainStatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(c.date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.status !== "Resolved" && c.status !== "Closed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                            onClick={() => setResolveComplain(c)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                          </Button>
                        )}
                        <ConfirmDialog
                          trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                          title="Delete Complaint?"
                          description={`This will permanently delete complaint ${c.complainNo}.`}
                          confirmText="Delete"
                          onConfirm={() => deleteMutation.mutate(c.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <ComplainFormDialog open={addOpen} onOpenChange={setAddOpen} />
      <ResolveDialog complain={resolveComplain} onClose={() => setResolveComplain(null)} />
    </Card>
  );
}

function ComplainStatusBadge({ status }: { status: string }) {
  if (status === "Pending") return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
  if (status === "In Progress") return <Badge className="bg-sky-500 hover:bg-sky-500">In Progress</Badge>;
  if (status === "Resolved") return <Badge className="bg-emerald-500 hover:bg-emerald-500 gap-1"><CheckCircle2 className="h-3 w-3" /> Resolved</Badge>;
  if (status === "Closed") return <Badge variant="secondary">Closed</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

function ComplainFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    source: "Student", name: "", phone: "", complainType: "Academic", complain: "",
  });

  useEffect(() => {
    if (open) setForm({ source: "Student", name: "", phone: "", complainType: "Academic", complain: "" });
  }, [open]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.name || !form.complain) { toast.error("Name and complaint description are required"); return; }
    setSaving(true);
    try {
      await api("/api/front-office", {
        method: "POST",
        body: JSON.stringify({ type: "complain", ...form }),
      });
      toast.success("Complaint logged");
      queryClient.invalidateQueries({ queryKey: ["front-office", "complain"] });
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> New Complaint</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => update("source", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPLAIN_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Complaint Type</Label>
              <Select value={form.complainType} onValueChange={(v) => update("complainType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPLAIN_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Name <span className="text-destructive">*</span></Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234..." /></div>
          </div>
          <div className="space-y-1">
            <Label>Complaint <span className="text-destructive">*</span></Label>
            <Textarea rows={4} value={form.complain} onChange={(e) => update("complain", e.target.value)} placeholder="Describe the complaint in detail..." />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Log Complaint"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResolveDialog({ complain, onClose }: { complain: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("Resolved");
  const [resolution, setResolution] = useState("");

  useEffect(() => {
    if (complain) {
      setStatus("Resolved");
      setResolution(complain.resolution || "");
    }
  }, [complain]);

  async function handleSave() {
    if (!resolution) { toast.error("Resolution note is required"); return; }
    setSaving(true);
    try {
      await api("/api/front-office", {
        method: "POST",
        body: JSON.stringify({
          type: "complain-update",
          id: complain.id,
          status,
          resolution,
        }),
      });
      toast.success("Complaint updated");
      queryClient.invalidateQueries({ queryKey: ["front-office", "complain"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!complain} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Resolve Complaint</DialogTitle>
        </DialogHeader>
        {complain && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">{complain.name}</p>
                <span className="text-xs text-muted-foreground">{complain.complainNo}</span>
              </div>
              <p className="text-sm text-muted-foreground">{complain.complain}</p>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Resolution <span className="text-destructive">*</span></Label>
              <Textarea rows={4} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Describe the resolution taken..." />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? "Saving..." : "Update Complaint"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 * SHARED HELPERS
 * ============================================================ */
function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || "—"}</p>
      </div>
    </div>
  );
}
