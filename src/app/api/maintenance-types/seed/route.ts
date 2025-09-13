import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Seeding maintenance case types...');

    const maintenanceTypes = [
      {
        name: 'Bảo trì phòng ngừa',
        description: 'Bảo trì định kỳ để ngăn ngừa sự cố',
      },
      {
        name: 'Bảo trì sửa chữa',
        description: 'Sửa chữa thiết bị khi có sự cố',
      },
      {
        name: 'Bảo trì khẩn cấp',
        description: 'Bảo trì khẩn cấp khi có sự cố nghiêm trọng',
      },
      {
        name: 'Bảo trì định kỳ',
        description: 'Bảo trì theo lịch trình định kỳ',
      },
      {
        name: 'Nâng cấp thiết bị',
        description: 'Nâng cấp hoặc cải tiến thiết bị',
      },
      {
        name: 'Kiểm tra thiết bị',
        description: 'Kiểm tra tình trạng hoạt động của thiết bị',
      },
    ];

    const createdTypes = [];
    for (const type of maintenanceTypes) {
      const created = await prisma.maintenanceCaseType.upsert({
        where: { name: type.name },
        update: {},
        create: type,
      });
      createdTypes.push(created);
    }

    console.log('✅ Maintenance case types seeded successfully!');

    return NextResponse.json({
      success: true,
      message: 'Maintenance case types seeded successfully',
      data: createdTypes,
    });
  } catch (error) {
    console.error('❌ Error seeding maintenance types:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to seed maintenance types',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
