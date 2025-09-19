const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedMoreWarrantyCases() {
  try {
    console.log('🌱 Bắt đầu tạo thêm 10 warranty cases...');

    // Lấy danh sách employees, partners, và warranty types
    const employees = await prisma.employee.findMany({ take: 10 });
    const partners = await prisma.partner.findMany({ take: 10 });
    const warrantyTypes = await prisma.warrantyType.findMany();

    if (employees.length === 0) {
      console.log('❌ Không tìm thấy employees. Vui lòng tạo employees trước.');
      return;
    }

    if (warrantyTypes.length === 0) {
      console.log('❌ Không tìm thấy warranty types. Vui lòng tạo warranty types trước.');
      return;
    }

    console.log(`📊 Tìm thấy ${employees.length} employees, ${partners.length} partners, ${warrantyTypes.length} warranty types`);

    // Dữ liệu mẫu cho 10 warranty cases mới
    const moreWarrantyCases = [
      {
        title: 'Bảo hành UPS APC Smart-UPS 3000VA',
        description: 'Bộ lưu điện UPS APC Smart-UPS 3000VA báo lỗi pin yếu, cần thay thế bộ pin theo chế độ bảo hành.',
        customerName: 'Anh Võ Minh Long',
        status: 'RECEIVED',
        notes: 'UPS báo cảnh báo pin yếu liên tục. Cần kiểm tra và thay pin backup.'
      },
      {
        title: 'Bảo hành phần mềm ERP SAP Business One',
        description: 'Phần mềm ERP SAP Business One gặp lỗi không thể tạo báo cáo inventory, module quản lý kho bị lỗi.',
        customerName: 'Chị Đỗ Thị Mai',
        status: 'PROCESSING',
        notes: 'Lỗi xuất hiện sau khi import dữ liệu từ Excel. Module inventory không phản hồi.'
      },
      {
        title: 'Bảo hành switch mạng Cisco Catalyst 2960',
        description: 'Switch mạng Cisco Catalyst 2960-24TC gặp sự cố một số port mạng không hoạt động, cần kiểm tra và sửa chữa.',
        customerName: 'Anh Bùi Văn Nam',
        status: 'PROCESSING',
        notes: 'Port 12-16 không detect được thiết bị. LED báo lỗi màu đỏ.'
      },
      {
        title: 'Bảo hành dịch vụ backup dữ liệu tự động',
        description: 'Dịch vụ backup dữ liệu tự động hàng đêm bị gián đoạn, cần khắc phục và đảm bảo backup hoạt động ổn định.',
        customerName: 'Chị Lý Thị Oanh',
        status: 'COMPLETED',
        notes: 'Đã khắc phục lỗi script backup. Hệ thống backup hoạt động bình thường.'
      },
      {
        title: 'Bảo hành mở rộng cho hệ thống tổng đài IP',
        description: 'Gia hạn bảo hành cho hệ thống tổng đài IP Grandstream, bao gồm 20 máy nhánh và 4 trunk line.',
        customerName: 'Anh Phan Thanh Phong',
        status: 'RECEIVED',
        notes: 'Khách hàng yêu cầu gia hạn bảo hành và nâng cấp firmware mới nhất.'
      },
      {
        title: 'Bảo hành thay thế máy photocopy Ricoh MP 3055',
        description: 'Máy photocopy Ricoh MP 3055 bị kẹt giấy liên tục và chất lượng in kém, cần thay thế theo bảo hành.',
        customerName: 'Chị Hoàng Thị Quyên',
        status: 'PROCESSING',
        notes: 'Máy đã sử dụng 3 năm, drum và fuser hỏng. Cần thay máy mới.'
      },
      {
        title: 'Bảo hành sửa chữa máy chiếu Epson EB-X41',
        description: 'Máy chiếu Epson EB-X41 bị mờ hình ảnh và có vệt đen trên màn hình chiếu, cần vệ sinh và thay thế bóng đèn.',
        customerName: 'Anh Ngô Văn Sơn',
        status: 'COMPLETED',
        notes: 'Đã vệ sinh lens và thay bóng đèn mới. Máy chiếu hoạt động tốt.'
      },
      {
        title: 'Bảo hành phòng ngừa hệ thống cửa từ access control',
        description: 'Bảo trì định kỳ hệ thống kiểm soát ra vào bằng thẻ từ, kiểm tra đầu đọc thẻ và cập nhật phần mềm.',
        customerName: 'Chị Trịnh Thị Thảo',
        status: 'RECEIVED',
        notes: 'Lịch bảo trì định kỳ 6 tháng. Cần kiểm tra 8 đầu đọc thẻ và database.'
      },
      {
        title: 'Bảo hành khẩn cấp hệ thống giám sát mạng',
        description: 'Hệ thống giám sát mạng PRTG bị down, không thể monitor các thiết bị mạng, cần khắc phục khẩn cấp.',
        customerName: 'Anh Vương Minh Tuấn',
        status: 'PROCESSING',
        notes: 'Hệ thống PRTG không khởi động sau khi restart server. Cần khắc phục ngay.'
      },
      {
        title: 'Bảo hành phần mềm kho vận WMS Pro',
        description: 'Phần mềm quản lý kho vận WMS Pro gặp lỗi không thể cập nhật số lượng tồn kho real-time, ảnh hưởng đến vận hành.',
        customerName: 'Chị Lê Thị Uyên',
        status: 'COMPLETED',
        notes: 'Đã khắc phục lỗi sync database. Hệ thống cập nhật real-time bình thường.'
      }
    ];

    console.log(`📝 Tạo thêm ${moreWarrantyCases.length} warranty cases...`);

    // Tạo từng warranty case
    for (let i = 0; i < moreWarrantyCases.length; i++) {
      const caseData = moreWarrantyCases[i];
      
      try {
        // Random chọn reporter, handler, warranty type
        const randomReporter = employees[Math.floor(Math.random() * employees.length)];
        const randomHandler = employees[Math.floor(Math.random() * employees.length)];
        const randomWarrantyType = warrantyTypes[Math.floor(Math.random() * warrantyTypes.length)];
        const randomPartner = partners.length > 0 ? partners[Math.floor(Math.random() * partners.length)] : null;

        // Random thời gian
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 45)); // 0-45 ngày trước
        
        let endDate = null;
        if (caseData.status === 'COMPLETED') {
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 10) + 1); // 1-10 ngày sau start date
        }

        // Random assessment levels (1-5)
        const difficultyLevel = Math.floor(Math.random() * 5) + 1;
        const estimatedTime = Math.floor(Math.random() * 5) + 1;
        const impactLevel = Math.floor(Math.random() * 5) + 1;
        const urgencyLevel = Math.floor(Math.random() * 5) + 1;
        const formScore = Math.floor(Math.random() * 3) + 1; // 1-3

        const created = await prisma.warranty.create({
          data: {
            title: caseData.title,
            description: caseData.description,
            reporterId: randomReporter.id,
            handlerId: randomHandler.id,
            warrantyTypeId: randomWarrantyType.id,
            customerId: randomPartner?.id || null,
            customerName: caseData.customerName,
            startDate: startDate,
            endDate: endDate,
            status: caseData.status,
            notes: caseData.notes,
            userDifficultyLevel: difficultyLevel,
            userEstimatedTime: estimatedTime,
            userImpactLevel: impactLevel,
            userUrgencyLevel: urgencyLevel,
            userFormScore: formScore,
            userAssessmentDate: startDate
          }
        });

        console.log(`✅ Đã tạo: ${created.title} (${created.status})`);
      } catch (error) {
        console.error(`❌ Lỗi tạo case ${i + 1}:`, error.message);
      }
    }

    // Kiểm tra kết quả
    const totalWarrantyCases = await prisma.warranty.count();
    console.log(`\n📊 Tổng số warranty cases trong database: ${totalWarrantyCases}`);

    // Hiển thị thống kê theo status
    const statusStats = await prisma.warranty.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    console.log('\n📈 Thống kê theo trạng thái:');
    statusStats.forEach(stat => {
      const statusText = {
        'RECEIVED': 'Tiếp nhận',
        'PROCESSING': 'Đang xử lý',
        'COMPLETED': 'Hoàn thành',
        'CANCELLED': 'Hủy'
      }[stat.status] || stat.status;
      
      console.log(`   ${statusText}: ${stat._count.status} cases`);
    });

    // Hiển thị thống kê theo warranty type
    const typeStats = await prisma.warranty.groupBy({
      by: ['warrantyTypeId'],
      _count: {
        warrantyTypeId: true
      },
      orderBy: {
        _count: {
          warrantyTypeId: 'desc'
        }
      }
    });

    console.log('\n📊 Thống kê theo loại bảo hành:');
    for (const stat of typeStats) {
      const warrantyType = await prisma.warrantyType.findUnique({
        where: { id: stat.warrantyTypeId }
      });
      console.log(`   ${warrantyType?.name}: ${stat._count.warrantyTypeId} cases`);
    }

    console.log('\n🎉 Hoàn thành tạo thêm 10 warranty cases!');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình tạo dữ liệu mẫu:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
seedMoreWarrantyCases()
  .catch((error) => {
    console.error('❌ Script thất bại:', error);
    process.exit(1);
  });
