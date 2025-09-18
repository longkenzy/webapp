// Script kiểm tra dữ liệu CaseType
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCaseTypes() {
    console.log('=== KIỂM TRA DỮ LIỆU CASE TYPES ===');
    console.log('Database: ep-rapid-dream-a1b4rn5j (Development)');
    console.log('');

    try {
        const caseTypes = await prisma.caseType.findMany({
            orderBy: { name: 'asc' }
        });

        console.log(`Tổng số loại case: ${caseTypes.length}`);
        console.log('');

        if (caseTypes.length > 0) {
            console.log('Danh sách tất cả loại case:');
            console.log('=================================');
            
            const categories = {
                'Nội bộ': caseTypes.filter(ct => 
                    ct.name.includes('nội bộ') || 
                    ct.name.includes('Hỗ trợ IT') ||
                    ct.name.includes('Bảo trì hệ thống') ||
                    ct.name.includes('Cài đặt phần mềm') ||
                    ct.name.includes('Khắc phục sự cố mạng') ||
                    ct.name.includes('Backup dữ liệu') ||
                    ct.name.includes('Cập nhật hệ thống') ||
                    ct.name.includes('Hỗ trợ người dùng') ||
                    ct.name.includes('Kiểm tra bảo mật')
                ),
                'Giao hàng': caseTypes.filter(ct => 
                    ct.name.includes('Giao hàng')
                ),
                'Nhận hàng': caseTypes.filter(ct => 
                    ct.name.includes('Nhận hàng')
                ),
                'Bảo hành': caseTypes.filter(ct => 
                    ct.name.includes('Bảo hành') ||
                    ct.name.includes('Thay thế linh kiện') ||
                    ct.name.includes('Sửa chữa thiết bị')
                ),
                'Bảo trì': caseTypes.filter(ct => 
                    ct.name.includes('Bảo trì')
                ),
                'Sự cố': caseTypes.filter(ct => 
                    ct.name.includes('Sự cố')
                ),
                'Triển khai': caseTypes.filter(ct => 
                    ct.name.includes('Triển khai')
                )
            };

            Object.entries(categories).forEach(([category, caseTypes]) => {
                if (caseTypes.length > 0) {
                    console.log(`\n📁 ${category} (${caseTypes.length} loại):`);
                    caseTypes.forEach(ct => {
                        console.log(`  - ${ct.name} (${ct.isActive ? 'Active' : 'Inactive'})`);
                    });
                }
            });

            console.log('');
            console.log('✅ DỮ LIỆU CASE TYPES ĐÃ SẴN SÀNG!');
            console.log('Bây giờ bạn có thể tạo các loại case với dữ liệu phù hợp');
        } else {
            console.log('❌ Chưa có dữ liệu case types nào');
            console.log('Chạy: node seed-case-types.js để tạo dữ liệu mẫu');
        }

    } catch (error) {
        console.error('❌ Lỗi khi kiểm tra case types:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkCaseTypes();
