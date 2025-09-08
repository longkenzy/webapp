const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedIncidentTypes() {
  try {
    console.log('Seeding incident types...');
    
    const incidentTypes = [
      { id: 'clx0000000000000000000001', name: 'Vi phạm bảo mật', description: 'Các sự cố liên quan đến bảo mật hệ thống' },
      { id: 'clx0000000000000000000002', name: 'Lỗi hệ thống', description: 'Các lỗi kỹ thuật trong hệ thống' },
      { id: 'clx0000000000000000000003', name: 'Mất dữ liệu', description: 'Sự cố mất mát hoặc hỏng dữ liệu' },
      { id: 'clx0000000000000000000004', name: 'Sự cố mạng', description: 'Các vấn đề về kết nối mạng' },
      { id: 'clx0000000000000000000005', name: 'Lỗi phần cứng', description: 'Sự cố với thiết bị phần cứng' },
      { id: 'clx0000000000000000000006', name: 'Lỗi phần mềm', description: 'Các lỗi trong ứng dụng phần mềm' },
      { id: 'clx0000000000000000000007', name: 'Sự cố hiệu suất', description: 'Vấn đề về hiệu suất hệ thống' },
      { id: 'clx0000000000000000000008', name: 'Từ chối truy cập', description: 'Không thể truy cập vào hệ thống' },
      { id: 'clx0000000000000000000009', name: 'Khác', description: 'Các sự cố khác không thuộc danh mục trên' }
    ];

    for (const type of incidentTypes) {
      await prisma.incidentType.upsert({
        where: { name: type.name },
        update: {},
        create: {
          id: type.id,
          name: type.name,
          description: type.description,
          isActive: true
        }
      });
    }

    console.log('Incident types seeded successfully!');
  } catch (error) {
    console.error('Error seeding incident types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedIncidentTypes();
