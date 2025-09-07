import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!atLeast(session.user.role, Role.IT_STAFF)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Count open cases (RECEIVED, IN_PROGRESS) across all case types
  const [internalOpen, receivingOpen, deliveryOpen] = await Promise.all([
    db.internalCase.count({ where: { status: { in: ["RECEIVED", "IN_PROGRESS"] } } }),
    db.receivingCase.count({ where: { status: { in: ["RECEIVED", "IN_PROGRESS"] } } }),
    db.deliveryCase.count({ where: { status: { in: ["RECEIVED", "IN_PROGRESS"] } } })
  ]);
  
  // Count resolved cases (COMPLETED) across all case types
  const [internalResolved, receivingResolved, deliveryResolved] = await Promise.all([
    db.internalCase.count({ where: { status: "COMPLETED" } }),
    db.receivingCase.count({ where: { status: "COMPLETED" } }),
    db.deliveryCase.count({ where: { status: "COMPLETED" } })
  ]);
  
  const open = internalOpen + receivingOpen + deliveryOpen;
  const resolved = internalResolved + receivingResolved + deliveryResolved;

  return NextResponse.json({ open, resolved });
}


