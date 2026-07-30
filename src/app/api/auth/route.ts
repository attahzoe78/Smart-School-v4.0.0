import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { getFullName } from "@/lib/format";

export async function GET() {
  try {
    const settings = await db.systemSetting.findFirst();
    if (!settings || !settings.isInstalled) {
      return NextResponse.json({ installed: false });
    }
    return NextResponse.json({
      installed: true,
      schoolName: settings.schoolName,
      logo: settings.logo,
      currency: settings.currency,
    });
  } catch (e: any) {
    return NextResponse.json({ installed: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "login") {
      const { username, password } = body;
      const user = await db.user.findUnique({
        where: { username },
        include: {
          staff: { select: { firstName: true, lastName: true, middleName: true, photo: true } },
          student: { select: { firstName: true, lastName: true, middleName: true, photo: true } },
          parent: { select: { firstName: true, lastName: true, middleName: true, photo: true } },
        },
      });
      if (!user || !user.isActive) {
        return NextResponse.json({ error: "Invalid credentials or account disabled" }, { status: 401 });
      }
      if (!verifyPassword(password, user.password)) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      await db.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

      let name = user.username;
      let image: string | null = null;
      if (user.staff) { name = getFullName(user.staff); image = user.staff.photo; }
      else if (user.student) { name = getFullName(user.student); image = user.student.photo; }
      else if (user.parent) { name = getFullName(user.parent); image = user.parent.photo; }

      const response = NextResponse.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name,
        image,
        staffId: user.staffId,
        studentId: user.studentId,
        parentId: user.parentId,
      });
      response.cookies.set("ss_session", user.id, {
        httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/",
      });
      return response;
    }

    if (action === "logout") {
      const userId = body.userId;
      if (userId) {
        await db.user.update({ where: { id: userId }, data: { lastLogout: new Date() } }).catch(() => {});
      }
      const response = NextResponse.json({ success: true });
      response.cookies.delete("ss_session");
      return response;
    }

    if (action === "status") {
      const settings = await db.systemSetting.findFirst();
      return NextResponse.json({
        installed: settings?.isInstalled || false,
        schoolName: settings?.schoolName,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
