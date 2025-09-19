const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedWarrantyTypes() {
  try {
    console.log('🌱 Bắt đầu tạo dữ liệu mẫu cho WarrantyType...');

    // Dữ liệu mẫu cho các loại bảo hành
    const warrantyTypes = [
      {
        name: 'hardware-warranty',
        description: 'Bảo hành phần cứng - Bảo hành các thiết bị phần cứng như máy tính, server, thiết bị mạng'
      },
      {
        name: 'software-warranty',
        description: 'Bảo hành phần mềm - Bảo hành các ứng dụng, hệ thống phần mềm và license'
      },
      {
        name: 'service-warranty',
        description: 'Bảo hành dịch vụ - Bảo hành các dịch vụ hỗ trợ, tư vấn và triển khai'
      },
      {
        name: 'extended-warranty',
        description: 'Bảo hành mở rộng - Gia hạn bảo hành cho các sản phẩm đã hết hạn bảo hành chính thức'
      },
      {
        name: 'replacement-warranty',
        description: 'Bảo hành thay thế - Bảo hành thay thế sản phẩm lỗi bằng sản phẩm mới'
      },
      {
        name: 'repair-warranty',
        description: 'Bảo hành sửa chữa - Bảo hành sửa chữa và bảo trì các sản phẩm hỏng hóc'
      },
      {
        name: 'preventive-warranty',
        description: 'Bảo hành phòng ngừa - Bảo hành định kỳ để ngăn ngừa sự cố và duy trì hiệu suất'
      },
      {
        name: 'emergency-warranty',
        description: 'Bảo hành khẩn cấp - Bảo hành 24/7 cho các sự cố nghiêm trọng cần xử lý ngay'
      }
    ];

    console.log(`📝 Tạo ${warrantyTypes.length} loại bảo hành...`);

    // Tạo từng loại bảo hành
    for (const warrantyType of warrantyTypes) {
      try {
        const created = await prisma.warrantyType.create({
          data: warrantyType
        });
        console.log(`✅ Đã tạo: ${created.name} - ${created.description}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Đã tồn tại: ${warrantyType.name} - Bỏ qua`);
        } else {
          console.error(`❌ Lỗi tạo ${warrantyType.name}:`, error.message);
        }
      }
    }

    // Kiểm tra kết quả
    const totalWarrantyTypes = await prisma.warrantyType.count();
    console.log(`\n📊 Tổng số loại bảo hành trong database: ${totalWarrantyTypes}`);

    // Hiển thị danh sách tất cả loại bảo hành
    const allWarrantyTypes = await prisma.warrantyType.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log('\n📋 Danh sách tất cả loại bảo hành:');
    allWarrantyTypes.forEach((type, index) => {
      console.log(`${index + 1}. ${type.name} - ${type.description}`);
    });

    console.log('\n🎉 Hoàn thành tạo dữ liệu mẫu cho WarrantyType!');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình tạo dữ liệu mẫu:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
seedWarrantyTypes()
  .catch((error) => {
    console.error('❌ Script thất bại:', error);
    process.exit(1);
  });
