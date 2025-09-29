const { PrismaClient } = require('@prisma/client');

async function insertIncidentTypes() {
    const prisma = new PrismaClient();
    
    const incidentTypes = [
        {
            name: "Hardware",
            description: "Hỏng PC, laptop, server, máy in, thiết bị ngoại vi."
        },
        {
            name: "Software", 
            description: "Lỗi hệ điều hành, ứng dụng, update, patch."
        },
        {
            name: "Network",
            description: "Mất mạng LAN/WiFi/VPN, lỗi router, switch, firewall."
        },
        {
            name: "Account & Access",
            description: "Quên mật khẩu, khóa tài khoản, lỗi phân quyền."
        },
        {
            name: "Email & Collaboration",
            description: "Lỗi gửi/nhận mail, spam, Teams/Zoom/Outlook lỗi."
        },
        {
            name: "Printing & Peripheral",
            description: "Lỗi in ấn, kẹt giấy, không share máy in, ngoại vi hỏng."
        },
        {
            name: "Security",
            description: "Virus, malware, phishing, tấn công mạng, lộ dữ liệu."
        },
        {
            name: "Service Request",
            description: "Cấp tài khoản, quyền truy cập, cài phần mềm, cấp thiết bị."
        },
        {
            name: "Problem",
            description: "Sự cố lặp lại, cần phân tích nguyên nhân gốc rễ."
        },
        {
            name: "Change",
            description: "Thay đổi/nâng cấp phần mềm, hệ thống, cấu hình."
        }
    ];
    
    let inserted = 0;
    let skipped = 0;
    
    console.log('Starting incident types insertion...');
    
    for (const type of incidentTypes) {
        try {
            // Check if incident type already exists
            const existing = await prisma.incidentType.findUnique({
                where: { name: type.name }
            });
            
            if (existing) {
                console.log(`Skipping existing incident type: ${type.name}`);
                skipped++;
                continue;
            }
            
            // Insert new incident type
            await prisma.incidentType.create({
                data: {
                    name: type.name,
                    description: type.description,
                    isActive: true
                }
            });
            
            console.log(`Inserted incident type: ${type.name}`);
            inserted++;
            
        } catch (error) {
            console.error(`Error inserting ${type.name}:`, error.message);
        }
    }
    
    console.log(`\nSummary:`);
    console.log(`- Inserted: ${inserted}`);
    console.log(`- Skipped (already exists): ${skipped}`);
    
    await prisma.$disconnect();
}

insertIncidentTypes().catch(console.error);
