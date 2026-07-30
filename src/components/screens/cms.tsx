"use client";

import { useState } from "react";
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
  Plus, Search, FileText, Newspaper, CalendarDays, Image as ImageIcon,
  Layers, Menu as MenuIcon, Pencil, Trash2, ExternalLink, Eye, Globe,
} from "lucide-react";
import { formatDate } from "@/lib/format";

type CmsType = "page" | "news" | "event" | "gallery" | "banner" | "menu";

const TABS: { value: CmsType; label: string; icon: typeof FileText }[] = [
  { value: "page", label: "Pages", icon: FileText },
  { value: "news", label: "News", icon: Newspaper },
  { value: "event", label: "Events", icon: CalendarDays },
  { value: "gallery", label: "Gallery", icon: ImageIcon },
  { value: "banner", label: "Banners", icon: Layers },
  { value: "menu", label: "Menus", icon: MenuIcon },
];

const NEWS_CATEGORIES = ["Announcement", "Achievement", "Sports", "Event", "General"];
const GALLERY_CATEGORIES = ["Sports", "Cultural", "Academic", "Excursion", "Events", "General"];
const HOSTEL_TYPES = ["Boys", "Girls", "Co-ed"];

export function CmsScreen() {
  const [activeTab, setActiveTab] = useState<CmsType>("page");
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Front CMS"
        description="Manage website pages, news, events, gallery, banners and menus"
        icon={<Newspaper className="h-5 w-5" />}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CmsType)}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-full sm:w-auto flex justify-start">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                <t.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="page" className="mt-4">
          <PagesPanel search={search} setSearch={setSearch} />
        </TabsContent>
        <TabsContent value="news" className="mt-4">
          <NewsPanel search={search} setSearch={setSearch} />
        </TabsContent>
        <TabsContent value="event" className="mt-4">
          <EventsPanel search={search} setSearch={setSearch} />
        </TabsContent>
        <TabsContent value="gallery" className="mt-4">
          <GalleryPanel />
        </TabsContent>
        <TabsContent value="banner" className="mt-4">
          <BannerPanel />
        </TabsContent>
        <TabsContent value="menu" className="mt-4">
          <MenuPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* Shared helpers                                                  */
/* -------------------------------------------------------------- */

function useCmsList(type: CmsType) {
  return useQuery({
    queryKey: ["cms", type],
    queryFn: () => api(`/api/cms?type=${type}`),
  });
}

function useCmsDelete(type: CmsType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/cms?id=${id}&type=${type}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms", type] });
      toast.success("Item deleted successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 min-w-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    Published: "bg-emerald-500",
    Draft: "bg-amber-500",
    Upcoming: "bg-sky-500",
    Ongoing: "bg-violet-500",
    Completed: "bg-emerald-600",
    Active: "bg-emerald-500",
    Inactive: "bg-red-500",
  };
  const variant = status === "Draft" || status === "Inactive" ? "destructive" : "default";
  return (
    <Badge variant={variant as any} className={map[status || ""] || ""}>
      {status || "—"}
    </Badge>
  );
}

function PanelHeader({ title, count, action }: { title: string; count: number; action: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{count} {count === 1 ? "item" : "items"} total</p>
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------- */
/* Pages Panel                                                     */
/* -------------------------------------------------------------- */

function PagesPanel({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  const { data: pages = [], isLoading } = useCmsList("page");
  const del = useCmsDelete("page");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = pages.filter((p: any) =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <PanelHeader
          title="Website Pages"
          count={filtered.length}
          action={
            <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Add Page
            </Button>
          }
        />
        <SearchBar value={search} onChange={setSearch} placeholder="Search pages by title or slug..." />

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading pages...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No pages found"
            description="Create your first website page"
            icon={<FileText className="h-7 w-7" />}
            action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Page</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">/{p.slug}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={`/${p.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                        </Button>
                        <ConfirmDialog
                          trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                          title="Delete Page?"
                          description={`This will permanently delete "${p.title}".`}
                          confirmText="Delete"
                          onConfirm={() => del.mutate(p.id)}
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

      <PageDialog open={addOpen} onOpenChange={setAddOpen} />
    </Card>
  );
}

function PageDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", content: "", excerpt: "", status: "Published" });

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      await api("/api/cms", { method: "POST", body: JSON.stringify({ type: "page", ...form }) });
      toast.success("Page created successfully");
      queryClient.invalidateQueries({ queryKey: ["cms", "page"] });
      setForm({ title: "", slug: "", content: "", excerpt: "", status: "Published" });
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
          <DialogTitle>Add New Page</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="About Us" />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder="auto-generated from title" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Excerpt</Label>
            <Input value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} placeholder="Short summary shown in listings" />
          </div>
          <div className="space-y-1">
            <Label>Content</Label>
            <Textarea value={form.content} onChange={(e) => update("content", e.target.value)} rows={8} placeholder="Write the page content here..." />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Create Page"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- */
/* News Panel                                                      */
/* -------------------------------------------------------------- */

function NewsPanel({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  const { data: news = [], isLoading } = useCmsList("news");
  const del = useCmsDelete("news");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = news.filter((n: any) =>
    !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <PanelHeader
          title="News Articles"
          count={filtered.length}
          action={
            <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Add News
            </Button>
          }
        />
        <SearchBar value={search} onChange={setSearch} placeholder="Search news by title or category..." />

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading news...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No news articles"
            description="Publish your first news article"
            icon={<Newspaper className="h-7 w-7" />}
            action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add News</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((n: any) => (
                  <TableRow key={n.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium max-w-xs truncate">{n.title}</TableCell>
                    <TableCell>
                      {n.category ? <Badge variant="secondary">{n.category}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(n.publishedAt)}</TableCell>
                    <TableCell><StatusBadge status={n.status} /></TableCell>
                    <TableCell className="text-right">
                      <ConfirmDialog
                        trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                        title="Delete News?"
                        description={`This will permanently delete "${n.title}".`}
                        confirmText="Delete"
                        onConfirm={() => del.mutate(n.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <NewsDialog open={addOpen} onOpenChange={setAddOpen} />
    </Card>
  );
}

function NewsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", excerpt: "", category: "General", image: "" });

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      await api("/api/cms", { method: "POST", body: JSON.stringify({ type: "news", ...form }) });
      toast.success("News article published");
      queryClient.invalidateQueries({ queryKey: ["cms", "news"] });
      setForm({ title: "", content: "", excerpt: "", category: "General", image: "" });
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
        <DialogHeader><DialogTitle>Add News Article</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="School wins state debate competition" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => update("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NEWS_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Image URL</Label>
              <Input value={form.image} onChange={(e) => update("image", e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Excerpt</Label>
            <Input value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} placeholder="Short summary" />
          </div>
          <div className="space-y-1">
            <Label>Content</Label>
            <Textarea value={form.content} onChange={(e) => update("content", e.target.value)} rows={7} placeholder="Write the full article..." />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Publishing..." : "Publish News"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- */
/* Events Panel                                                    */
/* -------------------------------------------------------------- */

function EventsPanel({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  const { data: events = [], isLoading } = useCmsList("event");
  const del = useCmsDelete("event");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = events.filter((e: any) =>
    !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <PanelHeader
          title="School Events"
          count={filtered.length}
          action={
            <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Add Event
            </Button>
          }
        />
        <SearchBar value={search} onChange={setSearch} placeholder="Search events by title or location..." />

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading events...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No events"
            description="Add your first event"
            icon={<CalendarDays className="h-7 w-7" />}
            action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Event</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e: any) => (
                  <TableRow key={e.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium max-w-xs truncate">{e.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(e.startDate)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(e.endDate)}</TableCell>
                    <TableCell className="text-sm">{e.location || "—"}</TableCell>
                    <TableCell><StatusBadge status={e.status} /></TableCell>
                    <TableCell className="text-right">
                      <ConfirmDialog
                        trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                        title="Delete Event?"
                        description={`This will permanently delete "${e.title}".`}
                        confirmText="Delete"
                        onConfirm={() => del.mutate(e.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <EventDialog open={addOpen} onOpenChange={setAddOpen} />
    </Card>
  );
}

function EventDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", startDate: new Date().toISOString().split("T")[0],
    endDate: "", location: "",
  });

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title || !form.startDate) { toast.error("Title and start date are required"); return; }
    setSaving(true);
    try {
      await api("/api/cms", { method: "POST", body: JSON.stringify({ type: "event", ...form }) });
      toast.success("Event created successfully");
      queryClient.invalidateQueries({ queryKey: ["cms", "event"] });
      setForm({ title: "", description: "", startDate: new Date().toISOString().split("T")[0], endDate: "", location: "" });
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
        <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Inter-house Sports Day" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Start Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>End Date</Label>
              <Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="School Assembly Hall" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Create Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- */
/* Gallery Panel                                                   */
/* -------------------------------------------------------------- */

function GalleryPanel() {
  const { data: items = [], isLoading } = useCmsList("gallery");
  const del = useCmsDelete("gallery");
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <PanelHeader
          title="Photo Gallery"
          count={items.length}
          action={
            <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Add Image
            </Button>
          }
        />

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading gallery...</div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No gallery images"
            description="Add your first image"
            icon={<ImageIcon className="h-7 w-7" />}
            action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Image</Button>}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((g: any) => (
              <div key={g.id} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
                {g.image ? (
                  <img src={g.image} alt={g.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-xs font-medium text-white truncate">{g.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-white/70">{g.album || g.category || "—"}</span>
                      <ConfirmDialog
                        trigger={<Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"><Trash2 className="h-3 w-3" /></Button>}
                        title="Delete Image?"
                        description={`This will permanently delete "${g.title}".`}
                        confirmText="Delete"
                        onConfirm={() => del.mutate(g.id)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <GalleryDialog open={addOpen} onOpenChange={setAddOpen} />
    </Card>
  );
}

function GalleryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", image: "", category: "General", album: "" });

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title || !form.image) { toast.error("Title and image URL are required"); return; }
    setSaving(true);
    try {
      await api("/api/cms", { method: "POST", body: JSON.stringify({ type: "gallery", ...form }) });
      toast.success("Image added to gallery");
      queryClient.invalidateQueries({ queryKey: ["cms", "gallery"] });
      setForm({ title: "", image: "", category: "General", album: "" });
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
        <DialogHeader><DialogTitle>Add Gallery Image</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Inter-house Sports 2024" />
          </div>
          <div className="space-y-1">
            <Label>Image URL <span className="text-destructive">*</span></Label>
            <Input value={form.image} onChange={(e) => update("image", e.target.value)} placeholder="https://..." />
          </div>
          {form.image && (
            <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
              <img src={form.image} alt="preview" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => update("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GALLERY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Album</Label>
              <Input value={form.album} onChange={(e) => update("album", e.target.value)} placeholder="Sports Day 2024" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Add Image"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- */
/* Banners Panel                                                   */
/* -------------------------------------------------------------- */

function BannerPanel() {
  const { data: banners = [], isLoading } = useCmsList("banner");
  const del = useCmsDelete("banner");
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <PanelHeader
          title="Banner Images"
          count={banners.length}
          action={
            <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Add Banner
            </Button>
          }
        />

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading banners...</div>
        ) : banners.length === 0 ? (
          <EmptyState
            title="No banners"
            description="Add your first banner image"
            icon={<Layers className="h-7 w-7" />}
            action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Banner</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {banners.map((b: any) => (
              <div key={b.id} className="flex gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                <div className="h-20 w-28 rounded-md overflow-hidden bg-muted shrink-0">
                  {b.image ? (
                    <img src={b.image} alt={b.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Layers className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate">{b.title}</p>
                    <StatusBadge status={b.isActive ? "Active" : "Inactive"} />
                  </div>
                  {b.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{b.description}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Position: {b.position}</span>
                    <ConfirmDialog
                      trigger={<Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
                      title="Delete Banner?"
                      description={`This will permanently delete "${b.title}".`}
                      confirmText="Delete"
                      onConfirm={() => del.mutate(b.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <BannerDialog open={addOpen} onOpenChange={setAddOpen} />
    </Card>
  );
}

function BannerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", image: "", link: "", description: "", position: 1, isActive: true });

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title || !form.image) { toast.error("Title and image URL are required"); return; }
    setSaving(true);
    try {
      await api("/api/cms", { method: "POST", body: JSON.stringify({ type: "banner", ...form }) });
      toast.success("Banner created successfully");
      queryClient.invalidateQueries({ queryKey: ["cms", "banner"] });
      setForm({ title: "", image: "", link: "", description: "", position: 1, isActive: true });
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
        <DialogHeader><DialogTitle>Add Banner</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Admissions Open 2024/2025" />
          </div>
          <div className="space-y-1">
            <Label>Image URL <span className="text-destructive">*</span></Label>
            <Input value={form.image} onChange={(e) => update("image", e.target.value)} placeholder="https://..." />
          </div>
          {form.image && (
            <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
              <img src={form.image} alt="preview" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="space-y-1">
            <Label>Link (URL when clicked)</Label>
            <Input value={form.link} onChange={(e) => update("link", e.target.value)} placeholder="/admissions" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Position</Label>
              <Input type="number" value={form.position} onChange={(e) => update("position", parseInt(e.target.value || "0"))} />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch checked={form.isActive} onCheckedChange={(v) => update("isActive", v)} id="banner-active" />
              <Label htmlFor="banner-active" className="text-sm cursor-pointer">Active</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Create Banner"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- */
/* Menus Panel                                                     */
/* -------------------------------------------------------------- */

function MenuPanel() {
  const { data: menus = [], isLoading } = useCmsList("menu");
  const del = useCmsDelete("menu");
  const [addOpen, setAddOpen] = useState(false);

  const sorted = [...menus].sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <PanelHeader
          title="Website Menus"
          count={sorted.length}
          action={
            <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Add Menu
            </Button>
          }
        />

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading menus...</div>
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No menu items"
            description="Add your first menu item"
            icon={<MenuIcon className="h-7 w-7" />}
            action={<Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Menu</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((m: any) => (
                  <TableRow key={m.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{m.position}</TableCell>
                    <TableCell className="font-medium">{m.title}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-xs truncate">
                      <span className="inline-flex items-center gap-1">
                        {m.isExternal && <ExternalLink className="h-3 w-3" />}
                        {m.url || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.isExternal ? "secondary" : "default"} className={m.isExternal ? "" : "bg-emerald-500"}>
                        {m.isExternal ? "External" : "Internal"}
                      </Badge>
                    </TableCell>
                    <TableCell><StatusBadge status={m.isActive ? "Active" : "Inactive"} /></TableCell>
                    <TableCell className="text-right">
                      <ConfirmDialog
                        trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                        title="Delete Menu?"
                        description={`This will permanently delete "${m.title}".`}
                        confirmText="Delete"
                        onConfirm={() => del.mutate(m.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <MenuDialog open={addOpen} onOpenChange={setAddOpen} />
    </Card>
  );
}

function MenuDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", url: "", position: 1, isExternal: false });

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      await api("/api/cms", { method: "POST", body: JSON.stringify({ type: "menu", ...form }) });
      toast.success("Menu item added");
      queryClient.invalidateQueries({ queryKey: ["cms", "menu"] });
      setForm({ title: "", url: "", position: 1, isExternal: false });
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
        <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Admissions" />
          </div>
          <div className="space-y-1">
            <Label>URL</Label>
            <Input value={form.url} onChange={(e) => update("url", e.target.value)} placeholder={form.isExternal ? "https://example.com" : "/admissions"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Position</Label>
              <Input type="number" value={form.position} onChange={(e) => update("position", parseInt(e.target.value || "0"))} />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch checked={form.isExternal} onCheckedChange={(v) => update("isExternal", v)} id="menu-external" />
              <Label htmlFor="menu-external" className="text-sm cursor-pointer flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> External link
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : "Create Menu"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
