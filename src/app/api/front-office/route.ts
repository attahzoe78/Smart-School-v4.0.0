import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "enquiry";

    if (type === "enquiry") {
      const enquiries = await db.admissionEnquiry.findMany({
        include: { followUps: { orderBy: { date: "desc" } } },
        orderBy: { createdAt: "desc" }, take: 100,
      });
      return NextResponse.json(enquiries);
    }
    if (type === "visitor") {
      const visitors = await db.visitor.findMany({ orderBy: { checkIn: "desc" }, take: 100 });
      return NextResponse.json(visitors);
    }
    if (type === "call") {
      const calls = await db.phoneCallLog.findMany({ orderBy: { date: "desc" }, take: 100 });
      return NextResponse.json(calls);
    }
    if (type === "postal-dispatch") {
      const items = await db.postalDispatch.findMany({ orderBy: { date: "desc" }, take: 100 });
      return NextResponse.json(items);
    }
    if (type === "postal-receive") {
      const items = await db.postalReceive.findMany({ orderBy: { date: "desc" }, take: 100 });
      return NextResponse.json(items);
    }
    if (type === "complain") {
      const items = await db.complain.findMany({ orderBy: { date: "desc" }, take: 100 });
      return NextResponse.json(items);
    }
    return NextResponse.json([]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type;

    if (type === "enquiry") {
      const { type: _, ...data } = body;
      const count = await db.admissionEnquiry.count();
      const enquiry = await db.admissionEnquiry.create({
        data: { ...data, enquiryNo: `ENQ-${String(count + 1).padStart(4, "0")}`, date: data.date ? new Date(data.date) : new Date() },
      });
      return NextResponse.json(enquiry, { status: 201 });
    }
    if (type === "followup") {
      const { type: _, ...data } = body;
      const followUp = await db.followUp.create({ data: { ...data, date: new Date(), followUpDate: new Date(data.followUpDate) } });
      return NextResponse.json(followUp, { status: 201 });
    }
    if (type === "visitor") {
      const { type: _, ...data } = body;
      const visitor = await db.visitor.create({ data: { ...data, checkIn: data.checkIn ? new Date(data.checkIn) : new Date() } });
      return NextResponse.json(visitor, { status: 201 });
    }
    if (type === "visitor-checkout") {
      const visitor = await db.visitor.update({ where: { id: body.id }, data: { checkOut: new Date() } });
      return NextResponse.json(visitor);
    }
    if (type === "call") {
      const { type: _, ...data } = body;
      const call = await db.phoneCallLog.create({ data: { ...data, date: data.date ? new Date(data.date) : new Date() } });
      return NextResponse.json(call, { status: 201 });
    }
    if (type === "postal-dispatch") {
      const { type: _, ...data } = body;
      const item = await db.postalDispatch.create({ data: { ...data, date: data.date ? new Date(data.date) : new Date() } });
      return NextResponse.json(item, { status: 201 });
    }
    if (type === "postal-receive") {
      const { type: _, ...data } = body;
      const item = await db.postalReceive.create({ data: { ...data, date: data.date ? new Date(data.date) : new Date() } });
      return NextResponse.json(item, { status: 201 });
    }
    if (type === "complain") {
      const { type: _, ...data } = body;
      const count = await db.complain.count();
      const complain = await db.complain.create({
        data: { ...data, complainNo: `CMP-${String(count + 1).padStart(4, "0")}`, date: data.date ? new Date(data.date) : new Date() },
      });
      return NextResponse.json(complain, { status: 201 });
    }
    if (type === "complain-update") {
      const { id, status, resolution } = body;
      const complain = await db.complain.update({
        where: { id }, data: { status, resolution, resolvedAt: status === "Resolved" ? new Date() : null },
      });
      return NextResponse.json(complain);
    }
    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");
    if (!id || !type) return NextResponse.json({ error: "ID and type required" }, { status: 400 });

    if (type === "enquiry") await db.admissionEnquiry.delete({ where: { id } });
    else if (type === "visitor") await db.visitor.delete({ where: { id } });
    else if (type === "call") await db.phoneCallLog.delete({ where: { id } });
    else if (type === "complain") await db.complain.delete({ where: { id } });
    else if (type === "postal-dispatch") await db.postalDispatch.delete({ where: { id } });
    else if (type === "postal-receive") await db.postalReceive.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
