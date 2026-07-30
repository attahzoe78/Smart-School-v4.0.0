import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "reset-system") {
      // Delete all data but keep the system installed
      const tableDeletionOrder = [
        "generatedCertificate", "bookIssue", "book", "downloadContent",
        "homeworkSubmission", "homework", "examResult", "exam",
        "feePayment", "invoice", "feeType",
        "studentAttendance", "staffAttendance", "studentTimeline",
        "bookIssue", "leaveRequest", "payroll",
        "admissionEnquiry", "followUp", "visitor", "phoneCallLog",
        "postalDispatch", "postalReceive", "complain",
        "calendarEvent", "task", "page", "news", "event", "gallery",
        "banner", "menu", "mediaFile",
        "hostelRoom", "hostel", "transportRoute", "house",
        "classTeacher", "subjectTeacher",
        "student", "parent", "staff",
        "section", "subject", "class",
        "department", "designation", "leaveType",
        "certificateTemplate", "idCardTemplate",
        "user", "role",
        "session",
      ];

      for (const table of tableDeletionOrder) {
        try {
          // @ts-ignore - dynamic model access
          await db[table].deleteMany({});
        } catch (e) {
          // Table might not exist or be empty, continue
        }
      }

      // Reset system settings to uninstalled
      await db.systemSetting.deleteMany({});

      return NextResponse.json({
        success: true,
        message: "System has been reset. You will need to reinstall.",
      });
    }

    if (action === "clear-demo-data") {
      // Only clear demo data, keep settings and admin
      const tableDeletionOrder = [
        "generatedCertificate", "bookIssue", "book", "downloadContent",
        "homeworkSubmission", "homework", "examResult", "exam",
        "feePayment", "invoice", "feeType",
        "studentAttendance", "staffAttendance", "studentTimeline",
        "leaveRequest", "payroll",
        "admissionEnquiry", "followUp", "visitor", "phoneCallLog",
        "postalDispatch", "postalReceive", "complain",
        "calendarEvent", "task", "page", "news", "event", "gallery",
        "banner", "menu", "mediaFile",
        "hostelRoom", "hostel", "transportRoute",
        "classTeacher", "subjectTeacher",
        "student", "parent", "staff",
      ];

      for (const table of tableDeletionOrder) {
        try {
          // @ts-ignore
          await db[table].deleteMany({});
        } catch (e) {}
      }

      return NextResponse.json({
        success: true,
        message: "Demo data cleared. System settings and admin account preserved.",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    console.error("Reset error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
