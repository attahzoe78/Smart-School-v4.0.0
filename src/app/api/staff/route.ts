import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const single = searchParams.get("id");

    if (single) {
      const staff = await db.staff.findUnique({
        where: { id: single },
        include: {
          department: true, designation: true,
          attendance: { take: 30, orderBy: { date: "desc" } },
          payroll: { take: 12, orderBy: [{ year: "desc" }, { month: "desc" }] },
          leaveRequests: { take: 10, orderBy: { createdAt: "desc" }, include: { leaveType: true } },
          classTeachers: { include: { class: true, section: true } },
        },
      });
      if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
      return NextResponse.json(staff);
    }

    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { staffId: { contains: search } },
      ];
    }

    const staff = await db.staff.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });
    return NextResponse.json(staff);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, username, password, ...staffData } = body;

    const staffId = staffData.staffId || `EMP-${String(Date.now()).slice(-6)}`;
    const staff = await db.staff.create({
      data: {
        ...staffData,
        staffId,
        joiningDate: staffData.joiningDate ? new Date(staffData.joiningDate) : new Date(),
        dateOfBirth: staffData.dateOfBirth ? new Date(staffData.dateOfBirth) : null,
      },
    });

    // Create user account
    const uname = username || staff.email?.split("@")[0] || staffId.toLowerCase();
    await db.user.create({
      data: {
        username: uname,
        email: staff.email || `${uname}@smartschool.edu.ng`,
        password: hashPassword(password || "password123"),
        role: role || "Teacher",
        staffId: staff.id,
        isActive: true,
      },
    }).catch(() => {});

    return NextResponse.json(staff, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const data: any = { ...updateData };
    if (updateData.joiningDate) data.joiningDate = new Date(updateData.joiningDate);
    if (updateData.dateOfBirth) data.dateOfBirth = new Date(updateData.dateOfBirth);

    const staff = await db.staff.update({ where: { id }, data });
    return NextResponse.json(staff);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await db.staff.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
