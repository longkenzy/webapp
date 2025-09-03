import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const where = atLeast(session.user.role, Role.IT_STAFF)
    ? {}
    : { requesterId: session.user.id };
  const tickets = await db.ticket.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const created = await db.ticket.create({
    data: {
      title: body.title,
      description: body.description,
      priority: body.priority,
      requesterId: session.user.id,
      assigneeId: body.assigneeId ?? null,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}


