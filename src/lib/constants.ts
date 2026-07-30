import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Users, GraduationCap, Wallet, CalendarCheck, Building2,
  BookOpen, ClipboardList, FileText, CalendarDays, Newspaper, ShieldCheck,
  Award, Settings, UserCog, PhoneCall, ScrollText, Bus, Home, Layers,
  Newspaper as News, Image, Menu, Download, Clock, FolderTree
} from "lucide-react";

export type UserRole =
  | "Super Admin" | "Admin" | "Accountant" | "Teacher"
  | "Receptionist" | "Librarian" | "Parent" | "Student";

export const USER_ROLES: { value: UserRole; label: string; color: string; description: string }[] = [
  { value: "Super Admin", label: "Super Admin", color: "bg-red-500", description: "Full system access" },
  { value: "Admin", label: "Admin", color: "bg-orange-500", description: "School administration" },
  { value: "Accountant", label: "Accountant", color: "bg-emerald-500", description: "Fees & payroll" },
  { value: "Teacher", label: "Teacher", color: "bg-violet-500", description: "Teaching & homework" },
  { value: "Receptionist", label: "Receptionist", color: "bg-cyan-500", description: "Front office" },
  { value: "Librarian", label: "Librarian", color: "bg-amber-500", description: "Library management" },
  { value: "Parent", label: "Parent", color: "bg-pink-500", description: "Child monitoring" },
  { value: "Student", label: "Student", color: "bg-sky-500", description: "Student portal" },
];

export interface NavModule {
  id: string;
  label: string;
  icon: LucideIcon;
  category: string;
  roles: UserRole[];
  description?: string;
}

export const MODULES: NavModule[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, category: "Main", roles: ["Super Admin","Admin","Accountant","Teacher","Receptionist","Librarian","Parent","Student"] },
  { id: "students", label: "Student Information", icon: GraduationCap, category: "Academics", roles: ["Super Admin","Admin","Receptionist","Teacher"] },
  { id: "attendance", label: "Attendance", icon: CalendarCheck, category: "Academics", roles: ["Super Admin","Admin","Teacher","Parent","Student"] },
  { id: "examinations", label: "Examinations", icon: ClipboardList, category: "Academics", roles: ["Super Admin","Admin","Teacher","Parent","Student"] },
  { id: "homework", label: "Homework", icon: BookOpen, category: "Academics", roles: ["Super Admin","Admin","Teacher","Parent","Student"] },
  { id: "download-center", label: "Download Center", icon: Download, category: "Academics", roles: ["Super Admin","Admin","Teacher","Parent","Student"] },
  { id: "staff", label: "Staff Directory", icon: UserCog, category: "Human Resource", roles: ["Super Admin","Admin"] },
  { id: "departments", label: "Departments", icon: Building2, category: "Human Resource", roles: ["Super Admin","Admin"] },
  { id: "staff-attendance", label: "Staff Attendance", icon: CalendarCheck, category: "Human Resource", roles: ["Super Admin","Admin"] },
  { id: "payroll", label: "Payroll", icon: Wallet, category: "Human Resource", roles: ["Super Admin","Admin","Accountant"] },
  { id: "leave", label: "Leave Management", icon: Clock, category: "Human Resource", roles: ["Super Admin","Admin","Teacher"] },
  { id: "fees", label: "Fees Collection", icon: Wallet, category: "Finance", roles: ["Super Admin","Admin","Accountant","Parent","Student"] },
  { id: "expenses", label: "Expenses", icon: FileText, category: "Finance", roles: ["Super Admin","Admin","Accountant"] },
  { id: "front-office", label: "Front Office", icon: PhoneCall, category: "Front Office", roles: ["Super Admin","Admin","Receptionist"] },
  { id: "visitor-book", label: "Visitor Book", icon: Users, category: "Front Office", roles: ["Super Admin","Admin","Receptionist"] },
  { id: "complaints", label: "Complaints", icon: ScrollText, category: "Front Office", roles: ["Super Admin","Admin","Receptionist"] },
  { id: "library", label: "Library", icon: BookOpen, category: "Library", roles: ["Super Admin","Admin","Librarian","Student"] },
  { id: "calendar", label: "Calendar & Tasks", icon: CalendarDays, category: "Utilities", roles: ["Super Admin","Admin","Teacher","Parent","Student"] },
  { id: "certificates", label: "Certificates & ID Cards", icon: Award, category: "Utilities", roles: ["Super Admin","Admin"] },
  { id: "cms", label: "Front CMS", icon: Newspaper, category: "Content", roles: ["Super Admin","Admin"] },
  { id: "pages", label: "Pages", icon: FileText, category: "Content", roles: ["Super Admin","Admin"] },
  { id: "news", label: "News & Events", icon: News, category: "Content", roles: ["Super Admin","Admin"] },
  { id: "gallery", label: "Gallery", icon: Image, category: "Content", roles: ["Super Admin","Admin"] },
  { id: "banners", label: "Banner Images", icon: Layers, category: "Content", roles: ["Super Admin","Admin"] },
  { id: "menus", label: "Menus", icon: Menu, category: "Content", roles: ["Super Admin","Admin"] },
  { id: "media", label: "Media Manager", icon: FolderTree, category: "Content", roles: ["Super Admin","Admin"] },
  { id: "hostel", label: "Hostel", icon: Home, category: "Facilities", roles: ["Super Admin","Admin"] },
  { id: "transport", label: "Transport", icon: Bus, category: "Facilities", roles: ["Super Admin","Admin"] },
  { id: "roles", label: "Roles & Permissions", icon: ShieldCheck, category: "System", roles: ["Super Admin"] },
  { id: "settings", label: "Settings", icon: Settings, category: "System", roles: ["Super Admin","Admin"] },
];

export const MODULE_CATEGORIES = [
  "Main", "Academics", "Human Resource", "Finance", "Front Office",
  "Library", "Utilities", "Content", "Facilities", "System"
];

export const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara"
];

export const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

export const FEE_TYPES = ["One Time", "Monthly", "Quarterly", "Yearly"];

export const PAYMENT_MODES = ["Cash", "Cheque", "Bank Transfer", "Online", "POS"];

export const ATTENDANCE_STATUS = ["Present", "Absent", "Late", "Excused", "Half Day", "Holiday"];

export const GRADE_SCALE = [
  { min: 90, max: 100, grade: "A+", remark: "Excellent" },
  { min: 80, max: 89, grade: "A", remark: "Very Good" },
  { min: 70, max: 79, grade: "B", remark: "Good" },
  { min: 60, max: 69, grade: "C", remark: "Credit" },
  { min: 50, max: 59, grade: "D", remark: "Pass" },
  { min: 0, max: 49, grade: "F", remark: "Fail" },
];

export function getGrade(marks: number, total: number = 100) {
  const pct = (marks / total) * 100;
  const g = GRADE_SCALE.find(s => pct >= s.min && pct <= s.max);
  return g || { grade: "F", remark: "Fail" };
}
