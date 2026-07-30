import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "page";

    if (type === "page") {
      const items = await db.page.findMany({ orderBy: { createdAt: "desc" } });
      return NextResponse.json(items);
    }
    if (type === "news") {
      const items = await db.news.findMany({ orderBy: { publishedAt: "desc" } });
      return NextResponse.json(items);
    }
    if (type === "event") {
      const items = await db.event.findMany({ orderBy: { startDate: "desc" } });
      return NextResponse.json(items);
    }
    if (type === "gallery") {
      const items = await db.gallery.findMany({ orderBy: { createdAt: "desc" } });
      return NextResponse.json(items);
    }
    if (type === "banner") {
      const items = await db.banner.findMany({ orderBy: { position: "asc" } });
      return NextResponse.json(items);
    }
    if (type === "menu") {
      const items = await db.menu.findMany({ orderBy: { position: "asc" } });
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
    const { type: _, ...data } = body;

    if (type === "page") {
      const item = await db.page.create({ data: { ...data, slug: data.slug || data.title.toLowerCase().replace(/\s+/g, "-") } });
      return NextResponse.json(item, { status: 201 });
    }
    if (type === "news") {
      const item = await db.news.create({ data: { ...data, slug: data.slug || data.title.toLowerCase().replace(/\s+/g, "-"), publishedAt: new Date() } });
      return NextResponse.json(item, { status: 201 });
    }
    if (type === "event") {
      const item = await db.event.create({ data: { ...data, startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : null } });
      return NextResponse.json(item, { status: 201 });
    }
    if (type === "gallery") {
      const item = await db.gallery.create({ data });
      return NextResponse.json(item, { status: 201 });
    }
    if (type === "banner") {
      const item = await db.banner.create({ data });
      return NextResponse.json(item, { status: 201 });
    }
    if (type === "menu") {
      const item = await db.menu.create({ data });
      return NextResponse.json(item, { status: 201 });
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

    if (type === "page") await db.page.delete({ where: { id } });
    else if (type === "news") await db.news.delete({ where: { id } });
    else if (type === "event") await db.event.delete({ where: { id } });
    else if (type === "gallery") await db.gallery.delete({ where: { id } });
    else if (type === "banner") await db.banner.delete({ where: { id } });
    else if (type === "menu") await db.menu.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
