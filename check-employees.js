const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
