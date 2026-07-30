import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "exams";

    if (action === "exams") {
      const exams = await db.exam.findMany({
        orderBy: { startDate: "desc" }, take: 50,
        include: { class: { select: { name: true } }, section: { select: { name: true } }, _count: { select: { results: true } } },
      });
      return NextResponse.json(exams);
    }
    if (action === "results") {
      const examId = searchParams.get("examId");
      const studentId = searchParams.get("studentId");
      const where: any = {};
      if (examId) where.examId = examId;
      if (studentId) where.studentId = studentId;
      const results = await db.examResult.findMany({
        where, orderBy: { subjectName: "asc" }, take: 200,
        include: { student: { select: { firstName: true, lastName: true, admissionNo: true, currentClass: { select: { name: true } } } } },
      });
      return NextResponse.json(results);
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

    if (action === "create-exam") {
      const { action: _, ...data } = body;
      const exam = await db.exam.create({
        data: { ...data, startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : null },
      });
      return NextResponse.json(exam, { status: 201 });
    }
    if (action === "save-results") {
      const { examId, results } = body;
      for (const r of results) {
        const existing = await db.examResult.findFirst({ where: { examId, studentId: r.studentId, subjectName: r.subjectName } });
        if (existing) {
          await db.examResult.update({ where: { id: existing.id }, data: { marks: parseFloat(r.marks), totalMarks: parseFloat(r.totalMarks || 100) } });
        } else {
          await db.examResult.create({ data: { examId, studentId: r.studentId, subjectName: r.subjectName, marks: parseFloat(r.marks), totalMarks: parseFloat(r.totalMarks || 100) } });
        }
      }
      return NextResponse.json({ success: true, count: results.length });
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

    if (action === "exam") await db.exam.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
