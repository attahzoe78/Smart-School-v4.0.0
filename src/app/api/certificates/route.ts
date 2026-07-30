import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "templates";

    if (action === "templates") {
      const [certs, ids] = await Promise.all([
        db.certificateTemplate.findMany(),
        db.idCardTemplate.findMany(),
      ]);
      return NextResponse.json({ certificates: certs, idCards: ids });
    }
    if (action === "generated") {
      const items = await db.generatedCertificate.findMany({
        orderBy: { generatedDate: "desc" }, take: 100,
        include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } },
      });
      return NextResponse.json(items);
    }
    return NextResponse.json({});
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "generate") {
      const { studentId, templateId, type } = body;
      const student = await db.student.findUnique({
        where: { id: studentId },
        include: { currentClass: true, section: true, parent: true, session: true },
      });
      if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

      const certNo = generateId(type === "id-card" ? "IDC" : "CERT");
      if (type === "id-card") {
        // Just generate and return
        return NextResponse.json({ certNo, student, type: "id-card" });
      }
      // Generate certificate
      const gen = await db.generatedCertificate.create({
        data: { studentId, templateId, certificateNo: certNo, generatedBy: body.generatedBy },
      });
      return NextResponse.json({ ...gen, student, type: "certificate" });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
