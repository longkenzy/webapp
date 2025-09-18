// Script tạo dữ liệu mẫu cho các loại case
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCaseTypes() {
    console.log('=== TẠO DỮ LIỆU MẪU CHO CÁC LOẠI CASE ===');
    console.log('Database: ep-rapid-dream-a1b4rn5j (Development)');
    console.log('');

    try {
        // Dữ liệu mẫu cho các loại case
        const caseTypesData = [
            // Case nội bộ
            {
                name: 'Hỗ trợ IT nội bộ',
                isActive: true
            },
            {
                name: 'Bảo trì hệ thống',
                isActive: true
            },
            {
                name: 'Cài đặt phần mềm',
                isActive: true
            },
            {
                name: 'Khắc phục sự cố mạng',
                isActive: true
            },
            {
                name: 'Backup dữ liệu',
                isActive: true
            },
            {
                name: 'Cập nhật hệ thống',
                isActive: true
            },
            {
                name: 'Hỗ trợ người dùng',
                isActive: true
            },
            {
                name: 'Kiểm tra bảo mật',
                isActive: true
            },

            // Case giao hàng
            {
                name: 'Giao hàng thiết bị IT',
                isActive: true
            },
            {
                name: 'Giao hàng phần mềm',
                isActive: true
            },
            {
                name: 'Giao hàng phụ kiện',
                isActive: true
            },
            {
                name: 'Giao hàng khẩn cấp',
                isActive: true
            },
            {
                name: 'Giao hàng theo lịch',
                isActive: true
            },
            {
                name: 'Giao hàng đặc biệt',
                isActive: true
            },

            // Case nhận hàng
            {
                name: 'Nhận hàng thiết bị mới',
                isActive: true
            },
            {
                name: 'Nhận hàng thay thế',
                isActive: true
            },
            {
                name: 'Nhận hàng bảo hành',
                isActive: true
            },
            {
                name: 'Kiểm tra chất lượng',
                isActive: true
            },
            {
                name: 'Nhận hàng khẩn cấp',
                isActive: true
            },

            // Case bảo hành
            {
                name: 'Bảo hành phần cứng',
                isActive: true
            },
            {
                name: 'Bảo hành phần mềm',
                isActive: true
            },
            {
                name: 'Bảo hành mở rộng',
                isActive: true
            },
            {
                name: 'Thay thế linh kiện',
                isActive: true
            },
            {
                name: 'Sửa chữa thiết bị',
                isActive: true
            },
            {
                name: 'Bảo hành tại chỗ',
                isActive: true
            },
            {
                name: 'Bảo hành gửi về hãng',
                isActive: true
            },

            // Case bảo trì
            {
                name: 'Bảo trì định kỳ',
                isActive: true
            },
            {
                name: 'Bảo trì phòng ngừa',
                isActive: true
            },
            {
                name: 'Bảo trì khắc phục',
                isActive: true
            },
            {
                name: 'Bảo trì hệ thống mạng',
                isActive: true
            },
            {
                name: 'Bảo trì server',
                isActive: true
            },
            {
                name: 'Bảo trì thiết bị văn phòng',
                isActive: true
            },
            {
                name: 'Bảo trì phần mềm',
                isActive: true
            },
            {
                name: 'Bảo trì cơ sở hạ tầng',
                isActive: true
            },

            // Case sự cố
            {
                name: 'Sự cố hệ thống',
                isActive: true
            },
            {
                name: 'Sự cố mạng',
                isActive: true
            },
            {
                name: 'Sự cố phần mềm',
                isActive: true
            },
            {
                name: 'Sự cố phần cứng',
                isActive: true
            },
            {
                name: 'Sự cố bảo mật',
                isActive: true
            },
            {
                name: 'Sự cố dữ liệu',
                isActive: true
            },
            {
                name: 'Sự cố khẩn cấp',
                isActive: true
            },
            {
                name: 'Sự cố người dùng',
                isActive: true
            },

            // Case triển khai
            {
                name: 'Triển khai hệ thống mới',
                isActive: true
            },
            {
                name: 'Triển khai phần mềm',
                isActive: true
            },
            {
                name: 'Triển khai thiết bị',
                isActive: true
            },
            {
                name: 'Triển khai mạng',
                isActive: true
            },
            {
                name: 'Triển khai bảo mật',
                isActive: true
            },
            {
                name: 'Triển khai backup',
                isActive: true
            },
            {
                name: 'Triển khai tích hợp',
                isActive: true
            }
        ];

        console.log('Bước 1: Kiểm tra dữ liệu hiện tại...');
        const existingCaseTypes = await prisma.caseType.findMany();
        console.log(`Hiện tại có ${existingCaseTypes.length} loại case`);

        if (existingCaseTypes.length > 0) {
            console.log('Các loại case hiện có:');
            existingCaseTypes.forEach(ct => {
                console.log(`  - ${ct.name} (${ct.isActive ? 'Active' : 'Inactive'})`);
            });
        }

        console.log('');
        console.log('Bước 2: Thêm dữ liệu mẫu...');

        let addedCount = 0;
        let skippedCount = 0;

        for (const caseTypeData of caseTypesData) {
            try {
                // Kiểm tra xem loại case đã tồn tại chưa
                const existing = await prisma.caseType.findUnique({
                    where: { name: caseTypeData.name }
                });

                if (existing) {
                    console.log(`  ⚠️  Đã tồn tại: ${caseTypeData.name}`);
                    skippedCount++;
                } else {
                    await prisma.caseType.create({
                        data: caseTypeData
                    });
                    console.log(`  ✅ Đã thêm: ${caseTypeData.name}`);
                    addedCount++;
                }
            } catch (error) {
                console.log(`  ❌ Lỗi khi thêm ${caseTypeData.name}: ${error.message}`);
            }
        }

        console.log('');
        console.log('Bước 3: Kiểm tra kết quả...');
        const finalCaseTypes = await prisma.caseType.findMany({
            orderBy: { name: 'asc' }
        });

        console.log(`Tổng số loại case: ${finalCaseTypes.length}`);
        console.log(`Đã thêm mới: ${addedCount}`);
        console.log(`Đã bỏ qua: ${skippedCount}`);

        console.log('');
        console.log('Danh sách tất cả loại case:');
        console.log('=================================');
        
        const categories = {
            'Nội bộ': finalCaseTypes.filter(ct => 
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
            'Giao hàng': finalCaseTypes.filter(ct => 
                ct.name.includes('Giao hàng')
            ),
            'Nhận hàng': finalCaseTypes.filter(ct => 
                ct.name.includes('Nhận hàng')
            ),
            'Bảo hành': finalCaseTypes.filter(ct => 
                ct.name.includes('Bảo hành') ||
                ct.name.includes('Thay thế linh kiện') ||
                ct.name.includes('Sửa chữa thiết bị')
            ),
            'Bảo trì': finalCaseTypes.filter(ct => 
                ct.name.includes('Bảo trì')
            ),
            'Sự cố': finalCaseTypes.filter(ct => 
                ct.name.includes('Sự cố')
            ),
            'Triển khai': finalCaseTypes.filter(ct => 
                ct.name.includes('Triển khai')
            )
        };

        Object.entries(categories).forEach(([category, caseTypes]) => {
            if (caseTypes.length > 0) {
                console.log(`\n📁 ${category} (${caseTypes.length} loại):`);
                caseTypes.forEach(ct => {
                    console.log(`  - ${ct.name}`);
                });
            }
        });

        console.log('');
        console.log('✅ HOÀN THÀNH TẠO DỮ LIỆU MẪU!');
        console.log('Các loại case đã được thêm vào database development');
        console.log('');
        console.log('Bây giờ bạn có thể:');
        console.log('  - Tạo case nội bộ với các loại case phù hợp');
        console.log('  - Tạo case giao hàng với các loại case phù hợp');
        console.log('  - Tạo case nhận hàng với các loại case phù hợp');
        console.log('  - Tạo case bảo hành với các loại case phù hợp');
        console.log('  - Tạo case bảo trì với các loại case phù hợp');
        console.log('  - Tạo case sự cố với các loại case phù hợp');
        console.log('  - Tạo case triển khai với các loại case phù hợp');

    } catch (error) {
        console.error('❌ Lỗi khi tạo dữ liệu mẫu:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

seedCaseTypes();
