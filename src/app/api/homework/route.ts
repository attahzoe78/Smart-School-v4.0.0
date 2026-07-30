import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "list";

    if (action === "list") {
      const homework = await db.homework.findMany({
        orderBy: { homeworkDate: "desc" }, take: 100,
        include: { class: { select: { name: true } }, section: { select: { name: true } }, subject: { select: { name: true } }, _count: { select: { submissions: true } } },
      });
      return NextResponse.json(homework);
    }
    if (action === "single") {
      const id = searchParams.get("id");
      const hw = await db.homework.findUnique({
        where: { id },
        include: { class: true, section: true, subject: true, submissions: { include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } } } },
      });
      return NextResponse.json(hw);
    }
    if (action === "downloads") {
      const downloads = await db.downloadContent.findMany({
        orderBy: { uploadDate: "desc" }, take: 100,
        include: { class: { select: { name: true } }, subject: { select: { name: true } } },
      });
      return NextResponse.json(downloads);
    }
    return NextResponse.json([]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { action: _, ...data } = body;
      const hw = await db.homework.create({
        data: { ...data, homeworkDate: new Date(), submissionDate: new Date(data.submissionDate) },
      });
      return NextResponse.json(hw, { status: 201 });
    }
    if (action === "evaluate") {
      const { submissionId, marks, remarks } = body;
      const sub = await db.homeworkSubmission.update({
        where: { id: submissionId },
        data: { status: "Evaluated", marks: parseFloat(marks), remarks, evaluatedAt: new Date() },
      });
      return NextResponse.json(sub);
    }
    if (action === "upload-content") {
      const { action: _, ...data } = body;
      const dc = await db.downloadContent.create({
        data: {
          title: data.title,
          description: data.description || null,
          type: data.type || "Notes",
          classId: data.classId || null,
          sectionId: data.sectionId || null,
          subjectId: data.subjectId || null,
          fileUrl: data.fileUrl,
        },
      });
      return NextResponse.json(dc, { status: 201 });
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
    if (action === "download") {
      await db.downloadContent.delete({ where: { id } });
    } else {
      await db.homework.delete({ where: { id } });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
