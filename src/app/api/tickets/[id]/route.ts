import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const t = await db.ticket.findUnique({ where: { id } });
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!atLeast(session.user.role, Role.IT_STAFF) && t.requesterId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(t);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const { id } = await params;
  const t = await db.ticket.findUnique({ where: { id } });
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const canEdit = atLeast(session.user.role, Role.IT_STAFF) || t.requesterId === session.user.id;
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const updated = await db.ticket.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!atLeast(session.user.role, Role.IT_STAFF)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await db.ticket.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


