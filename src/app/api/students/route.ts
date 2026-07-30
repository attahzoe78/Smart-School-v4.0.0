import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAdmissionNo, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const search = searchParams.get("search");
    const gender = searchParams.get("gender");
    const status = searchParams.get("status");
    const take = parseInt(searchParams.get("take") || "100");
    const single = searchParams.get("id");

    if (single) {
      const student = await db.student.findUnique({
        where: { id: single },
        include: {
          currentClass: true, section: true, house: true, hostelRoom: { include: { hostel: true } },
          transportRoute: true, parent: true, session: true,
          attendance: { take: 30, orderBy: { date: "desc" } },
          feePayments: { take: 20, orderBy: { paymentDate: "desc" } },
          invoices: { take: 10, orderBy: { createdAt: "desc" } },
          examResults: { take: 20 },
          timeline: { orderBy: { date: "desc" } },
          bookIssues: { take: 10, orderBy: { issueDate: "desc" }, include: { book: true } },
        },
      });
      if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
      return NextResponse.json(student);
    }

    const where: any = {};
    if (classId) where.currentClassId = classId;
    if (sectionId) where.sectionId = sectionId;
    if (gender) where.gender = gender;
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { admissionNo: { contains: search } },
      ];
    }

    const students = await db.student.findMany({
      where,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        currentClass: { select: { name: true } },
        section: { select: { name: true } },
        parent: { select: { firstName: true, lastName: true, phone: true } },
      },
    });
    return NextResponse.json(students);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { parent: parentData, ...studentData } = body;

    let parentId = studentData.parentId;
    if (parentData && !parentId) {
      const parent = await db.parent.create({ data: parentData });
      parentId = parent.id;
    }

    const admissionNo = studentData.admissionNo || generateAdmissionNo();
    const student = await db.student.create({
      data: {
        ...studentData,
        admissionNo,
        parentId,
        admissionDate: studentData.admissionDate ? new Date(studentData.admissionDate) : new Date(),
        dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : null,
        ageAsOn: studentData.ageAsOn ? new Date(studentData.ageAsOn) : null,
      },
    });

    // Create student user account
    const username = admissionNo.toLowerCase().replace(/\//g, "");
    await db.user.create({
      data: {
        username,
        email: `${username}@smartschool.edu.ng`,
        password: hashPassword("student123"),
        role: "Student",
        studentId: student.id,
        isActive: true,
      },
    }).catch(() => {});

    return NextResponse.json(student, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, parent: parentData, ...updateData } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (parentData && parentData.id) {
      await db.parent.update({ where: { id: parentData.id }, data: parentData });
    }

    const data: any = { ...updateData };
    if (updateData.admissionDate) data.admissionDate = new Date(updateData.admissionDate);
    if (updateData.dateOfBirth) data.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.ageAsOn) data.ageAsOn = new Date(updateData.ageAsOn);
    delete data.parent;

    const student = await db.student.update({ where: { id }, data });
    return NextResponse.json(student);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.student.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
