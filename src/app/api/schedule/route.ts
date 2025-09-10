import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const createScheduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  company: z.string().optional(),
  color: z.string().optional().default("#3b82f6"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const whereClause: any = {
      OR: [
        { userId: session.user.id },
        { isPublic: true }
      ]
    };

    if (start && end) {
      whereClause.startAt = {
        gte: new Date(start),
        lte: new Date(end)
      };
    }

    const schedules = await db.schedule.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      orderBy: { startAt: "asc" }
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createScheduleSchema.parse(body);

    // Kiểm tra thời gian bắt đầu không được trong quá khứ
    const startDate = new Date(validatedData.startAt);
    const endDate = new Date(validatedData.endAt);
    const now = new Date();

    if (startDate < now) {
      return NextResponse.json({ error: "Không thể tạo sự kiện cho thời gian trong quá khứ" }, { status: 400 });
    }

    if (endDate <= startDate) {
      return NextResponse.json({ error: "Thời gian kết thúc phải sau thời gian bắt đầu" }, { status: 400 });
    }

    const schedule = await db.schedule.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startAt: new Date(validatedData.startAt),
        endAt: new Date(validatedData.endAt),
        color: validatedData.color,
        location: validatedData.company || "",
        allDay: false,
        isPublic: true,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("Error creating schedule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}