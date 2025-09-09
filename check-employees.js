const { PrismaClient } = require('@prisma/client');

// Use development database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function checkEmployees() {
  try {
    console.log('Checking employees...');
    
    const employees = await prisma.employee.findMany({
      take: 5
    });
    console.log('Employees found:', employees.length);
    console.log('Sample employees:', employees);
    
  } catch (error) {
    console.error('Error checking employees:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployees();


