import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "payroll";

    if (action === "payroll") {
      const month = searchParams.get("month");
      const year = searchParams.get("year");
      const where: any = {};
      if (month) where.month = parseInt(month);
      if (year) where.year = parseInt(year);
      const payroll = await db.payroll.findMany({
        where, orderBy: [{ year: "desc" }, { month: "desc" }],
        include: { staff: { select: { firstName: true, lastName: true, staffId: true, designation: { select: { name: true } }, department: { select: { name: true } } } } },
      });
      return NextResponse.json(payroll);
    }
    if (action === "leave-requests") {
      const requests = await db.leaveRequest.findMany({
        orderBy: { createdAt: "desc" }, take: 100,
        include: { staff: { select: { firstName: true, lastName: true, staffId: true, photo: true } }, leaveType: { select: { name: true } } },
      });
      return NextResponse.json(requests);
    }
    if (action === "leave-types") {
      const types = await db.leaveType.findMany();
      return NextResponse.json(types);
    }
    if (action === "departments") {
      const depts = await db.department.findMany({ include: { _count: { select: { staff: true } } } });
      return NextResponse.json(depts);
    }
    if (action === "designations") {
      const desigs = await db.designation.findMany({ include: { _count: { select: { staff: true } } } });
      return NextResponse.json(desigs);
    }
    return NextResponse.json([]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "generate-payroll") {
      const { month, year } = body;
      const staff = await db.staff.findMany({ where: { isActive: true } });
      let generated = 0;
      for (const s of staff) {
        const existing = await db.payroll.findUnique({ where: { staffId_month_year: { staffId: s.id, month: parseInt(month), year: parseInt(year) } } });
        if (existing) continue;
        const allowances = s.houseAllowance + s.transportAllowance + s.medicalAllowance + s.otherAllowance;
        const deductions = s.taxDeduction + s.pensionDeduction;
        const netSalary = s.basicSalary + allowances - deductions;
        await db.payroll.create({
          data: { staffId: s.id, month: parseInt(month), year: parseInt(year), basicSalary: s.basicSalary, allowances, deductions, netSalary, status: "Generated" },
        });
        generated++;
      }
      return NextResponse.json({ success: true, generated });
    }
    if (action === "pay-salary") {
      const { id, paymentMode, transactionId } = body;
      const payroll = await db.payroll.update({
        where: { id }, data: { status: "Paid", paymentDate: new Date(), paymentMode, transactionId },
      });
      return NextResponse.json(payroll);
    }
    if (action === "apply-leave") {
      const { action: _, ...data } = body;
      const request = await db.leaveRequest.create({
        data: { ...data, applyDate: new Date(), fromDate: new Date(data.fromDate), toDate: new Date(data.toDate) },
      });
      return NextResponse.json(request, { status: 201 });
    }
    if (action === "approve-leave") {
      const { id, status, note } = body;
      const request = await db.leaveRequest.update({
        where: { id }, data: { status, note, approvedAt: new Date(), approvedBy: body.approvedBy },
      });
      return NextResponse.json(request);
    }
    if (action === "add-department") {
      const { action: _, ...data } = body;
      const dept = await db.department.create({ data });
      return NextResponse.json(dept, { status: 201 });
    }
    if (action === "add-designation") {
      const { action: _, ...data } = body;
      const desig = await db.designation.create({ data });
      return NextResponse.json(desig, { status: 201 });
    }
    if (action === "add-leave-type") {
      const { action: _, ...data } = body;
      const lt = await db.leaveType.create({ data });
      return NextResponse.json(lt, { status: 201 });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");
    if (!id || !action) return NextResponse.json({ error: "ID and action required" }, { status: 400 });

    if (action === "department") await db.department.delete({ where: { id } });
    else if (action === "designation") await db.designation.delete({ where: { id } });
    else if (action === "leave-type") await db.leaveType.delete({ where: { id } });
    else if (action === "payroll") await db.payroll.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
