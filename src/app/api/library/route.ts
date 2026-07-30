import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "books";

    if (action === "books") {
      const books = await db.book.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
      return NextResponse.json(books);
    }
    if (action === "issues") {
      const issues = await db.bookIssue.findMany({
        orderBy: { issueDate: "desc" }, take: 100,
        include: { book: { select: { title: true, bookNo: true, author: true } }, student: { select: { firstName: true, lastName: true, admissionNo: true } } },
      });
      return NextResponse.json(issues);
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

    if (action === "add-book") {
      const { action: _, ...data } = body;
      const count = await db.book.count();
      const book = await db.book.create({
        data: { ...data, bookNo: data.bookNo || `BK-${String(count + 1).padStart(4, "0")}`, available: data.quantity || 1, quantity: data.quantity || 1, price: parseFloat(data.price || 0) },
      });
      return NextResponse.json(book, { status: 201 });
    }
    if (action === "issue") {
      const { bookId, studentId, dueDate } = body;
      const book = await db.book.findUnique({ where: { id: bookId } });
      if (!book || book.available <= 0) return NextResponse.json({ error: "Book not available" }, { status: 400 });

      const issue = await db.bookIssue.create({
        data: { bookId, studentId, issueDate: new Date(), dueDate: new Date(dueDate) },
      });
      await db.book.update({ where: { id: bookId }, data: { available: { decrement: 1 } } });
      return NextResponse.json(issue, { status: 201 });
    }
    if (action === "return") {
      const { issueId, fine } = body;
      const issue = await db.bookIssue.update({
        where: { id: issueId },
        data: { returnDate: new Date(), status: "Returned", fine: parseFloat(fine || 0) },
      });
      await db.book.update({ where: { id: issue.bookId }, data: { available: { increment: 1 } } });
      return NextResponse.json(issue);
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (data.price) data.price = parseFloat(data.price);
    if (data.quantity) {
      const book = await db.book.findUnique({ where: { id } });
      if (book) data.available = (data.quantity - book.quantity) + book.available;
    }
    const book = await db.book.update({ where: { id }, data });
    return NextResponse.json(book);
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

    if (action === "book") await db.book.delete({ where: { id } });
    else if (action === "issue") await db.bookIssue.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
