"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Users, GraduationCap, Wallet, BookOpen, CalendarCheck, PhoneCall,
  TrendingUp, Clock, CheckCircle2, UserCheck, UserX, Home, Bus,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";
import { formatCurrency, formatDate, timeAgo, getInitials } from "@/lib/format";
import { useAppStore } from "@/store/app";

interface DashboardData {
  stats: {
    totalStudents: number; activeStudents: number; totalStaff: number;
    totalClasses: number; totalBooks: number; totalCollection: number;
    totalDiscount: number; totalFine: number; pendingEnquiries: number;
    pendingLeaves: number; pendingTasks: number; booksIssued: number;
    presentToday: number; absentToday: number; attendanceRate: number;
    maleStudents: number; femaleStudents: number; newAdmissionsThisMonth: number;
  };
  charts: {
    monthlyCollection: { month: string; amount: number }[];
    classDistribution: { name: string; students: number }[];
    genderSplit: { male: number; female: number };
  };
  recent: {
    admissions: any[];
    payments: any[];
    events: any[];
  };
}

const GENDER_COLORS = ["#3b82f6", "#ec4899"];

export function Dashboard() {
  const { user } = useAppStore();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard", user?.id],
    queryFn: () => api(`/api/dashboard?role=${user?.role}&userId=${user?.id}`),
  });

  const stats = data?.stats;
  const charts = data?.charts;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name?.split(" ")[0] || "Admin"}!`}
        description={`Here's what's happening at your school today, ${formatDate(new Date())}`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={GraduationCap} color="bg-emerald-500" subtitle={`${stats?.activeStudents || 0} active`} change={`${stats?.newAdmissionsThisMonth || 0} new this month`} changeType="positive" />
        <StatCard title="Total Staff" value={stats?.totalStaff || 0} icon={Users} color="bg-violet-500" subtitle="Teaching & non-teaching" />
        <StatCard title="Fee Collection" value={formatCurrency(stats?.totalCollection || 0)} icon={Wallet} color="bg-amber-500" subtitle={`Fine: ${formatCurrency(stats?.totalFine || 0)}`} change="+12.5%" changeType="positive" />
        <StatCard title="Attendance Today" value={`${stats?.attendanceRate || 0}%`} icon={CalendarCheck} color="bg-sky-500" subtitle={`${stats?.presentToday || 0} present, ${stats?.absentToday || 0} absent`} />
        <StatCard title="Total Classes" value={stats?.totalClasses || 0} icon={Home} color="bg-rose-500" subtitle="From Creche to SSS 3" />
        <StatCard title="Library Books" value={stats?.totalBooks || 0} icon={BookOpen} color="bg-cyan-500" subtitle={`${stats?.booksIssued || 0} currently issued`} />
        <StatCard title="Pending Enquiries" value={stats?.pendingEnquiries || 0} icon={PhoneCall} color="bg-orange-500" subtitle="Admission follow-ups" />
        <StatCard title="Pending Tasks" value={stats?.pendingTasks || 0} icon={Clock} color="bg-pink-500" subtitle={`${stats?.pendingLeaves || 0} leave requests`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Collection */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" /> Fee Collection Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={charts?.monthlyCollection || []}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Split */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-600" /> Gender Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Male", value: charts?.genderSplit.male || 0 },
                    { name: "Female", value: charts?.genderSplit.female || 0 },
                  ]}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}
                  dataKey="value"
                >
                  {GENDER_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-xs">Male: {charts?.genderSplit.male || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                <span className="text-xs">Female: {charts?.genderSplit.female || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Distribution */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Students per Class</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts?.classDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
              <YAxis className="text-xs" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Bar dataKey="students" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Admissions */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-600" /> Recent Admissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64 px-6">
              <div className="space-y-3 py-2">
                {data?.recent.admissions.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={s.photo || undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{getInitials(s.firstName, s.lastName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-muted-foreground">{s.admissionNo} • {s.currentClass?.name || "—"}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{timeAgo(s.admissionDate)}</Badge>
                  </div>
                ))}
                {data?.recent.admissions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No recent admissions</p>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-amber-600" /> Recent Fee Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64 px-6">
              <div className="space-y-3 py-2">
                {data?.recent.payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.student?.firstName} {p.student?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{p.paymentNo} • {p.paymentMode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600">{formatCurrency(p.amount)}</p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(p.paymentDate)}</p>
                    </div>
                  </div>
                ))}
                {data?.recent.payments.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No recent payments</p>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-sky-600" /> Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data?.recent.events.map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white shrink-0" style={{ backgroundColor: e.color || "#16a34a" }}>
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(e.startDate)}</p>
                  {e.location && <p className="text-xs text-muted-foreground mt-0.5">{e.location}</p>}
                </div>
              </div>
            ))}
            {data?.recent.events.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
