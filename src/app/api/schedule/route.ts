import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await db.schedule.findMany({ where: { userId: session.user.id } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const created = await db.schedule.create({
    data: {
      userId: session.user.id,
      title: data.title,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
    },
  });
  return NextResponse.json(created, { status: 201 });
}


