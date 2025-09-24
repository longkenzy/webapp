const { PrismaClient } = require('@prisma/client');

// Production database connection
const prodDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
  }
});

// Development database connection
const devDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
  }
});

async function syncEmployees() {
  try {
    console.log('=== Bắt đầu đồng bộ Employee từ Production sang Development ===\n');

    // 1. Lấy dữ liệu employees từ production
    console.log('📥 Đang lấy dữ liệu employees từ production...');
    const prodEmployees = await prodDb.employee.findMany({
      include: {
        user: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`✅ Tìm thấy ${prodEmployees.length} employees trong production database`);

    // 2. Lấy dữ liệu employees hiện tại trong development
    console.log('\n📥 Đang lấy dữ liệu employees hiện tại trong development...');
    const devEmployees = await devDb.employee.findMany({
      include: {
        user: true
      }
    });
    
    console.log(`✅ Tìm thấy ${devEmployees.length} employees trong development database`);

    // 3. Tạo map để so sánh
    const devEmployeeMap = new Map();
    devEmployees.forEach(emp => {
      devEmployeeMap.set(emp.id, emp);
    });

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    console.log('\n🔄 Bắt đầu đồng bộ dữ liệu...\n');

    // 4. Đồng bộ từng employee
    for (const prodEmployee of prodEmployees) {
      try {
        const devEmployee = devEmployeeMap.get(prodEmployee.id);
        
        if (!devEmployee) {
          // Employee chưa tồn tại trong dev, tạo mới
          console.log(`➕ Tạo mới employee: ${prodEmployee.fullName} (ID: ${prodEmployee.id})`);
          
          await devDb.employee.create({
            data: {
              id: prodEmployee.id,
              fullName: prodEmployee.fullName,
              position: prodEmployee.position,
              department: prodEmployee.department,
              companyEmail: prodEmployee.companyEmail,
              phoneNumber: prodEmployee.phoneNumber || null,
              address: prodEmployee.address || null,
              dateOfBirth: prodEmployee.dateOfBirth || null,
              gender: prodEmployee.gender || 'OTHER',
              isActive: prodEmployee.isActive !== undefined ? prodEmployee.isActive : true,
              createdAt: prodEmployee.createdAt,
              updatedAt: prodEmployee.updatedAt
            }
          });
          
          createdCount++;
        } else {
          // Employee đã tồn tại, kiểm tra xem có cần cập nhật không
          const needsUpdate = 
            devEmployee.fullName !== prodEmployee.fullName ||
            devEmployee.position !== prodEmployee.position ||
            devEmployee.department !== prodEmployee.department ||
            devEmployee.companyEmail !== prodEmployee.companyEmail ||
            devEmployee.phoneNumber !== prodEmployee.phoneNumber ||
            devEmployee.address !== prodEmployee.address ||
            devEmployee.isActive !== prodEmployee.isActive;

          if (needsUpdate) {
            console.log(`🔄 Cập nhật employee: ${prodEmployee.fullName} (ID: ${prodEmployee.id})`);
            
            await devDb.employee.update({
              where: { id: prodEmployee.id },
              data: {
                fullName: prodEmployee.fullName,
                position: prodEmployee.position,
                department: prodEmployee.department,
                companyEmail: prodEmployee.companyEmail,
                phoneNumber: prodEmployee.phoneNumber,
                address: prodEmployee.address,
                isActive: prodEmployee.isActive,
                updatedAt: new Date()
              }
            });
            
            updatedCount++;
          } else {
            console.log(`⏭️  Bỏ qua employee: ${prodEmployee.fullName} (ID: ${prodEmployee.id}) - không có thay đổi`);
            skippedCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Lỗi khi xử lý employee ${prodEmployee.fullName} (ID: ${prodEmployee.id}):`, error.message);
      }
    }

    // 5. Thống kê kết quả
    console.log('\n=== 📊 THỐNG KÊ ĐỒNG BỘ ===');
    console.log(`✅ Tạo mới: ${createdCount} employees`);
    console.log(`🔄 Cập nhật: ${updatedCount} employees`);
    console.log(`⏭️  Bỏ qua: ${skippedCount} employees`);
    console.log(`📈 Tổng cộng: ${prodEmployees.length} employees được xử lý`);

    // 6. Kiểm tra kết quả cuối cùng
    console.log('\n🔍 Kiểm tra kết quả cuối cùng...');
    const finalDevEmployees = await devDb.employee.findMany();
    console.log(`✅ Development database hiện có: ${finalDevEmployees.length} employees`);

    console.log('\n🎉 Đồng bộ hoàn tất thành công!');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình đồng bộ:', error);
  } finally {
    // Đóng kết nối database
    await prodDb.$disconnect();
    await devDb.$disconnect();
    console.log('\n🔌 Đã đóng kết nối database');
  }
}

// Chạy script
syncEmployees();
