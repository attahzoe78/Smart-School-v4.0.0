import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const roles = await db.role.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { users: true } } },
    });
    return NextResponse.json(roles);
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
      const role = await db.role.create({ data: { ...data, permissions: JSON.stringify(data.permissions || []) } });
      return NextResponse.json(role, { status: 201 });
    }
    if (action === "update") {
      const { id, name, description, permissions, isActive } = body;
      const role = await db.role.update({
        where: { id },
        data: { name, description, permissions: JSON.stringify(permissions || []), isActive },
      });
      return NextResponse.json(role);
    }
    if (action === "toggle-module") {
      // Enable/disable modules - stored in system settings as JSON
      const settings = await db.systemSetting.findFirst();
      if (settings) {
        const modules = body.modules;
        await db.systemSetting.update({ where: { id: settings.id }, data: { theme: JSON.stringify(modules) } });
      }
      return NextResponse.json({ success: true });
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
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const role = await db.role.findUnique({ where: { id } });
    if (role?.isSystem) return NextResponse.json({ error: "System roles cannot be deleted" }, { status: 400 });
    await db.role.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
