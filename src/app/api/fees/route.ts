import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateInvoiceNo, generatePaymentNo } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "payments";

    if (action === "types") {
      const types = await db.feeType.findMany({
        include: { class: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(types);
    }

    if (action === "invoices") {
      const studentId = searchParams.get("studentId");
      const where: any = {};
      if (studentId) where.studentId = studentId;
      const invoices = await db.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { student: { select: { firstName: true, lastName: true, admissionNo: true, currentClass: { select: { name: true } } } }, feeType: { select: { name: true } } },
      });
      return NextResponse.json(invoices);
    }

    // Default: payments
    const studentId = searchParams.get("studentId");
    const where: any = {};
    if (studentId) where.studentId = studentId;
    const payments = await db.feePayment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      take: 100,
      include: { student: { select: { firstName: true, lastName: true, admissionNo: true, currentClass: { select: { name: true } } } } },
    });
    return NextResponse.json(payments);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "add-type") {
      const ft = await db.feeType.create({ data: { name: body.name, code: body.code, description: body.description, amount: body.amount, type: body.type, classId: body.classId, sessionId: body.sessionId, isActive: true } });
      return NextResponse.json(ft, { status: 201 });
    }

    if (action === "add-payment") {
      const { studentId, amount, discount, fine, paymentMode, description, invoiceId } = body;
      const settings = await db.systemSetting.findFirst();
      const session = await db.session.findFirst({ where: { isDefault: true } });

      const payment = await db.feePayment.create({
        data: {
          paymentNo: generatePaymentNo(),
          studentId, invoiceId: invoiceId || null,
          amount: parseFloat(amount), discount: parseFloat(discount || 0), fine: parseFloat(fine || 0),
          paymentMode, description, collectedBy: "Accountant",
          sessionId: session?.id,
        },
      });

      // Update invoice if linked
      if (invoiceId) {
        const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
        if (invoice) {
          const newPaid = invoice.paidAmount + parseFloat(amount);
          const newBalance = invoice.amount - invoice.discount - newPaid;
          await db.invoice.update({
            where: { id: invoiceId },
            data: {
              paidAmount: newPaid,
              balance: newBalance,
              status: newBalance <= 0 ? "Paid" : newPaid > 0 ? "Partial" : "Unpaid",
            },
          });
        }
      }

      return NextResponse.json(payment, { status: 201 });
    }

    if (action === "generate-invoice") {
      const { studentId, feeTypeId, amount, discount, dueDate } = body;
      const session = await db.session.findFirst({ where: { isDefault: true } });
      const invoice = await db.invoice.create({
        data: {
          invoiceNo: generateInvoiceNo(),
          studentId, feeTypeId,
          amount: parseFloat(amount), discount: parseFloat(discount || 0),
          balance: parseFloat(amount) - parseFloat(discount || 0),
          status: "Unpaid",
          dueDate: dueDate ? new Date(dueDate) : null,
          sessionId: session?.id,
        },
      });
      return NextResponse.json(invoice, { status: 201 });
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
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (action === "type") await db.feeType.delete({ where: { id } });
    else if (action === "payment") await db.feePayment.delete({ where: { id } });
    else if (action === "invoice") await db.invoice.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
