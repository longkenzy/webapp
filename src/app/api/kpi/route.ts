import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!atLeast(session.user.role, Role.IT_STAFF)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const open = await db.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } });
  const resolved = await db.ticket.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } });

  return NextResponse.json({ open, resolved });
}


