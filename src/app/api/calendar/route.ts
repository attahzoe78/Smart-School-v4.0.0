import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "events";

    if (action === "events") {
      const start = searchParams.get("start");
      const end = searchParams.get("end");
      const where: any = { isActive: true };
      if (start && end) {
        where.startDate = { gte: new Date(start) };
      }
      const events = await db.calendarEvent.findMany({ where, orderBy: { startDate: "asc" }, take: 100 });
      return NextResponse.json(events);
    }
    if (action === "tasks") {
      const tasks = await db.task.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
      return NextResponse.json(tasks);
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

    if (action === "create-event") {
      const { action: _, ...data } = body;
      const event = await db.calendarEvent.create({
        data: { ...data, startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : null },
      });
      return NextResponse.json(event, { status: 201 });
    }
    if (action === "create-task") {
      const { action: _, ...data } = body;
      const task = await db.task.create({
        data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : null },
      });
      return NextResponse.json(task, { status: 201 });
    }
    if (action === "update-task") {
      const { id, status } = body;
      const task = await db.task.update({ where: { id }, data: { status } });
      return NextResponse.json(task);
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

    if (action === "event") await db.calendarEvent.delete({ where: { id } });
    else if (action === "task") await db.task.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
