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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import {
  Plus, Search, BookOpen, Library, BookMarked, BookCheck, Wallet,
  Pencil, Trash2, Eye, BookX, ArrowLeftRight, Check, ChevronsUpDown, AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDate, getFullName } from "@/lib/format";

const BOOK_CATEGORIES = [
  "Fiction", "Non-Fiction", "Textbook", "Reference", "Biography",
  "Science", "Mathematics", "History", "Literature", "Religion", "Children", "Other",
] as const;

/* ============================================================
 * MAIN SCREEN
 * ============================================================ */
export function LibraryScreen() {
  const { data: books = [], isLoading: booksLoading } = useQuery<any[]>({
    queryKey: ["library", "books"],
    queryFn: () => api("/api/library?action=books"),
  });
  const { data: issues = [], isLoading: issuesLoading } = useQuery<any[]>({
    queryKey: ["library", "issues"],
    queryFn: () => api("/api/library?action=issues"),
  });

  const stats = useMemo(() => {
    const totalBooks = books.reduce((s, b) => s + (b.quantity || 0), 0);
    const booksIssued = issues.filter((i) => i.status !== "Returned").length;
    const availableBooks = books.reduce((s, b) => s + (b.available || 0), 0);
    const totalValue = books.reduce((s, b) => s + (b.price || 0) * (b.quantity || 0), 0);
    const totalFine = issues.reduce((s, i) => s + (i.fine || 0), 0);
    return { totalBooks, booksIssued, availableBooks, totalValue, totalFine };
  }, [books, issues]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description="Manage book inventory, issue & return tracking"
        icon={<Library className="h-5 w-5" />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total Books" value={stats.totalBooks} icon={BookOpen} color="bg-emerald-500" subtitle={`${books.length} titles`} />
        <StatCard title="Books Issued" value={stats.booksIssued} icon={BookMarked} color="bg-teal-500" subtitle="Currently out" />
        <StatCard title="Available" value={stats.availableBooks} icon={BookCheck} color="bg-amber-500" subtitle="Ready to issue" />
        <StatCard title="Total Value" value={formatCurrency(stats.totalValue)} icon={Wallet} color="bg-rose-500" subtitle={`Fine: ${formatCurrency(stats.totalFine)}`} />
      </div>

      <Tabs defaultValue="books" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1">
          <TabsTrigger value="books" className="gap-1.5"><BookOpen className="h-4 w-4" /> Books</TabsTrigger>
          <TabsTrigger value="issues" className="gap-1.5"><ArrowLeftRight className="h-4 w-4" /> Issued Books</TabsTrigger>
        </TabsList>
        <TabsContent value="books" className="mt-4">
          <BooksTab books={books} isLoading={booksLoading} />
        </TabsContent>
        <TabsContent value="issues" className="mt-4">
          <IssuedBooksTab issues={issues} books={books} isLoading={issuesLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================================
 * BOOKS TAB
 * ============================================================ */
function BooksTab({ books, isLoading }: { books: any[]; isLoading: boolean }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editBook, setEditBook] = useState<any>(null);
  const [viewBook, setViewBook] = useState<any>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => { if (b.category) set.add(b.category); });
    return Array.from(set).sort();
  }, [books]);

  const filtered = useMemo(() => {
    let r = books;
    if (categoryFilter) r = r.filter((b) => b.category === categoryFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((b) =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.bookNo?.toLowerCase().includes(q) ||
        b.isbn?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [books, search, categoryFilter]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/library?id=${id}&action=book`, { method: "DELETE" }),
    onSuccess: () => toast.success("Book deleted"),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, author, book no, ISBN..." className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditBook(null); setAddOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
            <Plus className="h-4 w-4" /> Add Book
          </Button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading books...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No books found"
            description="Add your first book to the library catalog"
            icon={<BookOpen className="h-7 w-7" />}
            action={<Button onClick={() => { setEditBook(null); setAddOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Book</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book No</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Rack</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{b.bookNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 shrink-0">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[200px]" title={b.title}>{b.title}</p>
                          {b.publisher && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{b.publisher}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{b.author || "—"}</TableCell>
                    <TableCell>
                      {b.category ? <Badge variant="secondary" className="text-xs">{b.category}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{b.quantity}</TableCell>
                    <TableCell>
                      <AvailabilityBadge available={b.available} quantity={b.quantity} />
                    </TableCell>
                    <TableCell className="text-sm font-medium whitespace-nowrap">{formatCurrency(b.price)}</TableCell>
                    <TableCell className="text-sm">{b.rack || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewBook(b)} title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditBook(b); setAddOpen(true); }} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDialog
                          trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                          title="Delete Book?"
                          description={`This will permanently delete "${b.title}" from the catalog.`}
                          confirmText="Delete"
                          onConfirm={() => deleteMutation.mutate(b.id)}
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

      <BookFormDialog open={addOpen} onOpenChange={setAddOpen} book={editBook} />
      <BookDetailSheet book={viewBook} onClose={() => setViewBook(null)} />
    </Card>
  );
}

function AvailabilityBadge({ available, quantity }: { available: number; quantity: number }) {
  if (available <= 0) return <Badge variant="destructive" className="gap-1"><BookX className="h-3 w-3" /> Out</Badge>;
  if (available < quantity) return <Badge className="bg-amber-500 hover:bg-amber-500 gap-1">{available}/{quantity}</Badge>;
  return <Badge className="bg-emerald-500 hover:bg-emerald-500 gap-1"><BookCheck className="h-3 w-3" /> {available}/{quantity}</Badge>;
}

function BookFormDialog({ open, onOpenChange, book }: { open: boolean; onOpenChange: (o: boolean) => void; book: any }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const isEdit = !!book;
  const [form, setForm] = useState<any>({
    title: "", author: "", publisher: "", category: "", isbn: "",
    price: "", quantity: "1", rack: "", description: "",
  });

  useEffect(() => {
    if (open) {
      if (book) {
        setForm({
          title: book.title || "",
          author: book.author || "",
          publisher: book.publisher || "",
          category: book.category || "",
          isbn: book.isbn || "",
          price: book.price?.toString() || "",
          quantity: book.quantity?.toString() || "1",
          rack: book.rack || "",
          description: book.description || "",
        });
      } else {
        setForm({
          title: "", author: "", publisher: "", category: "", isbn: "",
          price: "", quantity: "1", rack: "", description: "",
        });
      }
    }
  }, [open, book]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title) { toast.error("Book title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        author: form.author || null,
        publisher: form.publisher || null,
        category: form.category || null,
        isbn: form.isbn || null,
        price: form.price || 0,
        quantity: Number(form.quantity) || 1,
        rack: form.rack || null,
        description: form.description || null,
      };
      if (isEdit) {
        await api("/api/library", { method: "PUT", body: JSON.stringify({ id: book.id, ...payload }) });
        toast.success("Book updated successfully");
      } else {
        await api("/api/library", { method: "POST", body: JSON.stringify({ action: "add-book", ...payload }) });
        toast.success("Book added to catalog");
      }
      queryClient.invalidateQueries({ queryKey: ["library"] });
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
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            {isEdit ? "Edit Book" : "Add New Book"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Book title" />
            </div>
            <div className="space-y-1"><Label>Author</Label><Input value={form.author} onChange={(e) => update("author", e.target.value)} placeholder="Author name" /></div>
            <div className="space-y-1"><Label>Publisher</Label><Input value={form.publisher} onChange={(e) => update("publisher", e.target.value)} placeholder="Publisher" /></div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => update("category", v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {BOOK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>ISBN</Label><Input value={form.isbn} onChange={(e) => update("isbn", e.target.value)} placeholder="ISBN number" /></div>
            <div className="space-y-1"><Label>Price (₦)</Label><Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0.00" /></div>
            <div className="space-y-1"><Label>Quantity</Label><Input type="number" min={1} value={form.quantity} onChange={(e) => update("quantity", e.target.value)} /></div>
            <div className="space-y-1"><Label>Rack No</Label><Input value={form.rack} onChange={(e) => update("rack", e.target.value)} placeholder="e.g. A-12" /></div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Short description or notes about the book..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : isEdit ? "Update Book" : "Add Book"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BookDetailSheet({ book, onClose }: { book: any; onClose: () => void }) {
  if (!book) return null;
  return (
    <Sheet open={!!book} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-3 border-b">
          <SheetTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-emerald-600" /> Book Details</SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <BookOpen className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-tight">{book.title}</p>
              <p className="text-sm text-muted-foreground">{book.author || "Unknown author"}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{book.bookNo}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Category" value={book.category ? <Badge variant="secondary" className="text-xs">{book.category}</Badge> : "—"} />
            <InfoRow label="Publisher" value={book.publisher} />
            <InfoRow label="ISBN" value={book.isbn} />
            <InfoRow label="Rack No" value={book.rack} />
            <InfoRow label="Price" value={formatCurrency(book.price)} />
            <InfoRow label="Quantity" value={book.quantity} />
          </div>

          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Availability</p>
            <div className="flex items-center justify-between">
              <AvailabilityBadge available={book.available} quantity={book.quantity} />
              <span className="text-sm font-medium">{book.available} of {book.quantity} copies available</span>
            </div>
          </div>

          {book.description && (
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{book.description}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ============================================================
 * ISSUED BOOKS TAB
 * ============================================================ */
function IssuedBooksTab({ issues, books, isLoading }: { issues: any[]; books: any[]; isLoading: boolean }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [issueOpen, setIssueOpen] = useState(false);
  const [returnIssue, setReturnIssue] = useState<any>(null);

  const filtered = useMemo(() => {
    let r = issues;
    if (statusFilter === "overdue") {
      r = r.filter((i) => !i.returnDate && new Date(i.dueDate) < new Date());
    } else if (statusFilter === "issued") {
      r = r.filter((i) => !i.returnDate);
    } else if (statusFilter === "returned") {
      r = r.filter((i) => !!i.returnDate);
    }
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((i) =>
        i.book?.title?.toLowerCase().includes(q) ||
        `${i.student?.firstName} ${i.student?.lastName}`.toLowerCase().includes(q) ||
        i.student?.admissionNo?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [issues, search, statusFilter]);

  const availableBooks = books.filter((b) => b.available > 0);

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by book title or student..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="issued">Issued (Not Returned)</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIssueOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 shrink-0" disabled={availableBooks.length === 0}>
            <Plus className="h-4 w-4" /> Issue Book
          </Button>
        </div>

        {availableBooks.length === 0 && issues.length > 0 && (
          <div className="mb-3 p-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            All books are currently issued. Add more copies to issue again.
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading issued books...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No issued books"
            description="Issue a book to a student to track it here"
            icon={<ArrowLeftRight className="h-7 w-7" />}
            action={availableBooks.length > 0 ? <Button onClick={() => setIssueOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Issue Book</Button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fine</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => {
                  const isOverdue = !i.returnDate && new Date(i.dueDate) < new Date();
                  return (
                    <TableRow key={i.id} className={`hover:bg-muted/50 ${isOverdue ? "bg-red-50 dark:bg-red-950/20" : ""}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 shrink-0">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate max-w-[180px]" title={i.book?.title}>{i.book?.title || "—"}</p>
                            <p className="text-xs text-muted-foreground font-mono">{i.book?.bookNo}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{i.student ? getFullName(i.student) : "—"}</p>
                          <p className="text-xs text-muted-foreground font-mono">{i.student?.admissionNo}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(i.issueDate)}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        <span className={isOverdue ? "text-red-600 font-medium" : ""}>{formatDate(i.dueDate)}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{i.returnDate ? formatDate(i.returnDate) : "—"}</TableCell>
                      <TableCell>
                        {i.returnDate ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-500 gap-1"><BookCheck className="h-3 w-3" /> Returned</Badge>
                        ) : isOverdue ? (
                          <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Overdue</Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1"><BookMarked className="h-3 w-3" /> Issued</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {i.fine > 0 ? <span className="font-medium text-red-600">{formatCurrency(i.fine)}</span> : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {!i.returnDate && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                            onClick={() => setReturnIssue(i)}
                          >
                            <BookCheck className="h-3.5 w-3.5" /> Return
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <IssueBookDialog open={issueOpen} onOpenChange={setIssueOpen} books={availableBooks} />
      <ReturnBookDialog issue={returnIssue} onClose={() => setReturnIssue(null)} />
    </Card>
  );
}

function IssueBookDialog({ open, onOpenChange, books }: { open: boolean; onOpenChange: (o: boolean) => void; books: any[] }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [bookId, setBookId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [studentSearch, setStudentSearch] = useState("");
  const [studentOpen, setStudentOpen] = useState(false);

  const { data: students = [] } = useQuery<any[]>({
    queryKey: ["students", studentSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (studentSearch) params.set("search", studentSearch);
      params.set("take", "50");
      return api(`/api/students?${params.toString()}`);
    },
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setBookId("");
      setStudentId("");
      setStudentSearch("");
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setDueDate(d.toISOString().split("T")[0]);
    }
  }, [open]);

  async function handleSave() {
    if (!bookId || !studentId || !dueDate) { toast.error("Book, student and due date are required"); return; }
    setSaving(true);
    try {
      await api("/api/library", {
        method: "POST",
        body: JSON.stringify({ action: "issue", bookId, studentId, dueDate }),
      });
      toast.success("Book issued successfully");
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedBook = books.find((b) => b.id === bookId);
  const selectedStudent = students.find((s) => s.id === studentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5 text-emerald-600" /> Issue Book</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Book <span className="text-destructive">*</span></Label>
            <Select value={bookId} onValueChange={setBookId}>
              <SelectTrigger><SelectValue placeholder="Select a book" /></SelectTrigger>
              <SelectContent>
                {books.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.title} ({b.available} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBook && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedBook.author || "Unknown author"} • {selectedBook.bookNo} • {selectedBook.available} of {selectedBook.quantity} available
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Student <span className="text-destructive">*</span></Label>
            <Popover open={studentOpen} onOpenChange={setStudentOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  {selectedStudent ? (
                    <span className="truncate">
                      {getFullName(selectedStudent)}
                      <span className="text-muted-foreground ml-2 text-xs">{selectedStudent.admissionNo}</span>
                    </span>
                  ) : (
                    "Search student by name or admission no..."
                  )}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Type to search..." value={studentSearch} onValueChange={setStudentSearch} />
                  <CommandList>
                    <CommandEmpty>No students found.</CommandEmpty>
                    <CommandGroup>
                      {students.map((s) => (
                        <CommandItem
                          key={s.id}
                          value={s.id}
                          onSelect={() => { setStudentId(s.id); setStudentOpen(false); }}
                          className="gap-2"
                        >
                          <Check className={`h-4 w-4 ${studentId === s.id ? "opacity-100" : "opacity-0"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{getFullName(s)}</p>
                            <p className="text-xs text-muted-foreground font-mono">{s.admissionNo} • {s.currentClass?.name || "—"}</p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label>Due Date <span className="text-destructive">*</span></Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Issuing..." : "Issue Book"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReturnBookDialog({ issue, onClose }: { issue: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [fine, setFine] = useState("0");

  useEffect(() => {
    if (issue) {
      // Suggest a fine if overdue
      if (!issue.returnDate && new Date(issue.dueDate) < new Date()) {
        const days = Math.floor((Date.now() - new Date(issue.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        setFine(String(Math.max(days, 1) * 50));
      } else {
        setFine("0");
      }
    }
  }, [issue]);

  async function handleSave() {
    setSaving(true);
    try {
      await api("/api/library", {
        method: "POST",
        body: JSON.stringify({ action: "return", issueId: issue.id, fine: Number(fine) || 0 }),
      });
      toast.success("Book returned successfully");
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const isOverdue = issue && !issue.returnDate && new Date(issue.dueDate) < new Date();
  const daysLate = issue ? Math.max(0, Math.floor((Date.now() - new Date(issue.dueDate).getTime()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <Dialog open={!!issue} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BookCheck className="h-5 w-5 text-emerald-600" /> Return Book</DialogTitle>
        </DialogHeader>
        {issue && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/50 border space-y-1">
              <p className="text-sm font-medium">{issue.book?.title}</p>
              <p className="text-xs text-muted-foreground">{issue.book?.bookNo} • {issue.student ? getFullName(issue.student) : "—"}</p>
              <div className="flex items-center gap-3 pt-1 text-xs">
                <span className="text-muted-foreground">Issued: {formatDate(issue.issueDate)}</span>
                <span className="text-muted-foreground">Due: {formatDate(issue.dueDate)}</span>
              </div>
            </div>

            {isOverdue && (
              <div className="p-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                This book is <strong className="mx-1">{daysLate} days</strong> overdue. A fine has been suggested.
              </div>
            )}

            <div className="space-y-1">
              <Label>Fine Amount (₦)</Label>
              <Input type="number" min={0} step="0.01" value={fine} onChange={(e) => setFine(e.target.value)} />
              <p className="text-xs text-muted-foreground">Set to 0 if no fine applies.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? "Returning..." : "Confirm Return"}
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
function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value || "—"}</div>
    </div>
  );
}
