import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!atLeast(session.user.role, Role.IT_STAFF)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const partners = await db.partner.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(partners);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!atLeast(session.user.role, Role.IT_LEAD)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const data = await req.json();
  const created = await db.partner.create({ data });
  return NextResponse.json(created, { status: 201 });
}


