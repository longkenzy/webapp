import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  // staff can add on any ticket, user only on own tickets
  const t = await db.ticket.findUnique({ where: { id: data.ticketId } });
  if (!t) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (!atLeast(session.user.role, Role.IT_STAFF) && t.requesterId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const wl = await db.worklog.create({ data: { ticketId: data.ticketId, userId: session.user.id, duration: data.duration } });
  return NextResponse.json(wl, { status: 201 });
}


