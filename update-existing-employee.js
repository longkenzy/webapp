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

async function updateEmployee() {
  try {
    console.log('=== Cập nhật Employee từ Production sang Development ===\n');

    // Lấy employee từ production
    const prodEmployee = await prodDb.employee.findUnique({
      where: { id: 'cmfxouqim0000js045n6mlsd6' }
    });

    if (!prodEmployee) {
      console.log('❌ Không tìm thấy employee trong production');
      return;
    }

    console.log(`📥 Employee từ production: ${prodEmployee.fullName}`);

    // Tìm employee trong dev bằng email
    const devEmployee = await devDb.employee.findFirst({
      where: { companyEmail: prodEmployee.companyEmail }
    });

    if (!devEmployee) {
      console.log('❌ Không tìm thấy employee trong development');
      return;
    }

    console.log(`📥 Employee trong dev: ${devEmployee.fullName} (ID: ${devEmployee.id})`);

    // So sánh thông tin
    const needsUpdate = 
      devEmployee.fullName !== prodEmployee.fullName ||
      devEmployee.position !== prodEmployee.position ||
      devEmployee.department !== prodEmployee.department;

    if (needsUpdate) {
      console.log('🔄 Cập nhật thông tin employee...');
      
      await devDb.employee.update({
        where: { id: devEmployee.id },
        data: {
          fullName: prodEmployee.fullName,
          position: prodEmployee.position,
          department: prodEmployee.department,
          updatedAt: new Date()
        }
      });

      console.log('✅ Đã cập nhật thành công!');
    } else {
      console.log('✅ Thông tin đã đồng bộ, không cần cập nhật');
    }

    // Hiển thị thông tin cuối cùng
    const updatedEmployee = await devDb.employee.findUnique({
      where: { id: devEmployee.id }
    });

    console.log('\n📊 Thông tin employee sau cập nhật:');
    console.log(`   ID: ${updatedEmployee.id}`);
    console.log(`   Tên: ${updatedEmployee.fullName}`);
    console.log(`   Email: ${updatedEmployee.companyEmail}`);
    console.log(`   Department: ${updatedEmployee.department}`);
    console.log(`   Position: ${updatedEmployee.position}`);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await prodDb.$disconnect();
    await devDb.$disconnect();
    console.log('\n🔌 Đã đóng kết nối database');
  }
}

updateEmployee();
