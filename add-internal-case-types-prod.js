const { PrismaClient } = require('@prisma/client');

// Use production database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_PROD || process.env.DATABASE_URL
    }
  }
});

const caseTypes = [
  'Bảo trì máy tính định kỳ',
  'Cài đặt máy tính mới',
  'Cài đặt phần mềm văn phòng',
  'Cài đặt thiết bị ngoại vi',
  'Cài đặt ứng dụng',
  'Cài đặt mạng LAN',
  'Cấp quyền truy cập',
  'Cấu hình WiFi',
  'Cấu hình điện thoại công ty',
  'Chuyển dữ liệu máy cũ sang mới',
  'Dọn dẹp ổ cứng',
  'Đổi mật khẩu',
  'Hỗ trợ in ấn',
  'Hỗ trợ sử dụng phần mềm',
  'Khắc phục lỗi điện thoại',
  'Khắc phục lỗi email',
  'Khắc phục mất mạng',
  'Phục hồi dữ liệu',
  'Sao lưu dữ liệu',
  'Sửa lỗi máy tính',
  'Tạo tài khoản nhân viên mới',
  'Thay thế linh kiện',
  'Thu hồi quyền truy cập',
  'Tối ưu tốc độ mạng',
  'Viết tài liệu'
];

async function addInternalCaseTypes() {
  console.log('🚀 Starting to add internal case types to PRODUCTION database...');
  console.log(`📊 Total case types to add: ${caseTypes.length}`);
  
  let addedCount = 0;
  let skippedCount = 0;

  try {
    for (const caseTypeName of caseTypes) {
      try {
        // Check if case type already exists
        const existingCaseType = await prisma.caseType.findFirst({
          where: { name: caseTypeName }
        });

        if (existingCaseType) {
          console.log(`⚠️  Case type already exists: "${caseTypeName}" (ID: ${existingCaseType.id})`);
          skippedCount++;
        } else {
          // Create new case type
          const newCaseType = await prisma.caseType.create({
            data: {
              name: caseTypeName,
              isActive: true
            }
          });
          console.log(`✅ Added case type: "${caseTypeName}" (ID: ${newCaseType.id})`);
          addedCount++;
        }
      } catch (error) {
        console.error(`❌ Error adding case type "${caseTypeName}":`, error.message);
      }
    }

    console.log('\n📈 Summary:');
    console.log(`✅ Successfully added: ${addedCount} case types`);
    console.log(`⚠️  Already existed: ${skippedCount} case types`);
    console.log(`📊 Total processed: ${addedCount + skippedCount} case types`);
    
    // Verify total count
    const totalCaseTypes = await prisma.caseType.count();
    console.log(`🗂️  Total case types in database: ${totalCaseTypes}`);

    console.log('\n🎉 Process completed successfully!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed.');
  }
}

// Execute the function
addInternalCaseTypes()
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
