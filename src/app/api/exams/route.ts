import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sanitizeData } from "@/lib/format";

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
        where, orderBy: [{ studentId: "asc" }, { subjectName: "asc" }], take: 500,
        include: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true, currentClass: { select: { name: true } } } } },
      });
      return NextResponse.json(results);
    }
    return NextResponse.json([]);
  } catch (e: any) {
    console.error("Exams GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "create-exam") {
      const { action: _, ...data } = body;
      const cleaned = sanitizeData(data);
      const exam = await db.exam.create({
        data: {
          ...cleaned,
          startDate: new Date(cleaned.startDate),
          endDate: cleaned.endDate ? new Date(cleaned.endDate) : null,
        },
      });
      return NextResponse.json(exam, { status: 201 });
    }

    if (action === "save-results") {
      const { examId, results } = body;
      if (!examId) return NextResponse.json({ error: "examId is required" }, { status: 400 });
      if (!Array.isArray(results) || results.length === 0) {
        return NextResponse.json({ error: "No results to save" }, { status: 400 });
      }

      let saved = 0;
      let updated = 0;
      for (const r of results) {
        if (!r.studentId || !r.subjectName || r.marks === "" || r.marks === null || r.marks === undefined) continue;
        const marks = parseFloat(r.marks);
        const totalMarks = parseFloat(r.totalMarks) || 100;
        if (isNaN(marks)) continue;

        const existing = await db.examResult.findFirst({
          where: { examId, studentId: r.studentId, subjectName: r.subjectName },
        });
        if (existing) {
          await db.examResult.update({
            where: { id: existing.id },
            data: { marks, totalMarks },
          });
          updated++;
        } else {
          await db.examResult.create({
            data: { examId, studentId: r.studentId, subjectName: r.subjectName, marks, totalMarks },
          });
          saved++;
        }
      }
      return NextResponse.json({ success: true, saved, updated, total: saved + updated });
    }

    if (action === "delete-result") {
      const { id } = body;
      await db.examResult.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    console.error("Exams POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (action === "exam") {
      // Delete all related results first
      await db.examResult.deleteMany({ where: { examId: id } });
      await db.exam.delete({ where: { id } });
    } else if (action === "result") {
      await db.examResult.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Exams DELETE error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
