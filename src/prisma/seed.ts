import { PrismaClient, Role, TicketPriority, TicketStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Users
  const password = await bcrypt.hash("Passw0rd!", 10);
  const [admin, lead, staff1, staff2, user1, user2] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@it.local" },
      update: {},
      create: { 
        username: "admin",
        email: "admin@it.local", 
        password: password, 
        role: Role.ADMIN, 
        name: "Admin" 
      },
    }),
    prisma.user.upsert({
      where: { email: "lead@it.local" },
      update: {},
      create: { 
        username: "lead",
        email: "lead@it.local", 
        password: password, 
        role: Role.IT_LEAD, 
        name: "IT Lead" 
      },
    }),
    prisma.user.upsert({
      where: { email: "staff1@it.local" },
      update: {},
      create: { 
        username: "staff1",
        email: "staff1@it.local", 
        password: password, 
        role: Role.IT_STAFF, 
        name: "IT Staff 1" 
      },
    }),
    prisma.user.upsert({
      where: { email: "staff2@it.local" },
      update: {},
      create: { 
        username: "staff2",
        email: "staff2@it.local", 
        password: password, 
        role: Role.IT_STAFF, 
        name: "IT Staff 2" 
      },
    }),
    prisma.user.upsert({
      where: { email: "user1@it.local" },
      update: {},
      create: { 
        username: "user1",
        email: "user1@it.local", 
        password: password, 
        role: Role.USER, 
        name: "User 1" 
      },
    }),
    prisma.user.upsert({
      where: { email: "user2@it.local" },
      update: {},
      create: { 
        username: "user2",
        email: "user2@it.local", 
        password: password, 
        role: Role.USER, 
        name: "User 2" 
      },
    }),
  ]);

  // KPI config default
  await prisma.kPIConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      firstResponseMinutes: 60,
      resolveMinutesP1: 240,
      resolveMinutesP2: 480,
      resolveMinutesP3: 1440,
      resolveMinutesP4: 2880,
    },
  });

  // Tickets (10)
  const priorities = [TicketPriority.P1, TicketPriority.P2, TicketPriority.P3, TicketPriority.P4];
  const statuses = [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.ON_HOLD];

  for (let i = 1; i <= 10; i++) {
    const priority = priorities[i % priorities.length];
    const status = statuses[i % statuses.length];
    await prisma.ticket.create({
      data: {
        title: `Sample Ticket #${i}`,
        description: `This is a sample ticket number ${i}.`,
        priority,
        status,
        requesterId: i % 2 === 0 ? user1.id : user2.id,
        assigneeId: i % 3 === 0 ? staff1.id : staff2.id,
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * (i % 7)),
      },
    });
  }

  // Create employees
  const employees = [
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
      temporaryAddress: "76E, Đường số 36, Khu Phố 18, Phường Thủ Đức, Tp. Hồ Chí Minh",
      position: "Developer",
      department: "IT",
      status: "active",
      contractType: "Chính thức",
      avatar: null,
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
      temporaryAddress: "326, Nguyền Văn Khối, Phường Thông Tây Hội, TP. Hồ Chí Minh",
      position: "Developer",
      department: "IT",
      status: "active",
      contractType: "Thử việc",
      avatar: null,
    },
    {
      fullName: "Trần Nguyễn Anh Khoa",
      dateOfBirth: new Date("1996-04-09"),
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
      temporaryAddress: null,
      position: "Senior Developer",
      department: "IT",
      status: "active",
      contractType: "Chính thức",
      avatar: null,
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
      temporaryAddress: "C7D/27E14, Ấp 42 Phạm Hùng, xã Bình Hưng Tp. Hồ Chí Minh",
      position: "Developer",
      department: "IT",
      status: "active",
      contractType: "Chính thức",
      avatar: null,
    },
    {
      fullName: "Nguyễn Tấn Đạt",
      dateOfBirth: new Date("2002-02-03"),
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
      temporaryAddress: null,
      position: "Developer",
      department: "IT",
      status: "active",
      contractType: "Thử việc",
      avatar: null,
    },
    {
      fullName: "Trần Trọng Nghĩa",
      dateOfBirth: new Date("2002-02-06"),
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
      temporaryAddress: "266/13 Lê Trọng Tấn,P. Tây Thạnh, TP. HCM",
      position: "Developer",
      department: "IT",
      status: "active",
      contractType: "Thử việc",
      avatar: null,
    },
    {
      fullName: "Nguyễn Ngọc Quế Trâm",
      dateOfBirth: new Date("2001-06-05"),
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
      temporaryAddress: "273/40/4 Nguyễn Văn Đậu, P. Bình Lợi Trung, Tp HCM",
      position: "Designer",
      department: "Design",
      status: "active",
      contractType: "Chính thức",
      avatar: null,
    },
    {
      fullName: "Nguyễn Trung Thu Hiền",
      dateOfBirth: new Date("2005-12-16"),
      gender: "Nữ",
      hometown: "Hà Nội",
      religion: "Không",
      ethnicity: "Kinh",
      startDate: new Date("2025-07-02"),
      primaryPhone: "0373910512",
      secondaryPhone: null,
      personalEmail: "nguyenhien2802@gmail.com",
      companyEmail: "hiennt.sms@outlook.com",
      placeOfBirth: "Hồ Chí Minh",
      permanentAddress: "108/18, Tô Hiệu, Phường Phú Thạnh, TP Hồ Chí Minh",
      temporaryAddress: "108/18 tô hiệu, phường phú thạnh (hiệp tân cũ), quận tân phú",
      position: "Marketing",
      department: "Marketing",
      status: "active",
      contractType: "Thử việc",
      avatar: null,
    },
    {
      fullName: "Đào Nguyễn Kim Ngọc",
      dateOfBirth: new Date("1998-01-04"),
      gender: "Nữ",
      hometown: "Hồ Chí Minh",
      religion: "Không",
      ethnicity: "Kinh",
      startDate: new Date("2025-06-02"),
      primaryPhone: "0933512955",
      secondaryPhone: null,
      personalEmail: "dnkimngoc0104@gmail.com",
      companyEmail: "ngocdnk@smartservices.com.vn",
      placeOfBirth: "Hồ Chí Minh",
      permanentAddress: "77/12 Kp Bình Đường 1, Phường Dĩ An, TP Hồ Chí Minh",
      temporaryAddress: "45/39 Bình Đường 1, P. Dĩ An, TP HCM",
      position: "HR Manager",
      department: "HR",
      status: "active",
      contractType: "Chính thức",
      avatar: null,
    },
    {
      fullName: "Chế Thành Luân",
      dateOfBirth: new Date("1992-08-07"),
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
      temporaryAddress: "28/3/4 Văn Chung, Phường Tân Bình, TPHCM",
      position: "Project Manager",
      department: "IT",
      status: "active",
      contractType: "Chính thức",
      avatar: null,
    },
    {
      fullName: "Trần Hoàng Phúc",
      dateOfBirth: new Date("1998-09-10"),
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
      temporaryAddress: "138/11/19 Nguyễn Duy Cung Phường An Hội Tây, TP HCM",
      position: "Developer",
      department: "IT",
      status: "active",
      contractType: "Chính thức",
      avatar: null,
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
      temporaryAddress: "262 Lê Đức Thọ, Phường An Nhơn, TP. HCM",
      position: "Developer",
      department: "IT",
      status: "active",
      contractType: "Thử việc",
      avatar: null,
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
      temporaryAddress: null,
      position: "Developer",
      department: "IT",
      status: "active",
      contractType: "Thử việc",
      avatar: null,
    },
  ];

  for (const employeeData of employees) {
    await prisma.employee.upsert({
      where: { companyEmail: employeeData.companyEmail },
      update: {},
      create: employeeData,
    });
  }

  console.log(`Created ${employees.length} employees`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


