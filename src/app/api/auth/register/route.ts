import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/auth/validators";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return NextResponse.json({ error: "Email exists" }, { status: 409 });
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const username = parsed.data.email.split('@')[0]; // Generate username from email
  const created = await db.user.create({ data: { email: parsed.data.email, username, password: passwordHash, name: parsed.data.name } });
  return NextResponse.json({ id: created.id, email: created.email }, { status: 201 });
}


