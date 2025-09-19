const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedWarrantyCases() {
  try {
    console.log('🌱 Bắt đầu tạo dữ liệu mẫu cho Warranty cases...');

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

    // Dữ liệu mẫu cho warranty cases
    const warrantyCases = [
      {
        title: 'Bảo hành máy tính văn phòng Dell Optiplex',
        description: 'Máy tính văn phòng Dell Optiplex 7090 gặp sự cố không khởi động được, cần kiểm tra và sửa chữa theo chế độ bảo hành.',
        customerName: 'Anh Nguyễn Văn An',
        status: 'RECEIVED',
        notes: 'Khách hàng báo máy tính không khởi động từ sáng nay. Cần kiểm tra nguồn và mainboard.'
      },
      {
        title: 'Bảo hành phần mềm quản lý nhân sự',
        description: 'Phần mềm quản lý nhân sự HRM Pro gặp lỗi không thể đồng bộ dữ liệu với hệ thống chấm công.',
        customerName: 'Chị Trần Thị Bình',
        status: 'PROCESSING',
        notes: 'Lỗi xuất hiện sau khi update version mới. Cần rollback hoặc fix bug.'
      },
      {
        title: 'Bảo hành server HP ProLiant',
        description: 'Server HP ProLiant DL380 Gen10 gặp sự cố ổ cứng RAID, cần thay thế ổ cứng bị lỗi theo chế độ bảo hành.',
        customerName: 'Anh Lê Minh Cường',
        status: 'PROCESSING',
        notes: 'Ổ cứng slot 3 báo lỗi. Cần thay thế và rebuild RAID array.'
      },
      {
        title: 'Bảo hành dịch vụ bảo trì hệ thống mạng',
        description: 'Dịch vụ bảo trì định kỳ hệ thống mạng LAN/WAN của công ty, kiểm tra và tối ưu hiệu suất.',
        customerName: 'Chị Phạm Thị Dung',
        status: 'COMPLETED',
        notes: 'Đã hoàn thành bảo trì định kỳ tháng 12. Hệ thống hoạt động ổn định.'
      },
      {
        title: 'Bảo hành mở rộng cho hệ thống camera an ninh',
        description: 'Gia hạn bảo hành cho hệ thống camera an ninh 32 kênh, bao gồm kiểm tra và thay thế linh kiện hỏng.',
        customerName: 'Anh Hoàng Văn Em',
        status: 'RECEIVED',
        notes: 'Khách hàng yêu cầu gia hạn bảo hành thêm 12 tháng cho hệ thống camera.'
      },
      {
        title: 'Bảo hành thay thế máy in laser Canon',
        description: 'Máy in laser Canon LBP6030w bị hỏng motor cấp giấy, cần thay thế máy mới theo chế độ bảo hành.',
        customerName: 'Chị Nguyễn Thị Phương',
        status: 'PROCESSING',
        notes: 'Máy in đã quá 2 năm tuổi, motor cấp giấy hỏng không sửa được. Cần thay máy mới.'
      },
      {
        title: 'Bảo hành sửa chữa laptop Lenovo ThinkPad',
        description: 'Laptop Lenovo ThinkPad T14 gặp sự cố màn hình bị sọc, cần thay thế màn hình LCD theo bảo hành.',
        customerName: 'Anh Trần Văn Giang',
        status: 'COMPLETED',
        notes: 'Đã thay thế màn hình LCD mới. Laptop hoạt động bình thường.'
      },
      {
        title: 'Bảo hành phòng ngừa hệ thống điều hòa server',
        description: 'Bảo trì định kỳ hệ thống điều hòa phòng server, vệ sinh và kiểm tra hoạt động các thiết bị.',
        customerName: 'Chị Vũ Thị Hoa',
        status: 'RECEIVED',
        notes: 'Lịch bảo trì định kỳ quý 4. Cần vệ sinh và kiểm tra gas điều hòa.'
      },
      {
        title: 'Bảo hành khẩn cấp hệ thống firewall',
        description: 'Hệ thống firewall Fortinet bị down khẩn cấp, cần khắc phục ngay lập tức để đảm bảo an ninh mạng.',
        customerName: 'Anh Đặng Minh Tuấn',
        status: 'PROCESSING',
        notes: 'Sự cố khẩn cấp lúc 2h sáng. Firewall không phản hồi, cần khắc phục ngay.'
      },
      {
        title: 'Bảo hành phần mềm kế toán MISA',
        description: 'Phần mềm kế toán MISA SME.NET gặp lỗi không thể xuất báo cáo tài chính, cần hỗ trợ khắc phục.',
        customerName: 'Chị Lê Thị Kim',
        status: 'COMPLETED',
        notes: 'Đã khắc phục lỗi do conflict với Windows Update. Phần mềm hoạt động bình thường.'
      }
    ];

    console.log(`📝 Tạo ${warrantyCases.length} warranty cases...`);

    // Tạo từng warranty case
    for (let i = 0; i < warrantyCases.length; i++) {
      const caseData = warrantyCases[i];
      
      try {
        // Random chọn reporter, handler, warranty type
        const randomReporter = employees[Math.floor(Math.random() * employees.length)];
        const randomHandler = employees[Math.floor(Math.random() * employees.length)];
        const randomWarrantyType = warrantyTypes[Math.floor(Math.random() * warrantyTypes.length)];
        const randomPartner = partners.length > 0 ? partners[Math.floor(Math.random() * partners.length)] : null;

        // Random thời gian
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30)); // 0-30 ngày trước
        
        let endDate = null;
        if (caseData.status === 'COMPLETED') {
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 ngày sau start date
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

    console.log('\n🎉 Hoàn thành tạo dữ liệu mẫu cho Warranty cases!');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình tạo dữ liệu mẫu:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
seedWarrantyCases()
  .catch((error) => {
    console.error('❌ Script thất bại:', error);
    process.exit(1);
  });
