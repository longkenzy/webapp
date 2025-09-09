const { PrismaClient } = require('@prisma/client');

// Use development database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function checkAllEmployees() {
  try {
    console.log('Checking all employees...');
    
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\nTotal employees found: ${employees.length}`);
    console.log('\n=== All Employees ===');
    
    employees.forEach((emp, index) => {
      console.log(`\n${index + 1}. ${emp.fullName}`);
      console.log(`   Company Email: ${emp.companyEmail}`);
      console.log(`   Personal Email: ${emp.personalEmail}`);
      console.log(`   Phone: ${emp.primaryPhone}`);
      console.log(`   Department: ${emp.department || 'N/A'}`);
      console.log(`   Position: ${emp.position || 'N/A'}`);
      console.log(`   Start Date: ${emp.startDate.toLocaleDateString('vi-VN')}`);
      console.log(`   Created: ${emp.createdAt.toLocaleDateString('vi-VN')}`);
    });
    
    // Check for the newly added employees
    const newEmployees = employees.filter(emp => 
      emp.companyEmail.includes('@smartservices.com.vn') || 
      emp.companyEmail.includes('@outlook.com')
    );
    
    console.log(`\n=== Newly Added Employees (${newEmployees.length}) ===`);
    newEmployees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.fullName} - ${emp.companyEmail}`);
    });
    
  } catch (error) {
    console.error('Error checking employees:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllEmployees();
