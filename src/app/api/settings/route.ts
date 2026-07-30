import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";

    if (type === "all") {
      const [classes, sections, subjects, sessions, departments, designations, houses, hostels, rooms, routes, leaveTypes, settings] = await Promise.all([
        db.class.findMany({ include: { sections: true, _count: { select: { students: true } } }, orderBy: { name: "asc" } }),
        db.section.findMany({ include: { class: { select: { name: true } } } }),
        db.subject.findMany({ orderBy: { name: "asc" } }),
        db.session.findMany({ orderBy: { createdAt: "desc" } }),
        db.department.findMany({ orderBy: { name: "asc" } }),
        db.designation.findMany({ orderBy: { name: "asc" } }),
        db.house.findMany(),
        db.hostel.findMany({ include: { _count: { select: { rooms: true } } } }),
        db.hostelRoom.findMany({ include: { hostel: { select: { name: true } } } }),
        db.transportRoute.findMany(),
        db.leaveType.findMany(),
        db.systemSetting.findFirst(),
      ]);
      return NextResponse.json({
        classes, sections, subjects, sessions, departments, designations,
        houses, hostels, rooms, routes, leaveTypes, settings,
      });
    }

    if (type === "classes") return NextResponse.json(await db.class.findMany({ include: { sections: true, _count: { select: { students: true } } }, orderBy: { name: "asc" } }));
    if (type === "subjects") return NextResponse.json(await db.subject.findMany({ orderBy: { name: "asc" } }));
    if (type === "departments") return NextResponse.json(await db.department.findMany({ orderBy: { name: "asc" } }));
    if (type === "designations") return NextResponse.json(await db.designation.findMany({ orderBy: { name: "asc" } }));
    if (type === "sessions") return NextResponse.json(await db.session.findMany({ orderBy: { createdAt: "desc" } }));
    if (type === "houses") return NextResponse.json(await db.house.findMany());
    if (type === "hostels") return NextResponse.json(await db.hostel.findMany({ include: { rooms: true } }));
    if (type === "routes") return NextResponse.json(await db.transportRoute.findMany());
    if (type === "leave-types") return NextResponse.json(await db.leaveType.findMany());
    if (type === "settings") return NextResponse.json(await db.systemSetting.findFirst());

    return NextResponse.json({});
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type;
    const { type: _, ...data } = body;

    let result;
    if (type === "class") {
      const session = await db.session.findFirst({ where: { isDefault: true } });
      result = await db.class.create({ data: { name: data.name, sessionId: session?.id } });
      // Create default sections
      await db.section.createMany({ data: [{ name: "A", classId: result.id, capacity: 40 }, { name: "B", classId: result.id, capacity: 40 }] });
    }
    else if (type === "section") result = await db.section.create({ data });
    else if (type === "subject") result = await db.subject.create({ data });
    else if (type === "department") result = await db.department.create({ data });
    else if (type === "designation") result = await db.designation.create({ data });
    else if (type === "session") result = await db.session.create({ data });
    else if (type === "house") result = await db.house.create({ data });
    else if (type === "hostel") result = await db.hostel.create({ data });
    else if (type === "hostel-room") result = await db.hostelRoom.create({ data: { ...data, fee: parseFloat(data.fee || 0) } });
    else if (type === "transport-route") result = await db.transportRoute.create({ data: { ...data, fare: parseFloat(data.fare || 0) } });
    else if (type === "leave-type") result = await db.leaveType.create({ data });
    else if (type === "settings") {
      const settings = await db.systemSetting.findFirst();
      if (settings) result = await db.systemSetting.update({ where: { id: settings.id }, data });
      else result = await db.systemSetting.create({ data: { ...data, isInstalled: true } });
    }
    else return NextResponse.json({ error: "Unknown type" }, { status: 400 });

    return NextResponse.json(result, { status: 201 });
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

    if (type === "class") await db.class.delete({ where: { id } });
    else if (type === "section") await db.section.delete({ where: { id } });
    else if (type === "subject") await db.subject.delete({ where: { id } });
    else if (type === "department") await db.department.delete({ where: { id } });
    else if (type === "designation") await db.designation.delete({ where: { id } });
    else if (type === "session") await db.session.delete({ where: { id } });
    else if (type === "house") await db.house.delete({ where: { id } });
    else if (type === "hostel") await db.hostel.delete({ where: { id } });
    else if (type === "hostel-room") await db.hostelRoom.delete({ where: { id } });
    else if (type === "transport-route") await db.transportRoute.delete({ where: { id } });
    else if (type === "leave-type") await db.leaveType.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
