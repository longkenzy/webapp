import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EvaluationType, EvaluationCategory } from '@prisma/client';

export async function POST() {
  try {
    console.log('=== Seeding Evaluation Configs ===');

    // Define sample data for User evaluations
    const userSampleData = [
      // User Difficulty
      {
        type: EvaluationType.USER,
        category: EvaluationCategory.DIFFICULTY,
        options: [
          { label: 'Rất dễ', points: 1 },
          { label: 'Dễ', points: 2 },
          { label: 'Trung bình', points: 3 },
          { label: 'Khó', points: 4 },
          { label: 'Rất khó', points: 5 },
        ]
      },
      // User Time
      {
        type: EvaluationType.USER,
        category: EvaluationCategory.TIME,
        options: [
          { label: 'Dưới 1 giờ', points: 1 },
          { label: '1-2 giờ', points: 2 },
          { label: 'Nửa ngày', points: 3 },
          { label: '1 ngày', points: 4 },
          { label: 'Nhiều ngày', points: 5 },
        ]
      },
      // User Impact
      {
        type: EvaluationType.USER,
        category: EvaluationCategory.IMPACT,
        options: [
          { label: 'Không ảnh hưởng', points: 1 },
          { label: 'Ảnh hưởng nhỏ', points: 2 },
          { label: 'Ảnh hưởng trung bình', points: 3 },
          { label: 'Ảnh hưởng lớn', points: 4 },
          { label: 'Ảnh hưởng nghiêm trọng', points: 5 },
        ]
      },
      // User Urgency
      {
        type: EvaluationType.USER,
        category: EvaluationCategory.URGENCY,
        options: [
          { label: 'Không khẩn cấp', points: 1 },
          { label: 'Ít khẩn cấp', points: 2 },
          { label: 'Khẩn cấp', points: 3 },
          { label: 'Rất khẩn cấp', points: 4 },
          { label: 'Cực kỳ khẩn cấp', points: 5 },
        ]
      },
      // User Form
      {
        type: EvaluationType.USER,
        category: EvaluationCategory.FORM,
        options: [
          { label: 'Onsite', points: 2 },
          { label: 'Remote', points: 3 },
          { label: 'Hybrid', points: 4 },
        ]
      }
    ];

    // Define sample data for Admin evaluations
    const adminSampleData = [
      // Admin Difficulty
      {
        type: EvaluationType.ADMIN,
        category: EvaluationCategory.DIFFICULTY,
        options: [
          { label: 'Rất dễ', points: 1 },
          { label: 'Dễ', points: 2 },
          { label: 'Trung bình', points: 3 },
          { label: 'Khó', points: 4 },
          { label: 'Rất khó', points: 5 },
          { label: 'Cực kỳ khó', points: 6 },
        ]
      },
      // Admin Time
      {
        type: EvaluationType.ADMIN,
        category: EvaluationCategory.TIME,
        options: [
          { label: 'Dưới 30 phút', points: 1 },
          { label: '30 phút - 1 giờ', points: 2 },
          { label: '1-2 giờ', points: 3 },
          { label: 'Nửa ngày', points: 4 },
          { label: '1 ngày', points: 5 },
          { label: '2-3 ngày', points: 6 },
          { label: 'Hơn 1 tuần', points: 7 },
        ]
      },
      // Admin Impact
      {
        type: EvaluationType.ADMIN,
        category: EvaluationCategory.IMPACT,
        options: [
          { label: 'Không ảnh hưởng', points: 1 },
          { label: 'Ảnh hưởng cá nhân', points: 2 },
          { label: 'Ảnh hưởng phòng ban', points: 3 },
          { label: 'Ảnh hưởng công ty', points: 4 },
          { label: 'Ảnh hưởng khách hàng', points: 5 },
          { label: 'Ảnh hưởng nghiêm trọng', points: 6 },
        ]
      },
      // Admin Urgency
      {
        type: EvaluationType.ADMIN,
        category: EvaluationCategory.URGENCY,
        options: [
          { label: 'Không khẩn cấp', points: 1 },
          { label: 'Có thể chờ', points: 2 },
          { label: 'Bình thường', points: 3 },
          { label: 'Khẩn cấp', points: 4 },
          { label: 'Rất khẩn cấp', points: 5 },
          { label: 'Cực kỳ khẩn cấp', points: 6 },
        ]
      }
    ];

    // Combine all sample data
    const allSampleData = [...userSampleData, ...adminSampleData];

    let createdCount = 0;
    let skippedCount = 0;

    // Create configurations
    for (const configData of allSampleData) {
      try {
        // Check if config already exists
        const existingConfig = await db.evaluationConfig.findFirst({
          where: {
            type: configData.type,
            category: configData.category,
            isActive: true,
          },
        });

        if (existingConfig) {
          console.log(`Config already exists: ${configData.type}-${configData.category}, updating options...`);
          
          // Delete existing options
          await db.evaluationOption.deleteMany({
            where: { configId: existingConfig.id }
          });
          
          // Create new options
          await db.evaluationOption.createMany({
            data: configData.options.map((option, index) => ({
              configId: existingConfig.id,
              label: option.label,
              points: option.points,
              order: index,
              isActive: true,
            }))
          });
          
          console.log(`Updated config: ${configData.type}-${configData.category} with ${configData.options.length} options`);
          createdCount++;
          continue;
        }

        // Create new config with options
        await db.evaluationConfig.create({
          data: {
            type: configData.type,
            category: configData.category,
            options: {
              create: configData.options.map((option, index) => ({
                label: option.label,
                points: option.points,
                order: index,
                isActive: true,
              })),
            },
          },
        });

        console.log(`Created config: ${configData.type}-${configData.category} with ${configData.options.length} options`);
        createdCount++;
      } catch (error) {
        console.error(`Error creating config ${configData.type}-${configData.category}:`, error);
      }
    }

    console.log(`Seeding completed: ${createdCount} created, ${skippedCount} skipped`);

    return NextResponse.json({
      success: true,
      message: `Đã tạo thành công ${createdCount} cấu hình đánh giá`,
      data: {
        created: createdCount,
        skipped: skippedCount,
        total: allSampleData.length
      }
    });

  } catch (error) {
    console.error('Error seeding evaluation configs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Có lỗi xảy ra khi tạo dữ liệu mẫu',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}