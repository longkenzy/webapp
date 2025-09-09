const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkIncidents() {
  try {
    console.log('Checking incidents table...');
    
    // Check incidents table structure
    const incidents = await prisma.incident.findMany({
      take: 5
    });
    console.log('Incidents found:', incidents.length);
    console.log('Sample incidents:', incidents);
    
    // Check if incidentTypeId column exists
    const sampleIncident = incidents[0];
    if (sampleIncident) {
      console.log('Sample incident fields:', Object.keys(sampleIncident));
    }
    
  } catch (error) {
    console.error('Error checking incidents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIncidents();





