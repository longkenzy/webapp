const { PrismaClient } = require('@prisma/client');

// Employee data from the provided information
const employeesData = [
  {
    fullName: "Huỳnh Thanh Long",
    dateOfBirth: new Date("2002-10-25"),
    gender: "Nam",
    hometown: "Gia Lai",
    religion: "Không",
    ethnicity: "Kinh",
    startDate: new Date("2025-07-12"),
    primaryPhone: "0867432507",
    secondaryPhone: "0867432507",
    personalEmail: "it.htlong25@gmail.com",
    companyEmail: "longht@smartservices.com.vn",
    placeOfBirth: "Gia Lai",
    permanentAddress: "Thôn Thắng Kiên, Xã Đề Gi, Tỉnh Gia Lai",
    temporaryAddress: "76E, Đường số 36, Khu Phố 18, Phường Thủ Đức, Tp. Hồ Chí Minh"
  },
  {
    fullName: "Đoàn Trí Khương",
    dateOfBirth: new Date("2004-03-13"),
    gender: "Nam",
    hometown: "Đồng Tháp",
    religion: "Không",
    ethnicity: "Kinh",
    startDate: new Date("2025-04-24"),
    primaryPhone: "0842190719",
    secondaryPhone: null,
    personalEmail: "trikhuongdoan@gmail.com",
    companyEmail: "khuongdt@smartservices.com.vn",
    placeOfBirth: "Đồng Tháp",
    permanentAddress: "Tổ 5, Ấp An Thọ, Xã An Phước, Tỉnh Đồng Tháp",
    temporaryAddress: "326, Nguyền Văn Khối, Phường Thông Tây Hội, TP. Hồ Chí Minh"
  },
  {
    fullName: "Trần Nguyễn Anh Khoa",
    dateOfBirth: new Date("1996-09-04"),
    gender: "Nam",
    hometown: "Gia Lai",
    religion: "Công Giáo",
    ethnicity: "Kinh",
    startDate: new Date("2025-02-19"),
    primaryPhone: "0779115679",
    secondaryPhone: null,
    personalEmail: "akhoa.rm96@gmail.com",
    companyEmail: "khoatna@smartservices.com.vn",
    placeOfBirth: "Hồ Chí Minh",
    permanentAddress: "258 Hiền Vương, Phường Phú Thạnh, TP. Hồ Chí Minh",
    temporaryAddress: null
  },
  {
    fullName: "Trần Anh Vũ",
    dateOfBirth: new Date("2002-07-04"),
    gender: "Nam",
    hometown: "Hồ Chí Minh",
    religion: "Không",
    ethnicity: "Kinh",
    startDate: new Date("2023-01-09"),
    primaryPhone: "0903570744",
    secondaryPhone: null,
    personalEmail: "poke742002@gmail.com",
    companyEmail: "vuta@smartservices.com.vn",
    placeOfBirth: "Hồ Chí Minh",
    permanentAddress: "170/8B Hoàng Văn Thụ, Khu phố 4, phường Đức Nhuận, TP. Hồ Chí Minh",
    temporaryAddress: "C7D/27E14, Ấp 42 Phạm Hùng, xã Bình Hưng Tp. Hồ Chí Minh"
  },
  {
    fullName: "Nguyễn Tấn Đạt",
    dateOfBirth: new Date("2002-03-02"),
    gender: "Nam",
    hometown: "DakLak",
    religion: "Phật",
    ethnicity: "Kinh",
    startDate: new Date("2025-04-21"),
    primaryPhone: "0833591894",
    secondaryPhone: null,
    personalEmail: "nguyentandat0002@gmail.com",
    companyEmail: "datnt@smartservices.com.vn",
    placeOfBirth: "Gia Lai",
    permanentAddress: "193/31 Nguyễn Văn Cừ, Phường Tân Lập, Buôn Ma Thuột, DakLak",
    temporaryAddress: null
  },
  {
    fullName: "Trần Trọng Nghĩa",
    dateOfBirth: new Date("2002-06-02"),
    gender: "Nam",
    hometown: "Tây Ninh",
    religion: "Không",
    ethnicity: "Kinh",
    startDate: new Date("2025-05-26"),
    primaryPhone: "0356503352",
    secondaryPhone: null,
    personalEmail: "trannghia2062002@gmail.com",
    companyEmail: "nghiatt.sms@outlook.com",
    placeOfBirth: "Tây Ninh",
    permanentAddress: "Số 3438 QL22 ,P. An Tịnh, Tây Ninh",
    temporaryAddress: "266/13 Lê Trọng Tấn,P. Tây Thạnh, TP. HCM"
  },
  {
    fullName: "Nguyễn Ngọc Quế Trâm",
    dateOfBirth: new Date("2001-05-06"),
    gender: "Nữ",
    hometown: "Đồng Tháp",
    religion: "Không",
    ethnicity: "Kinh",
    startDate: new Date("2024-10-28"),
    primaryPhone: "0869319117",
    secondaryPhone: null,
    personalEmail: "quetram6521@gmail.com",
    companyEmail: "tramnnq@smartservices.com.vn",
    placeOfBirth: "Đồng Tháp",
    permanentAddress: "Ấp 6, xã Tân Đông, tỉnh Đồng Tháp",
    temporaryAddress: "273/40/4 Nguyễn Văn Đậu, P. Bình Lợi Trung, Tp HCM"
  },
  {
    fullName: "Nguyễn Trung Thu Hiền",
    dateOfBirth: new Date("2005-12-16"),
    gender: "Nữ",
    hometown: "Hà Nội",
    religion: "Không",
    ethnicity: "Kinh",
    startDate: new Date("2025-02-07"),
    primaryPhone: "0373910512",
    secondaryPhone: null,
    personalEmail: "nguyenhien2802@gmail.com",
    companyEmail: "hiennt.sms@outlook.com",
    placeOfBirth: "Hồ Chí Minh",
    permanentAddress: "108/18, Tô Hiệu, Phường Phú Thạnh, TP Hồ Chí Minh",
    temporaryAddress: "108/18 tô hiệu, phường phú thạnh (hiệp tân cũ), quận tân phú"
  },
  {
    fullName: "Đào Nguyễn Kim Ngọc",
    dateOfBirth: new Date("1998-04-01"),
    gender: "Nữ",
    hometown: "Hồ Chí Minh",
    religion: "Không",
    ethnicity: "Kinh",
    startDate: new Date("2025-02-06"),
    primaryPhone: "0933512955",
    secondaryPhone: null,
    personalEmail: "dnkimngoc0104@gmail.com",
    companyEmail: "ngocdnk@smartservices.com.vn",
    placeOfBirth: "Hồ Chí Minh",
    permanentAddress: "77/12 Kp Bình Đường 1, Phường Dĩ An, TP Hồ Chí Minh",
    temporaryAddress: "45/39 Bình Đường 1, P. Dĩ An, TP HCM"
  },
  {
    fullName: "Chế Thành Luân",
    dateOfBirth: new Date("1992-07-08"),
    gender: "Nam",
    hometown: "Quảng Ngãi",
    religion: "Không",
    ethnicity: "Kinh",
    startDate: new Date("2025-06-10"),
    primaryPhone: "0942291393",
    secondaryPhone: null,
    personalEmail: "chethanhluan@gmail.com",
    companyEmail: "luanct@smartservices.com.vn",
    placeOfBirth: "Quảng Ngãi",
    permanentAddress: "Thôn 2, Xã Mỏ Cày, Quảng Ngãi",
    temporaryAddress: "28/3/4 Văn Chung, Phường Tân Bình, TPHCM"
  },
  {
    fullName: "Trần Hoàng Phúc",
    dateOfBirth: new Date("1998-10-09"),
    gender: "Nam",
    hometown: "Hồ Chí Minh",
    religion: "Phật",
    ethnicity: "Kinh",
    startDate: new Date("2025-03-10"),
    primaryPhone: "0936762430",
    secondaryPhone: null,
    personalEmail: "tranhoangphuc943@gmail.com",
    companyEmail: "phucth@smartservices.com.vn",
    placeOfBirth: "Đồng Nai",
    permanentAddress: "Thôn Tân Hiệp 2, xã Phú Riềng, Đồng Nai",
    temporaryAddress: "138/11/19 Nguyễn Duy Cung Phường An Hội Tây, TP HCM"
  },
  {
    fullName: "Nguyễn Thành Đạt",
    dateOfBirth: new Date("2003-07-28"),
    gender: "Nam",
    hometown: "DakLak",
    religion: "Không",
    ethnicity: "Kinh",
    startDate: new Date("2025-05-16"),
    primaryPhone: "0384803776",
    secondaryPhone: null,
    personalEmail: "thanhdatnguyen715@gmail.com",
    companyEmail: "datnt.sms@outlook.com",
    placeOfBirth: "DakLak",
    permanentAddress: "Thôn Sơn Thọ, P. Bình Kiến, DakLak",
    temporaryAddress: "262 Lê Đức Thọ, Phường An Nhơn, TP. HCM"
  },
  {
    fullName: "Trần Công Vũ",
    dateOfBirth: new Date("2003-04-25"),
    gender: "Nam",
    hometown: "Nghệ An",
    religion: "Không",
    ethnicity: "Kinh",
    startDate: new Date("2025-06-24"),
    primaryPhone: "0902652241",
    secondaryPhone: null,
    personalEmail: "trancongvu2542003@gmail.com",
    companyEmail: "vutc.sms@outlook.com",
    placeOfBirth: "Nghệ An",
    permanentAddress: "129/17 Tân Phú 1, Phường Tân Đông Hiệp, TP Hồ Chí Minh",
    temporaryAddress: null
  }
];

async function insertEmployees(databaseUrl, environment) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    console.log(`\n=== Inserting employees into ${environment} database ===`);
    
    // Check existing employees
    const existingEmployees = await prisma.employee.findMany({
      select: { companyEmail: true }
    });
    
    console.log(`Found ${existingEmployees.length} existing employees`);
    
    const existingEmails = new Set(existingEmployees.map(emp => emp.companyEmail));
    
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const employeeData of employeesData) {
      if (existingEmails.has(employeeData.companyEmail)) {
        console.log(`Skipping ${employeeData.fullName} - email already exists: ${employeeData.companyEmail}`);
        skippedCount++;
        continue;
      }
      
      try {
        const newEmployee = await prisma.employee.create({
          data: employeeData
        });
        
        console.log(`✅ Inserted: ${newEmployee.fullName} (${newEmployee.companyEmail})`);
        insertedCount++;
      } catch (error) {
        console.error(`❌ Error inserting ${employeeData.fullName}:`, error.message);
      }
    }
    
    console.log(`\n=== Summary for ${environment} ===`);
    console.log(`Inserted: ${insertedCount} employees`);
    console.log(`Skipped: ${skippedCount} employees (already exist)`);
    console.log(`Total processed: ${employeesData.length} employees`);
    
  } catch (error) {
    console.error(`Error in ${environment} database:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  // Development database
  const devUrl = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  
  // Production database
  const prodUrl = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  
  console.log("Starting employee insertion process...");
  
  // Insert into development database
  await insertEmployees(devUrl, "DEVELOPMENT");
  
  // Insert into production database
  await insertEmployees(prodUrl, "PRODUCTION");
  
  console.log("\n=== Employee insertion process completed ===");
}

main().catch(console.error);
