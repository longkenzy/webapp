import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
    },
  },
});

async function checkData() {
  try {
    console.log('=== CHECKING USERS ===');
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- Email: ${user.email}, Role: ${user.role}, Name: ${user.name}`);
    });
    
    console.log('\n=== CHECKING EMPLOYEES ===');
    const employees = await prisma.employee.findMany();
    console.log(`Found ${employees.length} employees:`);
    employees.forEach(employee => {
      console.log(`- Name: ${employee.fullName}, Email: ${employee.companyEmail}, Department: ${employee.department}`);
    });
    
    if (users.length === 0 && employees.length === 0) {
      console.log('\n❌ Database is completely empty!');
    } else {
      console.log('\n✅ Database has data!');
    }
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
