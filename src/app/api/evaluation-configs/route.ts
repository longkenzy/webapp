import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EvaluationType, EvaluationCategory } from '@prisma/client';

// GET /api/evaluation-configs - Get all evaluation configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as EvaluationType;
    const category = searchParams.get('category') as EvaluationCategory;

    const where: { isActive: boolean; type?: EvaluationType; category?: EvaluationCategory } = {
      isActive: true,
    };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    const configs = await db.evaluationConfig.findMany({
      where,
      include: {
        options: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [
        { type: 'asc' },
        { category: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error('Error fetching evaluation configs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evaluation configurations' },
      { status: 500 }
    );
  }
}

// POST /api/evaluation-configs - Create new evaluation configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, category, options } = body;

    if (!type || !category || !options || !Array.isArray(options)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if config already exists
    const existingConfig = await db.evaluationConfig.findFirst({
      where: {
        type,
        category,
        isActive: true,
      },
    });

    if (existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuration already exists for this type and category' },
        { status: 409 }
      );
    }

    // Create config with options
    const config = await db.evaluationConfig.create({
      data: {
        type,
        category,
        options: {
          create: options.map((option: { label: string; points: number }, index: number) => ({
            label: option.label,
            points: option.points,
            order: index,
          })),
        },
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error creating evaluation config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create evaluation configuration' },
      { status: 500 }
    );
  }
}
