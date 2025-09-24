const { PrismaClient } = require('@prisma/client');

const devDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
  }
});

async function checkEmployee() {
  try {
    console.log('=== Kiểm tra Employee trong Development Database ===\n');

    // Kiểm tra employee với ID cụ thể
    const employee = await devDb.employee.findUnique({
      where: { id: 'cmfxouqim0000js045n6mlsd6' }
    });

    if (employee) {
      console.log('✅ Employee đã tồn tại:');
      console.log(`   ID: ${employee.id}`);
      console.log(`   Tên: ${employee.fullName}`);
      console.log(`   Email: ${employee.companyEmail}`);
      console.log(`   Department: ${employee.department}`);
      console.log(`   Position: ${employee.position}`);
    } else {
      console.log('❌ Employee chưa tồn tại');
    }

    // Kiểm tra email có bị trùng không
    const emailCheck = await devDb.employee.findFirst({
      where: { companyEmail: 'khoatna@smartservices.com.vn' }
    });

    if (emailCheck) {
      console.log('\n⚠️  Email đã tồn tại:');
      console.log(`   ID: ${emailCheck.id}`);
      console.log(`   Tên: ${emailCheck.fullName}`);
      console.log(`   Email: ${emailCheck.companyEmail}`);
    } else {
      console.log('\n✅ Email chưa bị trùng');
    }

    // Đếm tổng số employees
    const totalEmployees = await devDb.employee.count();
    console.log(`\n📊 Tổng số employees trong dev database: ${totalEmployees}`);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await devDb.$disconnect();
    console.log('\n🔌 Đã đóng kết nối database');
  }
}

checkEmployee();
