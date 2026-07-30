import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "student";
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const date = searchParams.get("date");
    const staffId = searchParams.get("staffId");
    const studentId = searchParams.get("studentId");

    const dateFilter = date ? {
      gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
      lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
    } : undefined;

    if (type === "staff") {
      if (staffId) {
        const records = await db.staffAttendance.findMany({
          where: { staffId, ...(dateFilter ? { date: dateFilter } : {}) },
          orderBy: { date: "desc" }, take: 31,
        });
        return NextResponse.json(records);
      }
      const records = await db.staffAttendance.findMany({
        where: dateFilter ? { date: dateFilter } : {},
        orderBy: { date: "desc" }, take: 200,
        include: { staff: { select: { firstName: true, lastName: true, staffId: true, photo: true, department: { select: { name: true } } } } },
      });
      return NextResponse.json(records);
    }

    // Student attendance
    if (studentId) {
      const records = await db.studentAttendance.findMany({
        where: { studentId, ...(dateFilter ? { date: dateFilter } : {}) },
        orderBy: { date: "desc" }, take: 31,
      });
      return NextResponse.json(records);
    }

    if (classId) {
      const where: any = { classId, ...(dateFilter ? { date: dateFilter } : {}) };
      if (sectionId) where.sectionId = sectionId;
      const records = await db.studentAttendance.findMany({
        where, orderBy: { date: "desc" }, take: 500,
        include: { student: { select: { firstName: true, lastName: true, admissionNo: true, rollNo: true, photo: true } } },
      });
      return NextResponse.json(records);
    }

    const records = await db.studentAttendance.findMany({
      where: dateFilter ? { date: dateFilter } : {},
      orderBy: { date: "desc" }, take: 200,
      include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } },
    });
    return NextResponse.json(records);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, records } = body;

    if (type === "staff") {
      for (const r of records) {
        await db.staffAttendance.upsert({
          where: { staffId_date: { staffId: r.staffId, date: new Date(r.date) } },
          update: { status: r.status, note: r.note },
          create: { staffId: r.staffId, date: new Date(r.date), status: r.status, note: r.note },
        });
      }
      return NextResponse.json({ success: true, count: records.length });
    }

    // Student attendance - bulk mark
    for (const r of records) {
      await db.studentAttendance.upsert({
        where: { studentId_date: { studentId: r.studentId, date: new Date(r.date) } },
        update: { status: r.status, note: r.note, classId: r.classId, sectionId: r.sectionId },
        create: { studentId: r.studentId, date: new Date(r.date), status: r.status, note: r.note, classId: r.classId, sectionId: r.sectionId },
      });
    }
    return NextResponse.json({ success: true, count: records.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
