const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedMoreMaintenanceCases() {
  try {
    console.log('🌱 Bắt đầu tạo thêm 10 case bảo trì mẫu...');

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
      take: 5
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
      take: 5
    });

    // Dữ liệu mẫu case bảo trì bổ sung
    const additionalMaintenanceCases = [
      {
        title: "Bảo trì hệ thống camera giám sát",
        description: "Kiểm tra, vệ sinh và hiệu chỉnh hệ thống camera giám sát tại khu vực sản xuất, đảm bảo chất lượng hình ảnh và góc quay.",
        customerName: "Nhà máy VWX",
        status: "RECEIVED",
        startDate: new Date('2024-02-01T08:00:00Z'),
        endDate: new Date('2024-02-01T16:00:00Z'),
        notes: "Cần thang và dụng cụ chuyên dụng để tiếp cận camera cao",
        userDifficultyLevel: 3,
        userEstimatedTime: 6,
        userImpactLevel: 2,
        userUrgencyLevel: 2,
        userFormScore: 3,
        userAssessmentDate: new Date('2024-01-29T09:00:00Z')
      },
      {
        title: "Khắc phục sự cố máy tính tiền",
        description: "Sửa chữa lỗi máy tính tiền không in được hóa đơn và bị treo khi xử lý giao dịch lớn.",
        customerName: "Siêu thị YZA",
        status: "PROCESSING",
        startDate: new Date('2024-01-28T10:00:00Z'),
        notes: "Sự cố ảnh hưởng đến doanh thu, cần ưu tiên xử lý",
        userDifficultyLevel: 4,
        userEstimatedTime: 8,
        userImpactLevel: 4,
        userUrgencyLevel: 4,
        userFormScore: 2,
        userAssessmentDate: new Date('2024-01-27T11:00:00Z')
      },
      {
        title: "Bảo trì hệ thống thang máy",
        description: "Thực hiện bảo trì định kỳ hệ thống thang máy, kiểm tra dây cáp, hệ thống điều khiển và an toàn.",
        customerName: "Tòa nhà BCD",
        status: "COMPLETED",
        startDate: new Date('2024-01-20T07:00:00Z'),
        endDate: new Date('2024-01-21T15:00:00Z'),
        notes: "Hoàn thành đúng tiến độ, thang máy hoạt động bình thường",
        userDifficultyLevel: 5,
        userEstimatedTime: 10,
        userImpactLevel: 3,
        userUrgencyLevel: 2,
        userFormScore: 3,
        userAssessmentDate: new Date('2024-01-18T08:00:00Z')
      },
      {
        title: "Cập nhật phần mềm quản lý nhân sự",
        description: "Cập nhật phiên bản mới của phần mềm quản lý nhân sự, backup dữ liệu và training người dùng.",
        customerName: "Công ty EFG",
        status: "RECEIVED",
        startDate: new Date('2024-02-05T09:00:00Z'),
        notes: "Cần backup toàn bộ dữ liệu trước khi cập nhật",
        userDifficultyLevel: 3,
        userEstimatedTime: 5,
        userImpactLevel: 3,
        userUrgencyLevel: 2,
        userFormScore: 3,
        userAssessmentDate: new Date('2024-02-03T10:00:00Z')
      },
      {
        title: "Sửa chữa hệ thống báo cháy",
        description: "Khắc phục lỗi hệ thống báo cháy bị kích hoạt sai và không hoạt động khi cần thiết.",
        customerName: "Trung tâm thương mại HIJ",
        status: "PROCESSING",
        startDate: new Date('2024-01-30T14:00:00Z'),
        notes: "Sự cố an toàn, cần xử lý khẩn cấp",
        userDifficultyLevel: 5,
        userEstimatedTime: 12,
        userImpactLevel: 5,
        userUrgencyLevel: 5,
        userFormScore: 1,
        userAssessmentDate: new Date('2024-01-29T15:00:00Z')
      },
      {
        title: "Bảo trì máy photocopy công nghiệp",
        description: "Vệ sinh, hiệu chỉnh và thay thế linh kiện cho máy photocopy công nghiệp tại văn phòng.",
        customerName: "Văn phòng KLM",
        status: "RECEIVED",
        startDate: new Date('2024-02-08T11:00:00Z'),
        notes: "Cần mang theo linh kiện thay thế",
        userDifficultyLevel: 2,
        userEstimatedTime: 4,
        userImpactLevel: 1,
        userUrgencyLevel: 1,
        userFormScore: 3,
        userAssessmentDate: new Date('2024-02-06T12:00:00Z')
      },
      {
        title: "Khắc phục lỗi hệ thống POS",
        description: "Xử lý lỗi hệ thống POS không đồng bộ dữ liệu với server và bị mất giao dịch.",
        customerName: "Cửa hàng NOP",
        status: "COMPLETED",
        startDate: new Date('2024-01-15T13:00:00Z'),
        endDate: new Date('2024-01-16T17:00:00Z'),
        notes: "Đã khôi phục được dữ liệu bị mất",
        userDifficultyLevel: 4,
        userEstimatedTime: 8,
        userImpactLevel: 4,
        userUrgencyLevel: 3,
        userFormScore: 2,
        userAssessmentDate: new Date('2024-01-14T14:00:00Z')
      },
      {
        title: "Bảo trì hệ thống điều hòa trung tâm",
        description: "Kiểm tra, vệ sinh và bảo trì hệ thống điều hòa trung tâm tại tòa nhà văn phòng.",
        customerName: "Tòa nhà QRS",
        status: "PROCESSING",
        startDate: new Date('2024-01-31T08:00:00Z'),
        notes: "Cần thực hiện vào cuối tuần để không ảnh hưởng hoạt động",
        userDifficultyLevel: 3,
        userEstimatedTime: 6,
        userImpactLevel: 2,
        userUrgencyLevel: 2,
        userFormScore: 3,
        userAssessmentDate: new Date('2024-01-29T09:00:00Z')
      },
      {
        title: "Cập nhật hệ thống bảo mật mạng",
        description: "Cài đặt và cấu hình các bản vá bảo mật mới nhất cho hệ thống mạng, bao gồm firewall và IDS.",
        customerName: "Ngân hàng TUV",
        status: "RECEIVED",
        startDate: new Date('2024-02-10T09:00:00Z'),
        notes: "Cần thông báo trước cho khách hàng về thời gian downtime",
        userDifficultyLevel: 4,
        userEstimatedTime: 8,
        userImpactLevel: 4,
        userUrgencyLevel: 3,
        userFormScore: 2,
        userAssessmentDate: new Date('2024-02-08T10:00:00Z')
      },
      {
        title: "Sửa chữa máy ATM",
        description: "Khắc phục sự cố máy ATM không nhận thẻ và bị lỗi khi khách hàng thực hiện giao dịch.",
        customerName: "Ngân hàng WXY",
        status: "PROCESSING",
        startDate: new Date('2024-01-29T16:00:00Z'),
        notes: "Sự cố ảnh hưởng đến dịch vụ khách hàng, cần xử lý nhanh",
        userDifficultyLevel: 4,
        userEstimatedTime: 6,
        userImpactLevel: 4,
        userUrgencyLevel: 4,
        userFormScore: 2,
        userAssessmentDate: new Date('2024-01-28T17:00:00Z')
      }
    ];

    // Tạo maintenance cases
    for (let i = 0; i < additionalMaintenanceCases.length; i++) {
      const caseData = additionalMaintenanceCases[i];
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

    console.log(`🎉 Đã tạo thành công thêm ${additionalMaintenanceCases.length} case bảo trì mẫu!`);

  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu mẫu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy function
seedMoreMaintenanceCases();
