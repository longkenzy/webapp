import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);


// GET /api/evaluation-configs/[id] - Get specific evaluation configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const config = await db.evaluationConfig.findUnique({
      where: { id },
      include: {
        options: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error fetching evaluation config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evaluation configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/evaluation-configs/[id] - Update evaluation configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { options, isActive } = body;

    // Update config
    await db.evaluationConfig.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
        updatedAt: dayjs().tz('Asia/Ho_Chi_Minh').toDate(),
      },
    });

    // Update options if provided
    if (options && Array.isArray(options)) {
      // Delete existing options
      await db.evaluationOption.deleteMany({
        where: { configId: id },
      });

      // Create new options
      await db.evaluationOption.createMany({
        data: options.map((option: { label: string; points: number }, index: number) => ({
          configId: id,
          label: option.label,
          points: option.points,
          order: index,
        })),
      });
    }

    // Fetch updated config with options
    const updatedConfig = await db.evaluationConfig.findUnique({
      where: { id },
      include: {
        options: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedConfig,
    });
  } catch (error) {
    console.error('Error updating evaluation config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update evaluation configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/evaluation-configs/[id] - Delete evaluation configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Soft delete by setting isActive to false
    const config = await db.evaluationConfig.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: dayjs().tz('Asia/Ho_Chi_Minh').toDate(),
      },
    });

    // Also soft delete all options
    await db.evaluationOption.updateMany({
      where: { configId: id },
      data: {
        isActive: false,
        updatedAt: dayjs().tz('Asia/Ho_Chi_Minh').toDate(),
      },
    });

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error deleting evaluation config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete evaluation configuration' },
      { status: 500 }
    );
  }
}
