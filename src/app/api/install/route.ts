import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const settings = await db.systemSetting.findFirst();
    return NextResponse.json({
      installed: settings?.isInstalled || false,
      schoolName: settings?.schoolName,
    });
  } catch (e: any) {
    return NextResponse.json({ installed: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = await db.systemSetting.findFirst();

    if (settings?.isInstalled) {
      return NextResponse.json({ error: "System is already installed" }, { status: 400 });
    }

    const {
      schoolName, schoolCode, tagLine, phone, email, address, city, state,
      country, currency, currencyCode, language, timezone,
      adminUsername, adminEmail, adminPassword, sessionName,
    } = body;

    if (!schoolName || !adminUsername || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const data = {
      schoolName,
      schoolCode: schoolCode || null,
      tagLine: tagLine || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      city: city || null,
      state: state || "Plateau",
      country: country || "Nigeria",
      currency: currency || "₦",
      currencyCode: currencyCode || "NGN",
      language: language || "English",
      timezone: timezone || "Africa/Lagos",
      isInstalled: true,
      startDate: new Date(),
    };

    let settingRecord;
    if (settings) {
      settingRecord = await db.systemSetting.update({ where: { id: settings.id }, data });
    } else {
      settingRecord = await db.systemSetting.create({ data });
    }

    const session = await db.session.create({
      data: { session: sessionName || "2024/2025", isActive: true, isDefault: true },
    });

    await db.systemSetting.update({
      where: { id: settingRecord.id },
      data: { currentSessionId: session.id },
    });

    const superAdminRole = await db.role.create({
      data: { name: "Super Admin", description: "Full system access", permissions: JSON.stringify(["*"]), isActive: true, isSystem: true },
    });

    const defaultRoles = [
      { name: "Admin", description: "School administration" },
      { name: "Accountant", description: "Fees & payroll management" },
      { name: "Teacher", description: "Teaching staff" },
      { name: "Receptionist", description: "Front office" },
      { name: "Librarian", description: "Library management" },
      { name: "Parent", description: "Parent portal" },
      { name: "Student", description: "Student portal" },
    ];
    for (const r of defaultRoles) {
      await db.role.create({ data: { ...r, permissions: JSON.stringify([]), isSystem: true } });
    }

    const departments = ["Academic", "Administration", "Finance", "Library", "Sports", "Hostel"];
    for (const d of departments) {
      await db.department.create({ data: { name: d, description: `${d} Department` } });
    }

    const designations = ["Principal", "Vice Principal", "Head Teacher", "Teacher", "Accountant", "Librarian", "Clerk", "Driver", "Security"];
    for (const d of designations) {
      await db.designation.create({ data: { name: d, description: `${d} designation` } });
    }

    const houses = [
      { name: "Red House", color: "#dc2626" },
      { name: "Blue House", color: "#2563eb" },
      { name: "Green House", color: "#16a34a" },
      { name: "Yellow House", color: "#ca8a04" },
    ];
    for (const h of houses) {
      await db.house.create({ data: h });
    }

    const classes = [
      "Creche", "Nursery 1", "Nursery 2", "KG 1", "KG 2",
      "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
      "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3",
    ];
    for (const c of classes) {
      const cls = await db.class.create({ data: { name: c, sessionId: session.id } });
      await db.section.createMany({
        data: [
          { name: "A", classId: cls.id, capacity: 40 },
          { name: "B", classId: cls.id, capacity: 40 },
        ],
      });
    }

    const subjects = [
      "Mathematics", "English Language", "Basic Science", "Social Studies",
      "Civic Education", "Computer Studies", "Agricultural Science",
      "Christian Religious Studies", "Islamic Religious Studies",
      "French", "Hausa", "Yoruba", "Igbo",
      "Physics", "Chemistry", "Biology", "Further Mathematics",
      "Geography", "Economics", "Government", "Literature in English",
      "Technical Drawing", "Fine Arts", "Music", "Physical Education",
      "Home Economics", "Business Studies", "Accounting", "Commerce",
    ];
    for (const s of subjects) {
      await db.subject.create({ data: { name: s } });
    }

    const admin = await db.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password: hashPassword(adminPassword),
        role: "Super Admin",
        roleId: superAdminRole.id,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Installation completed successfully",
      adminId: admin.id,
    });
  } catch (e: any) {
    console.error("Install error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
