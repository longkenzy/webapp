import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EvaluationType, EvaluationCategory } from '@prisma/client';

// POST /api/evaluation-configs/seed - Seed default evaluation configurations
export async function POST(request: NextRequest) {
  try {
    // Check if configs already exist
    const existingConfigs = await db.evaluationConfig.count();
    if (existingConfigs > 0) {
      return NextResponse.json({
        success: false,
        error: 'Evaluation configurations already exist',
      });
    }

    // Default configurations
    const defaultConfigs = [
      // User configurations
      {
        type: EvaluationType.USER,
        category: EvaluationCategory.DIFFICULTY,
        options: [
          { label: 'Rất dễ', points: 1 },
          { label: 'Dễ', points: 2 },
          { label: 'Trung bình', points: 3 },
          { label: 'Khó', points: 4 },
          { label: 'Rất khó', points: 5 },
        ],
      },
      {
        type: EvaluationType.USER,
        category: EvaluationCategory.TIME,
        options: [
          { label: '< 30 phút', points: 1 },
          { label: '30-60 phút', points: 2 },
          { label: '1-2 giờ', points: 3 },
          { label: '2-4 giờ', points: 4 },
          { label: '> 4 giờ', points: 5 },
        ],
      },
      {
        type: EvaluationType.USER,
        category: EvaluationCategory.IMPACT,
        options: [
          { label: 'Rất thấp', points: 1 },
          { label: 'Thấp', points: 2 },
          { label: 'Trung bình', points: 3 },
          { label: 'Cao', points: 4 },
          { label: 'Rất cao', points: 5 },
        ],
      },
      {
        type: EvaluationType.USER,
        category: EvaluationCategory.URGENCY,
        options: [
          { label: 'Rất thấp', points: 1 },
          { label: 'Thấp', points: 2 },
          { label: 'Trung bình', points: 3 },
          { label: 'Cao', points: 4 },
          { label: 'Rất cao', points: 5 },
        ],
      },
      {
        type: EvaluationType.USER,
        category: EvaluationCategory.FORM,
        options: [
          { label: 'Offsite/Remote', points: 1 },
          { label: 'Onsite', points: 2 },
        ],
      },
      // Admin configurations
      {
        type: EvaluationType.ADMIN,
        category: EvaluationCategory.DIFFICULTY,
        options: [
          { label: 'Rất dễ', points: 1 },
          { label: 'Dễ', points: 2 },
          { label: 'Trung bình', points: 3 },
          { label: 'Khó', points: 4 },
          { label: 'Rất khó', points: 5 },
        ],
      },
      {
        type: EvaluationType.ADMIN,
        category: EvaluationCategory.TIME,
        options: [
          { label: '< 30 phút', points: 1 },
          { label: '30-60 phút', points: 2 },
          { label: '1-2 giờ', points: 3 },
          { label: '2-4 giờ', points: 4 },
          { label: '> 4 giờ', points: 5 },
        ],
      },
      {
        type: EvaluationType.ADMIN,
        category: EvaluationCategory.IMPACT,
        options: [
          { label: 'Rất thấp', points: 1 },
          { label: 'Thấp', points: 2 },
          { label: 'Trung bình', points: 3 },
          { label: 'Cao', points: 4 },
          { label: 'Rất cao', points: 5 },
        ],
      },
      {
        type: EvaluationType.ADMIN,
        category: EvaluationCategory.URGENCY,
        options: [
          { label: 'Rất thấp', points: 1 },
          { label: 'Thấp', points: 2 },
          { label: 'Trung bình', points: 3 },
          { label: 'Cao', points: 4 },
          { label: 'Rất cao', points: 5 },
        ],
      },
    ];

    // Create all configurations
    const createdConfigs = [];
    for (const configData of defaultConfigs) {
      const config = await db.evaluationConfig.create({
        data: {
          type: configData.type,
          category: configData.category,
          options: {
            create: configData.options.map((option, index) => ({
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
      createdConfigs.push(config);
    }

    return NextResponse.json({
      success: true,
      data: createdConfigs,
      message: 'Default evaluation configurations created successfully',
    });
  } catch (error) {
    console.error('Error seeding evaluation configs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed evaluation configurations' },
      { status: 500 }
    );
  }
}
