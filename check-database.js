const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database structure...');
    
    // Check if IncidentType table exists and has data
    const incidentTypes = await prisma.incidentType.findMany();
    console.log('IncidentTypes found:', incidentTypes.length);
    console.log('IncidentTypes:', incidentTypes);
    
    // Check incidents table structure
    const incidents = await prisma.incident.findMany({
      take: 1,
      include: {
        reporter: true,
        handler: true,
        customer: true
      }
    });
    console.log('Sample incident:', incidents[0]);
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
