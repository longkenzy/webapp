const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedMaintenanceCases() {
  try {
    console.log('🌱 Bắt đầu tạo dữ liệu mẫu case bảo trì...');

    // Lấy danh sách employees để làm handler và reporter
    const employees = await prisma.employee.findMany({
      take: 5
    });

    if (employees.length === 0) {
      console.log('❌ Không tìm thấy employees nào. Vui lòng tạo employees trước.');
      return;
    }

    // Lấy danh sách partners để làm customer
    const partners = await prisma.partner.findMany({
      take: 3
    });

    // Lấy danh sách maintenance case types
    const maintenanceTypes = await prisma.maintenanceCaseType.findMany({
      where: { isActive: true }
    });

    if (maintenanceTypes.length === 0) {
      console.log('❌ Không tìm thấy maintenance types nào. Vui lòng tạo maintenance types trước.');
      return;
    }

    // Lấy danh sách equipment (nếu có)
    const equipment = await prisma.equipment.findMany({
      take: 3
    });

    // Dữ liệu mẫu case bảo trì
    const sampleMaintenanceCases = [
      {
        title: "Bảo trì định kỳ máy chủ web",
        description: "Thực hiện bảo trì định kỳ cho máy chủ web production, bao gồm cập nhật hệ điều hành, kiểm tra phần cứng và tối ưu hóa hiệu suất.",
        customerName: "Công ty ABC",
        status: "RECEIVED",
        startDate: new Date('2024-01-15T09:00:00Z'),
        endDate: new Date('2024-01-15T17:00:00Z'),
        notes: "Cần thông báo trước cho khách hàng về thời gian downtime",
        userDifficultyLevel: 3,
        userEstimatedTime: 4,
        userImpactLevel: 4,
        userUrgencyLevel: 2,
        userFormScore: 3,
        userAssessmentDate: new Date('2024-01-10T10:00:00Z')
      },
      {
        title: "Sửa chữa lỗi database connection",
        description: "Khắc phục lỗi kết nối database thường xuyên bị timeout, ảnh hưởng đến hiệu suất ứng dụng.",
        customerName: "Công ty XYZ",
        status: "PROCESSING",
        startDate: new Date('2024-01-20T14:00:00Z'),
        notes: "Lỗi xảy ra vào giờ cao điểm, cần ưu tiên xử lý",
        userDifficultyLevel: 4,
        userEstimatedTime: 6,
        userImpactLevel: 5,
        userUrgencyLevel: 4,
        userFormScore: 2,
        userAssessmentDate: new Date('2024-01-18T15:30:00Z')
      },
      {
        title: "Nâng cấp hệ thống bảo mật",
        description: "Cài đặt và cấu hình các bản vá bảo mật mới nhất cho hệ thống, bao gồm firewall và antivirus.",
        customerName: "Công ty DEF",
        status: "COMPLETED",
        startDate: new Date('2024-01-10T08:00:00Z'),
        endDate: new Date('2024-01-12T16:00:00Z'),
        notes: "Hoàn thành đúng tiến độ, khách hàng hài lòng",
        userDifficultyLevel: 2,
        userEstimatedTime: 3,
        userImpactLevel: 3,
        userUrgencyLevel: 3,
        userFormScore: 3,
        userAssessmentDate: new Date('2024-01-08T09:00:00Z')
      },
      {
        title: "Kiểm tra và bảo trì máy in công nghiệp",
        description: "Thực hiện kiểm tra định kỳ máy in công nghiệp, vệ sinh, thay thế linh kiện cần thiết và hiệu chỉnh chất lượng in.",
        customerName: "Nhà máy GHI",
        status: "RECEIVED",
        startDate: new Date('2024-01-25T10:00:00Z'),
        notes: "Cần mang theo đầy đủ dụng cụ và linh kiện thay thế",
        userDifficultyLevel: 3,
        userEstimatedTime: 5,
        userImpactLevel: 2,
        userUrgencyLevel: 2,
        userFormScore: 3,
        userAssessmentDate: new Date('2024-01-22T11:00:00Z')
      },
      {
        title: "Khắc phục sự cố mạng LAN",
        description: "Xử lý sự cố mạng LAN bị chậm và mất kết nối không ổn định tại văn phòng chi nhánh.",
        customerName: "Công ty JKL",
        status: "PROCESSING",
        startDate: new Date('2024-01-18T13:00:00Z'),
        notes: "Sự cố ảnh hưởng đến công việc của toàn bộ nhân viên",
        userDifficultyLevel: 4,
        userEstimatedTime: 8,
        userImpactLevel: 5,
        userUrgencyLevel: 5,
        userFormScore: 2,
        userAssessmentDate: new Date('2024-01-17T14:00:00Z')
      },
      {
        title: "Bảo trì hệ thống điều hòa trung tâm",
        description: "Kiểm tra, vệ sinh và bảo trì hệ thống điều hòa trung tâm tại tòa nhà văn phòng.",
        customerName: "Tòa nhà MNO",
        status: "RECEIVED",
        startDate: new Date('2024-01-30T07:00:00Z'),
        notes: "Cần thực hiện vào cuối tuần để không ảnh hưởng hoạt động",
        userDifficultyLevel: 2,
        userEstimatedTime: 4,
        userImpactLevel: 1,
        userUrgencyLevel: 1,
        userFormScore: 3,
        userAssessmentDate: new Date('2024-01-28T08:00:00Z')
      },
      {
        title: "Cập nhật phần mềm quản lý kho",
        description: "Cập nhật phiên bản mới của phần mềm quản lý kho, bao gồm backup dữ liệu và training nhân viên.",
        customerName: "Kho hàng PQR",
        status: "COMPLETED",
        startDate: new Date('2024-01-05T09:00:00Z'),
        endDate: new Date('2024-01-07T17:00:00Z'),
        notes: "Cập nhật thành công, nhân viên đã được training",
        userDifficultyLevel: 3,
        userEstimatedTime: 6,
        userImpactLevel: 3,
        userUrgencyLevel: 2,
        userFormScore: 3,
        userAssessmentDate: new Date('2024-01-03T10:00:00Z')
      },
      {
        title: "Sửa chữa máy phát điện dự phòng",
        description: "Khắc phục sự cố máy phát điện dự phòng không khởi động được khi mất điện.",
        customerName: "Bệnh viện STU",
        status: "PROCESSING",
        startDate: new Date('2024-01-22T16:00:00Z'),
        notes: "Sự cố khẩn cấp, ảnh hưởng đến hoạt động bệnh viện",
        userDifficultyLevel: 5,
        userEstimatedTime: 12,
        userImpactLevel: 5,
        userUrgencyLevel: 5,
        userFormScore: 1,
        userAssessmentDate: new Date('2024-01-21T17:00:00Z')
      }
    ];

    // Tạo maintenance cases
    for (let i = 0; i < sampleMaintenanceCases.length; i++) {
      const caseData = sampleMaintenanceCases[i];
      const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
      const randomMaintenanceType = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
      const randomPartner = partners.length > 0 ? partners[Math.floor(Math.random() * partners.length)] : null;
      const randomEquipment = equipment.length > 0 ? equipment[Math.floor(Math.random() * equipment.length)] : null;

      const maintenanceCase = await prisma.maintenanceCase.create({
        data: {
          title: caseData.title,
          description: caseData.description,
          reporterId: randomEmployee.id,
          handlerId: randomEmployee.id,
          customerName: caseData.customerName,
          customerId: randomPartner ? randomPartner.id : null,
          equipmentId: randomEquipment ? randomEquipment.id : null,
          maintenanceType: 'PREVENTIVE', // Default enum value
          maintenanceTypeId: randomMaintenanceType.id,
          startDate: caseData.startDate,
          endDate: caseData.endDate,
          status: caseData.status,
          notes: caseData.notes,
          userDifficultyLevel: caseData.userDifficultyLevel,
          userEstimatedTime: caseData.userEstimatedTime,
          userImpactLevel: caseData.userImpactLevel,
          userUrgencyLevel: caseData.userUrgencyLevel,
          userFormScore: caseData.userFormScore,
          userAssessmentDate: caseData.userAssessmentDate
        }
      });

      console.log(`✅ Tạo case bảo trì: ${maintenanceCase.title}`);
    }

    console.log(`🎉 Đã tạo thành công ${sampleMaintenanceCases.length} case bảo trì mẫu!`);

  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu mẫu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy function
seedMaintenanceCases();
