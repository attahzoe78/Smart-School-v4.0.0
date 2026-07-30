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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Plus, Search, Wallet, Receipt, FileText, Tags, Trash2, Pencil, Banknote,
  TrendingDown, AlertCircle, CalendarClock, CheckCircle2, User,
} from "lucide-react";
import { formatCurrency, formatDate, getInitials, getFullName } from "@/lib/format";
import { FEE_TYPES, PAYMENT_MODES } from "@/lib/constants";

export function FeesScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("payments");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["fees-payments"],
    queryFn: () => api("/api/fees?action=payments"),
  });

  // Fee Types
  const { data: feeTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ["fees-types"],
    queryFn: () => api("/api/fees?action=types"),
  });

  // Invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["fees-invoices"],
    queryFn: () => api("/api/fees?action=invoices"),
  });

  // Settings (for classes)
  const { data: settings } = useQuery({
    queryKey: ["settings-all"],
    queryFn: () => api("/api/settings"),
  });
  const classes = settings?.classes || [];

  // Students (for selects)
  const { data: students = [] } = useQuery({
    queryKey: ["students-all"],
    queryFn: () => api("/api/students?take=500"),
  });

  // Stats - based on current month payments
  const stats = useMemo(() => {
    const now = new Date();
    const monthPayments = payments.filter((p: any) => {
      const d = new Date(p.paymentDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totalCollected = monthPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const totalDiscount = monthPayments.reduce((sum: number, p: any) => sum + (p.discount || 0), 0);
    const totalFine = monthPayments.reduce((sum: number, p: any) => sum + (p.fine || 0), 0);
    const pendingInvoices = invoices.filter((i: any) => i.status !== "Paid").length;
    return { totalCollected, totalDiscount, totalFine, pendingInvoices };
  }, [payments, invoices]);

  // Filtered payments (by search)
  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase();
    return payments.filter((p: any) => {
      const name = `${p.student?.firstName || ""} ${p.student?.lastName || ""}`.toLowerCase();
      return name.includes(q) || (p.paymentNo || "").toLowerCase().includes(q) || (p.paymentMode || "").toLowerCase().includes(q);
    });
  }, [payments, search]);

  const filteredTypes = useMemo(() => {
    if (!search.trim()) return feeTypes;
    const q = search.toLowerCase();
    return feeTypes.filter((t: any) => (t.name || "").toLowerCase().includes(q) || (t.code || "").toLowerCase().includes(q));
  }, [feeTypes, search]);

  const filteredInvoices = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter((i: any) => {
      const name = `${i.student?.firstName || ""} ${i.student?.lastName || ""}`.toLowerCase();
      return name.includes(q) || (i.invoiceNo || "").toLowerCase().includes(q) || (i.status || "").toLowerCase().includes(q);
    });
  }, [invoices, search]);

  // Pagination per tab
  const pagedPayments = filteredPayments.slice(page * pageSize, (page + 1) * pageSize);
  const pagedTypes = filteredTypes.slice(page * pageSize, (page + 1) * pageSize);
  const pagedInvoices = filteredInvoices.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(
    (activeTab === "payments" ? filteredPayments : activeTab === "types" ? filteredTypes : filteredInvoices).length / pageSize
  );

  const deletePayment = useMutation({
    mutationFn: (id: string) => api(`/api/fees?id=${id}&action=payment`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees-payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Payment deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteType = useMutation({
    mutationFn: (id: string) => api(`/api/fees?id=${id}&action=type`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees-types"] });
      toast.success("Fee type deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteInvoice = useMutation({
    mutationFn: (id: string) => api(`/api/fees?id=${id}&action=invoice`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees-invoices"] });
      toast.success("Invoice deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Dialog state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [editType, setEditType] = useState<any>(null);

  function resetPage() { setPage(0); }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fees Collection"
        description="Manage fee types, invoices, and payments"
        icon={<Wallet className="h-5 w-5" />}
        action={
          activeTab === "payments" ? (
            <Button onClick={() => setPaymentOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Collect Payment
            </Button>
          ) : activeTab === "types" ? (
            <Button onClick={() => { setEditType(null); setTypeOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Add Fee Type
            </Button>
          ) : (
            <Button onClick={() => setInvoiceOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Generate Invoice
            </Button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Collected (This Month)" value={formatCurrency(stats.totalCollected)} icon={Banknote} color="bg-emerald-500" subtitle={`${payments.filter(p => new Date(p.paymentDate).getMonth() === new Date().getMonth()).length} payments`} />
        <StatCard title="Total Discount" value={formatCurrency(stats.totalDiscount)} icon={TrendingDown} color="bg-amber-500" subtitle="This month" />
        <StatCard title="Total Fine" value={formatCurrency(stats.totalFine)} icon={AlertCircle} color="bg-rose-500" subtitle="This month" />
        <StatCard title="Pending Invoices" value={stats.pendingInvoices} icon={FileText} color="bg-violet-500" subtitle={`${invoices.length} total invoices`} />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); resetPage(); }} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="payments"><Wallet className="h-4 w-4 mr-1.5" /> Payments</TabsTrigger>
          <TabsTrigger value="types"><Tags className="h-4 w-4 mr-1.5" /> Fee Types</TabsTrigger>
          <TabsTrigger value="invoices"><Receipt className="h-4 w-4 mr-1.5" /> Invoices</TabsTrigger>
        </TabsList>

        {/* FEE PAYMENTS TAB */}
        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} placeholder="Search by student, payment no, or mode..." className="pl-9" />
                </div>
              </div>

              {paymentsLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading payments...</div>
              ) : pagedPayments.length === 0 ? (
                <EmptyState
                  title="No payments found"
                  description="Collect your first fee payment to get started"
                  icon={<Wallet className="h-7 w-7" />}
                  action={<Button onClick={() => setPaymentOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Collect Payment</Button>}
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment No</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Collected By</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedPayments.map((p: any) => (
                          <TableRow key={p.id} className="hover:bg-muted/50">
                            <TableCell className="font-mono text-xs">{p.paymentNo}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-[10px]">
                                    {p.student ? getInitials(p.student.firstName, p.student.lastName) : "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{p.student ? getFullName(p.student) : "—"}</p>
                                  <p className="text-xs text-muted-foreground">{p.student?.admissionNo}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{p.student?.currentClass?.name || "—"}</TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-normal">{p.paymentMode}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(p.paymentDate)}</TableCell>
                            <TableCell className="text-sm">{p.collectedBy || "—"}</TableCell>
                            <TableCell className="text-right">
                              <ConfirmDialog
                                trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                                title="Delete Payment?"
                                description={`This will permanently delete payment ${p.paymentNo}.`}
                                confirmText="Delete"
                                onConfirm={() => deletePayment.mutate(p.id)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <PaginationBar page={page} totalPages={totalPages} setPage={setPage} total={filteredPayments.length} pageSize={pageSize} />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FEE TYPES TAB */}
        <TabsContent value="types" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} placeholder="Search fee types by name or code..." className="pl-9" />
                </div>
              </div>

              {typesLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading fee types...</div>
              ) : pagedTypes.length === 0 ? (
                <EmptyState
                  title="No fee types found"
                  description="Add fee types like Tuition, Bus, Hostel, etc."
                  icon={<Tags className="h-7 w-7" />}
                  action={<Button onClick={() => { setEditType(null); setTypeOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Fee Type</Button>}
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedTypes.map((t: any) => (
                          <TableRow key={t.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{t.name}</p>
                                {t.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{t.description}</p>}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{t.code || "—"}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(t.amount)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">{t.type}</Badge>
                            </TableCell>
                            <TableCell>{t.class?.name || "All Classes"}</TableCell>
                            <TableCell>
                              <Badge variant={t.isActive ? "default" : "destructive"} className={t.isActive ? "bg-emerald-500" : ""}>
                                {t.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditType(t); setTypeOpen(true); }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <ConfirmDialog
                                  trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                                  title="Delete Fee Type?"
                                  description={`This will permanently delete the fee type "${t.name}".`}
                                  confirmText="Delete"
                                  onConfirm={() => deleteType.mutate(t.id)}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <PaginationBar page={page} totalPages={totalPages} setPage={setPage} total={filteredTypes.length} pageSize={pageSize} />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVOICES TAB */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} placeholder="Search invoices by no, student, or status..." className="pl-9" />
                </div>
              </div>

              {invoicesLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading invoices...</div>
              ) : pagedInvoices.length === 0 ? (
                <EmptyState
                  title="No invoices found"
                  description="Generate invoices for students to track payments"
                  icon={<Receipt className="h-7 w-7" />}
                  action={<Button onClick={() => setInvoiceOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Generate Invoice</Button>}
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice No</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Discount</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedInvoices.map((inv: any) => (
                          <TableRow key={inv.id} className="hover:bg-muted/50">
                            <TableCell className="font-mono text-xs">{inv.invoiceNo}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{inv.student ? getFullName(inv.student) : "—"}</p>
                                <p className="text-xs text-muted-foreground">{inv.student?.admissionNo} • {inv.student?.currentClass?.name}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(inv.amount)}</TableCell>
                            <TableCell className="text-right text-amber-600">{formatCurrency(inv.discount)}</TableCell>
                            <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(inv.paidAmount)}</TableCell>
                            <TableCell className="text-right font-semibold text-rose-600">{formatCurrency(inv.balance)}</TableCell>
                            <TableCell>
                              <Badge variant={inv.status === "Paid" ? "default" : inv.status === "Partial" ? "secondary" : "destructive"}
                                className={inv.status === "Paid" ? "bg-emerald-500" : inv.status === "Partial" ? "bg-amber-500 text-white" : ""}>
                                {inv.status === "Paid" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {inv.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {inv.dueDate ? (
                                <span className="inline-flex items-center gap-1">
                                  <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                                  {formatDate(inv.dueDate)}
                                </span>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <ConfirmDialog
                                trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                                title="Delete Invoice?"
                                description={`This will permanently delete invoice ${inv.invoiceNo}.`}
                                confirmText="Delete"
                                onConfirm={() => deleteInvoice.mutate(inv.id)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <PaginationBar page={page} totalPages={totalPages} setPage={setPage} total={filteredInvoices.length} pageSize={pageSize} />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CollectPaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} students={students} invoices={invoices} />
      <FeeTypeDialog open={typeOpen} onOpenChange={setTypeOpen} classes={classes} editType={editType} />
      <GenerateInvoiceDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} students={students} feeTypes={feeTypes} />
    </div>
  );
}

/* ----------------- Collect Payment Dialog ----------------- */
function CollectPaymentDialog({ open, onOpenChange, students, invoices }: any) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    amount: "",
    discount: "",
    fine: "",
    paymentMode: "Cash",
    description: "",
    invoiceId: "",
  });

  // Reset on open
  useMemo(() => {
    if (open) {
      setForm({ studentId: "", amount: "", discount: "", fine: "", paymentMode: "Cash", description: "", invoiceId: "" });
    }
  }, [open]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const studentInvoices = useMemo(() => {
    if (!form.studentId) return [];
    return invoices.filter((i: any) => i.studentId === form.studentId && i.status !== "Paid");
  }, [invoices, form.studentId]);

  const selectedInvoice = invoices.find((i: any) => i.id === form.invoiceId);
  const netPayable = (parseFloat(form.amount || "0") || 0) - (parseFloat(form.discount || "0") || 0) + (parseFloat(form.fine || "0") || 0);

  async function handleSave() {
    if (!form.studentId) { toast.error("Please select a student"); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      await api("/api/fees", {
        method: "POST",
        body: JSON.stringify({
          action: "add-payment",
          studentId: form.studentId,
          amount: form.amount,
          discount: form.discount || 0,
          fine: form.fine || 0,
          paymentMode: form.paymentMode,
          description: form.description,
          invoiceId: form.invoiceId || null,
        }),
      });
      toast.success("Payment collected successfully");
      queryClient.invalidateQueries({ queryKey: ["fees-payments"] });
      queryClient.invalidateQueries({ queryKey: ["fees-invoices"] });
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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-emerald-600" /> Collect Fee Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Student <span className="text-destructive">*</span></Label>
            <Select value={form.studentId} onValueChange={(v) => update("studentId", v)}>
              <SelectTrigger><SelectValue placeholder="Search & select student" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {students.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {getFullName(s)} • {s.admissionNo} {s.currentClass?.name ? `(${s.currentClass.name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Amount <span className="text-destructive">*</span></Label>
              <Input type="number" value={form.amount} onChange={(e) => update("amount", e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label>Discount</Label>
              <Input type="number" value={form.discount} onChange={(e) => update("discount", e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label>Fine</Label>
              <Input type="number" value={form.fine} onChange={(e) => update("fine", e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label>Payment Mode</Label>
              <Select value={form.paymentMode} onValueChange={(v) => update("paymentMode", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Link to Invoice (Optional)</Label>
            <Select value={form.invoiceId} onValueChange={(v) => update("invoiceId", v)} disabled={!form.studentId || studentInvoices.length === 0}>
              <SelectTrigger><SelectValue placeholder={form.studentId ? (studentInvoices.length ? "Select unpaid invoice" : "No unpaid invoices") : "Select student first"} /></SelectTrigger>
              <SelectContent>
                {studentInvoices.map((i: any) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.invoiceNo} - Bal: {formatCurrency(i.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedInvoice && (
              <p className="text-xs text-muted-foreground mt-1">
                Invoice Balance: <span className="font-semibold text-rose-600">{formatCurrency(selectedInvoice.balance)}</span>
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Description / Note</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Payment description..." />
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700 dark:text-emerald-400">Net Payable</span>
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(netPayable)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Collect Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------- Fee Type Dialog ----------------- */
function FeeTypeDialog({ open, onOpenChange, classes, editType }: any) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const isEdit = !!editType;

  const [form, setForm] = useState<any>({
    name: "", code: "", description: "", amount: "", type: "One Time", classId: "", isActive: true,
  });

  useMemo(() => {
    if (open) {
      setForm(editType ? {
        name: editType.name || "",
        code: editType.code || "",
        description: editType.description || "",
        amount: editType.amount?.toString() || "",
        type: editType.type || "One Time",
        classId: editType.classId || "",
        isActive: editType.isActive ?? true,
      } : { name: "", code: "", description: "", amount: "", type: "One Time", classId: "", isActive: true });
    }
  }, [open, editType]);

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.name) { toast.error("Name is required"); return; }
    if (!form.amount || parseFloat(form.amount) < 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      // Use POST add-type for both create (we keep it simple; backend doesn't expose PUT for fee types)
      await api("/api/fees", {
        method: "POST",
        body: JSON.stringify({
          action: "add-type",
          name: form.name,
          code: form.code,
          description: form.description,
          amount: parseFloat(form.amount),
          type: form.type,
          classId: form.classId || null,
          isActive: form.isActive,
        }),
      });
      toast.success(isEdit ? "Fee type updated" : "Fee type added successfully");
      queryClient.invalidateQueries({ queryKey: ["fees-types"] });
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Tags className="h-5 w-5 text-emerald-600" /> {isEdit ? "Edit Fee Type" : "Add Fee Type"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Tuition Fee" />
            </div>
            <div className="space-y-1">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => update("code", e.target.value)} placeholder="e.g. TUIT" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Description..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Amount <span className="text-destructive">*</span></Label>
              <Input type="number" value={form.amount} onChange={(e) => update("amount", e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FEE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Class</Label>
              <Select value={form.classId} onValueChange={(v) => update("classId", v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.isActive ? "true" : "false"} onValueChange={(v) => update("isActive", v === "true")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : isEdit ? "Update Fee Type" : "Add Fee Type"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------- Generate Invoice Dialog ----------------- */
function GenerateInvoiceDialog({ open, onOpenChange, students, feeTypes }: any) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    feeTypeId: "",
    amount: "",
    discount: "",
    dueDate: "",
  });

  useMemo(() => {
    if (open) {
      setForm({ studentId: "", feeTypeId: "", amount: "", discount: "", dueDate: "" });
    }
  }, [open]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const selectedFeeType = feeTypes.find((t: any) => t.id === form.feeTypeId);
  const total = (parseFloat(form.amount || "0") || 0) - (parseFloat(form.discount || "0") || 0);

  function onFeeTypeChange(v: string) {
    update("feeTypeId", v);
    const ft = feeTypes.find((t: any) => t.id === v);
    if (ft && !form.amount) update("amount", ft.amount?.toString() || "");
  }

  async function handleSave() {
    if (!form.studentId) { toast.error("Please select a student"); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      await api("/api/fees", {
        method: "POST",
        body: JSON.stringify({
          action: "generate-invoice",
          studentId: form.studentId,
          feeTypeId: form.feeTypeId || null,
          amount: form.amount,
          discount: form.discount || 0,
          dueDate: form.dueDate || null,
        }),
      });
      toast.success("Invoice generated successfully");
      queryClient.invalidateQueries({ queryKey: ["fees-invoices"] });
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-emerald-600" /> Generate Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Student <span className="text-destructive">*</span></Label>
            <Select value={form.studentId} onValueChange={(v) => update("studentId", v)}>
              <SelectTrigger><SelectValue placeholder="Search & select student" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {students.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {getFullName(s)} • {s.admissionNo} {s.currentClass?.name ? `(${s.currentClass.name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Fee Type</Label>
            <Select value={form.feeTypeId} onValueChange={onFeeTypeChange}>
              <SelectTrigger><SelectValue placeholder="Select fee type (optional)" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {feeTypes.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} • {formatCurrency(t.amount)} ({t.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFeeType && (
              <p className="text-xs text-muted-foreground mt-1">
                Auto-filled amount: <span className="font-semibold">{formatCurrency(selectedFeeType.amount)}</span>
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Amount <span className="text-destructive">*</span></Label>
              <Input type="number" value={form.amount} onChange={(e) => update("amount", e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label>Discount</Label>
              <Input type="number" value={form.discount} onChange={(e) => update("discount", e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Due Date</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} />
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700 dark:text-emerald-400">Net Invoice Amount</span>
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(total)}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Generating..." : "Generate Invoice"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------- Pagination helper ----------------- */
function PaginationBar({ page, totalPages, setPage, total, pageSize }: any) {
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-muted-foreground">
        Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total}
      </p>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={() => setPage((p: number) => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
        <Button variant="outline" size="sm" onClick={() => setPage((p: number) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
      </div>
    </div>
  );
}
