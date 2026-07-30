"use client";

import { useState, useMemo, useCallback } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus, ChevronLeft, ChevronRight, CalendarDays, MapPin, Clock,
  Trash2, CheckCircle2, Circle, Loader2, ListTodo, Flag,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const EVENT_TYPES = ["Event", "Holiday", "Meeting", "Exam"] as const;
const EVENT_COLORS = [
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Orange", value: "#f97316" },
];

const TASK_PRIORITIES = ["Low", "Medium", "High"] as const;
const TASK_STATUSES = ["Pending", "In Progress", "Completed"] as const;

const TYPE_BADGES: Record<string, string> = {
  Event: "bg-emerald-100 text-emerald-700",
  Holiday: "bg-rose-100 text-rose-700",
  Meeting: "bg-violet-100 text-violet-700",
  Exam: "bg-amber-100 text-amber-700",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarScreen() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [eventOpen, setEventOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState("All");

  const { data: events = [] } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: () => api("/api/calendar?action=events"),
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["calendar-tasks"],
    queryFn: () => api("/api/calendar?action=tasks"),
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => api(`/api/calendar?id=${id}&action=event`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Event deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api(`/api/calendar?id=${id}&action=task`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api("/api/calendar", { method: "POST", body: JSON.stringify({ action: "update-task", id, status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Build calendar grid: 6 weeks = 42 cells
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const days: Date[] = [];
    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    // Current month days
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    // Next month days to fill 42 cells
    while (days.length < 42) {
      const last = days[days.length - 1];
      days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
    }
    return days;
  }, [currentMonth]);

  const eventsOnDay = useCallback((day: Date) => {
    return events.filter((e: any) => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate || e.startDate);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
      return start <= dayEnd && end >= dayStart;
    });
  }, [events]);

  const selectedDayEvents = useMemo(() => eventsOnDay(selectedDate), [selectedDate, eventsOnDay]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === "All") return tasks;
    return tasks.filter((t: any) => t.status === taskFilter);
  }, [tasks, taskFilter]);

  const taskStats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((t: any) => t.status === "Pending").length,
    inProgress: tasks.filter((t: any) => t.status === "In Progress").length,
    completed: tasks.filter((t: any) => t.status === "Completed").length,
  }), [tasks]);

  function toggleTaskStatus(task: any) {
    const order = ["Pending", "In Progress", "Completed"];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    updateTaskMutation.mutate({ id: task.id, status: next });
    toast.success(`Task marked as ${next}`);
  }

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const goToday = () => {
    const t = new Date();
    setCurrentMonth(t);
    setSelectedDate(t);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar & Tasks"
        description="Plan events, holidays, and manage your to-do list"
        icon={<CalendarDays className="h-5 w-5" />}
        action={
          <Button onClick={() => setEventOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth} aria-label="Previous month">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth} aria-label="Next month">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isToday = sameDay(day, new Date());
                  const isSelected = sameDay(day, selectedDate);
                  const dayEvents = eventsOnDay(day);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(new Date(day))}
                      className={cn(
                        "min-h-[68px] sm:min-h-[88px] p-1.5 rounded-lg border text-left transition-colors hover:bg-muted/50 flex flex-col gap-1",
                        !isCurrentMonth && "opacity-40",
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500"
                          : "border-border/60"
                      )}
                      aria-label={`${day.getDate()} ${MONTHS[day.getMonth()]}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-xs font-medium flex items-center justify-center",
                          isToday && "h-5 w-5 rounded-full bg-emerald-600 text-white"
                        )}>
                          {day.getDate()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-0.5">
                        {dayEvents.slice(0, 4).map((e: any) => (
                          <span
                            key={e.id}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: e.color || "#10b981" }}
                          />
                        ))}
                        {dayEvents.length > 4 && (
                          <span className="text-[9px] text-muted-foreground leading-none">+{dayEvents.length - 4}</span>
                        )}
                      </div>
                      {dayEvents.length > 0 && dayEvents.length <= 2 && (
                        <div className="hidden sm:block">
                          {dayEvents.slice(0, 1).map((e: any) => (
                            <p key={e.id} className="text-[10px] truncate font-medium leading-tight" style={{ color: e.color || "#10b981" }}>
                              {e.title}
                            </p>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-emerald-600" />
                  {formatDate(selectedDate)}
                </span>
                <Button variant="outline" size="sm" onClick={() => setEventOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No events on this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((e: any) => (
                    <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-white shrink-0"
                        style={{ backgroundColor: e.color || "#10b981" }}
                      >
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">{e.title}</p>
                          <Badge variant="secondary" className={TYPE_BADGES[e.type] || ""}>{e.type}</Badge>
                        </div>
                        {e.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{e.description}</p>}
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(e.startDate)}
                            {e.endDate && e.endDate !== e.startDate ? ` – ${formatDate(e.endDate)}` : ""}
                          </span>
                          {e.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {e.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <ConfirmDialog
                        trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>}
                        title="Delete Event?"
                        description={`This will permanently delete "${e.title}".`}
                        confirmText="Delete"
                        onConfirm={() => deleteEventMutation.mutate(e.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tasks - 1/3 width */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-emerald-600" /> Tasks
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setTaskOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Task stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30">
                  <p className="text-lg font-bold text-amber-600">{taskStats.pending}</p>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/30">
                  <p className="text-lg font-bold text-sky-600">{taskStats.inProgress}</p>
                  <p className="text-[10px] text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-lg font-bold text-emerald-600">{taskStats.completed}</p>
                  <p className="text-[10px] text-muted-foreground">Done</p>
                </div>
              </div>

              {/* Filter */}
              <div className="flex gap-1">
                {["All", ...TASK_STATUSES].map((s) => (
                  <Button
                    key={s}
                    variant={taskFilter === s ? "default" : "outline"}
                    size="sm"
                    className={cn("flex-1 h-7 text-xs", taskFilter === s && "bg-emerald-600 hover:bg-emerald-700")}
                    onClick={() => setTaskFilter(s)}
                  >
                    {s === "In Progress" ? "Active" : s}
                  </Button>
                ))}
              </div>

              {/* Task list */}
              {filteredTasks.length === 0 ? (
                <EmptyState
                  title="No tasks"
                  description="Create a task to get started"
                  icon={<ListTodo className="h-7 w-7" />}
                />
              ) : (
                <ScrollArea className="max-h-[520px] -mx-1 px-1">
                  <div className="space-y-2">
                    {filteredTasks.map((t: any) => {
                      const isCompleted = t.status === "Completed";
                      const isInProgress = t.status === "In Progress";
                      const isOverdue = !isCompleted && t.dueDate && new Date(t.dueDate) < new Date(new Date().toDateString());
                      const priorityColor =
                        t.priority === "High" ? "text-rose-600"
                        : t.priority === "Medium" ? "text-amber-600"
                        : "text-emerald-600";
                      return (
                        <div
                          key={t.id}
                          className={cn(
                            "p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow",
                            isCompleted && "opacity-60"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => toggleTaskStatus(t)}
                              className="mt-0.5 shrink-0"
                              aria-label="Toggle status"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              ) : isInProgress ? (
                                <Loader2 className="h-5 w-5 text-sky-600 animate-spin" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground hover:text-emerald-600" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium", isCompleted && "line-through")}>{t.title}</p>
                              {t.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                                <span className={cn("flex items-center gap-0.5 font-medium", priorityColor)}>
                                  <Flag className="h-3 w-3" /> {t.priority}
                                </span>
                                {t.dueDate && (
                                  <span className={cn(
                                    "flex items-center gap-0.5",
                                    isOverdue ? "text-rose-600 font-medium" : "text-muted-foreground"
                                  )}>
                                    <Clock className="h-3 w-3" /> {formatDate(t.dueDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ConfirmDialog
                              trigger={
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              }
                              title="Delete Task?"
                              description={`This will permanently delete "${t.title}".`}
                              confirmText="Delete"
                              onConfirm={() => deleteTaskMutation.mutate(t.id)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EventDialog open={eventOpen} onOpenChange={setEventOpen} defaultDate={selectedDate} />
      <TaskDialog open={taskOpen} onOpenChange={setTaskOpen} />
    </div>
  );
}

function EventDialog({ open, onOpenChange, defaultDate }: any) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    title: "", description: "", type: "Event",
    startDate: toISODate(defaultDate), endDate: toISODate(defaultDate),
    color: "#10b981", location: "",
  });

  useMemo(() => {
    if (open) {
      setForm({
        title: "", description: "", type: "Event",
        startDate: toISODate(defaultDate), endDate: toISODate(defaultDate),
        color: "#10b981", location: "",
      });
    }
  }, [open, defaultDate]);

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      await api("/api/calendar", {
        method: "POST",
        body: JSON.stringify({ action: "create-event", ...form }),
      });
      toast.success("Event added successfully");
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
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
          <DialogTitle>Add Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Mid-term Break" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Event description..." rows={2} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="e.g. School Hall" />
            </div>
            <div className="space-y-1">
              <Label>Start Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>End Date</Label>
              <Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => update("color", c.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-all",
                    form.color === c.value ? "border-foreground ring-2 ring-foreground/10" : "border-border"
                  )}
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.value }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Adding..." : "Add Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskDialog({ open, onOpenChange }: any) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    title: "", description: "", priority: "Medium",
    dueDate: toISODate(new Date()),
  });

  useMemo(() => {
    if (open) {
      setForm({
        title: "", description: "", priority: "Medium",
        dueDate: toISODate(new Date()),
      });
    }
  }, [open]);

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      await api("/api/calendar", {
        method: "POST",
        body: JSON.stringify({ action: "create-task", ...form }),
      });
      toast.success("Task added successfully");
      queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
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
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Prepare report cards" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Task description..." rows={2} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => update("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Adding..." : "Add Task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
