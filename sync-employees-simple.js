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
    console.log('=== Đồng bộ Employee từ Production sang Development ===\n');

    // Lấy employee còn thiếu từ production
    const prodEmployees = await prodDb.employee.findMany({
      where: {
        id: 'cmfxouqim0000js045n6mlsd6' // ID của Trần Nguyễn Anh Khoa
      }
    });

    if (prodEmployees.length === 0) {
      console.log('❌ Không tìm thấy employee cần đồng bộ');
      return;
    }

    const prodEmployee = prodEmployees[0];
    console.log(`📥 Tìm thấy employee: ${prodEmployee.fullName}`);

    // Kiểm tra xem đã tồn tại trong dev chưa
    const existingEmployee = await devDb.employee.findUnique({
      where: { id: prodEmployee.id }
    });

    if (existingEmployee) {
      console.log('✅ Employee đã tồn tại trong development database');
      return;
    }

    // Tạo employee mới với dữ liệu tối thiểu
    console.log('➕ Tạo employee mới...');
    
    const newEmployee = await devDb.employee.create({
      data: {
        id: prodEmployee.id,
        fullName: prodEmployee.fullName,
        dateOfBirth: prodEmployee.dateOfBirth || new Date('1990-01-01'),
        gender: prodEmployee.gender || 'OTHER',
        hometown: prodEmployee.hometown || 'Không xác định',
        religion: prodEmployee.religion || 'Không',
        ethnicity: prodEmployee.ethnicity || 'Kinh',
        startDate: prodEmployee.startDate || new Date(),
        primaryPhone: prodEmployee.primaryPhone || '0000000000',
        personalEmail: prodEmployee.personalEmail || prodEmployee.companyEmail,
        companyEmail: prodEmployee.companyEmail,
        placeOfBirth: prodEmployee.placeOfBirth || 'Không xác định',
        permanentAddress: prodEmployee.permanentAddress || 'Không xác định',
        department: prodEmployee.department,
        position: prodEmployee.position,
        status: prodEmployee.status || 'active',
        createdAt: prodEmployee.createdAt,
        updatedAt: prodEmployee.updatedAt
      }
    });

    console.log(`✅ Đã tạo thành công employee: ${newEmployee.fullName}`);
    console.log(`📧 Email: ${newEmployee.companyEmail}`);
    console.log(`🏢 Department: ${newEmployee.department}`);
    console.log(`💼 Position: ${newEmployee.position}`);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await prodDb.$disconnect();
    await devDb.$disconnect();
    console.log('\n🔌 Đã đóng kết nối database');
  }
}

syncEmployees();
