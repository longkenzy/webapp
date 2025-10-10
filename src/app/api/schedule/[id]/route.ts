import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);


const updateScheduleSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  company: z.string().optional(),
  color: z.string().optional(),
  location: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const schedule = await db.schedule.findFirst({
      where: {
        id: id,
        OR: [
          { userId: session.user.id },
          { isPublic: true }
        ]
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

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Check if schedule exists and user owns it
    const existingSchedule = await db.schedule.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!existingSchedule) {
      return NextResponse.json({ error: "Không tìm thấy sự kiện hoặc không có quyền truy cập" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateScheduleSchema.parse(body);

    const updateData: any = { ...validatedData };
    if (validatedData.startAt) {
      updateData.startAt = dayjs(validatedData.startAt).tz('Asia/Ho_Chi_Minh').toDate();
    }
    if (validatedData.endAt) {
      updateData.endAt = dayjs(validatedData.endAt).tz('Asia/Ho_Chi_Minh').toDate();
    }
    if (validatedData.company) {
      updateData.location = validatedData.company;
    }
    // Remove company from updateData as it's not in the database schema
    delete updateData.company;

    const schedule = await db.schedule.update({
      where: { id: id },
      data: updateData,
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

    return NextResponse.json(schedule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("Error updating schedule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Check if schedule exists and user owns it
    const existingSchedule = await db.schedule.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!existingSchedule) {
      return NextResponse.json({ error: "Không tìm thấy sự kiện hoặc không có quyền truy cập" }, { status: 404 });
    }

    await db.schedule.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
