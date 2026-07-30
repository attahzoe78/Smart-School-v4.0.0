import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const role = url.searchParams.get("role") || "Admin";
    const userId = url.searchParams.get("userId");

    const [
      totalStudents, totalStaff, totalClasses, totalBooks,
      todayDate, feePayments, pendingEnquiries, pendingLeaves,
      activeStudents, maleStudents, femaleStudents, newAdmissionsThisMonth
    ] = await Promise.all([
      db.student.count(),
      db.staff.count({ where: { isActive: true } }),
      db.class.count(),
      db.book.count(),
      new Date(),
      db.feePayment.findMany({ where: { paymentDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      db.admissionEnquiry.count({ where: { status: "Active" } }),
      db.leaveRequest.count({ where: { status: "Pending" } }),
      db.student.count({ where: { isActive: true } }),
      db.student.count({ where: { gender: "Male", isActive: true } }),
      db.student.count({ where: { gender: "Female", isActive: true } }),
      db.student.count({ where: { admissionDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    ]);

    const totalCollection = feePayments.reduce((s, p) => s + p.amount, 0);
    const totalDiscount = feePayments.reduce((s, p) => s + p.discount, 0);
    const totalFine = feePayments.reduce((s, p) => s + p.fine, 0);

    // Today's attendance
    const todayStart = new Date(todayDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayDate);
    todayEnd.setHours(23, 59, 59, 999);

    const [presentToday, absentToday] = await Promise.all([
      db.studentAttendance.count({ where: { date: { gte: todayStart, lte: todayEnd }, status: "Present" } }),
      db.studentAttendance.count({ where: { date: { gte: todayStart, lte: todayEnd }, status: "Absent" } }),
    ]);

    const attendanceRate = activeStudents > 0 ? Math.round((presentToday / activeStudents) * 100) : 0;

    // Monthly collection chart (last 6 months)
    const monthlyCollection: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const payments = await db.feePayment.findMany({ where: { paymentDate: { gte: monthStart, lte: monthEnd } } });
      monthlyCollection.push({
        month: d.toLocaleString("en", { month: "short" }),
        amount: payments.reduce((s, p) => s + p.amount, 0),
      });
    }

    // Class distribution
    const classes = await db.class.findMany({ include: { _count: { select: { students: true } } } });
    const classDistribution = classes.slice(0, 10).map(c => ({
      name: c.name,
      students: c._count.students,
    }));

    // Recent admissions
    const recentAdmissions = await db.student.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, admissionNo: true, firstName: true, lastName: true, admissionDate: true, photo: true, currentClass: { select: { name: true } } },
    });

    // Recent fee payments
    const recentPayments = await db.feePayment.findMany({
      take: 5,
      orderBy: { paymentDate: "desc" },
      include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } },
    });

    // Upcoming events
    const upcomingEvents = await db.calendarEvent.findMany({
      where: { startDate: { gte: todayDate }, isActive: true },
      take: 5,
      orderBy: { startDate: "asc" },
    });

    // Pending tasks
    const pendingTasks = await db.task.count({ where: { status: { in: ["Pending", "In Progress"] } } });

    // Book issues
    const booksIssued = await db.bookIssue.count({ where: { status: "Issued" } });

    return NextResponse.json({
      stats: {
        totalStudents, activeStudents, totalStaff, totalClasses, totalBooks,
        totalCollection, totalDiscount, totalFine,
        pendingEnquiries, pendingLeaves, pendingTasks, booksIssued,
        presentToday, absentToday, attendanceRate,
        maleStudents, femaleStudents, newAdmissionsThisMonth,
      },
      charts: {
        monthlyCollection,
        classDistribution,
        genderSplit: { male: maleStudents, female: femaleStudents },
      },
      recent: {
        admissions: recentAdmissions,
        payments: recentPayments,
        events: upcomingEvents,
      },
    });
  } catch (e: any) {
    console.error("Dashboard error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
