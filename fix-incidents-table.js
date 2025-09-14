const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixIncidentsTable() {
  try {
    console.log('Checking incidents table structure...');
    
    // Check if incidentTypeId column exists
    const incidents = await prisma.incident.findMany({
      take: 1
    });
    
    if (incidents.length > 0) {
      console.log('Sample incident fields:', Object.keys(incidents[0]));
      
      // Check if incidentTypeId exists
      if (incidents[0].incidentTypeId) {
        console.log('incidentTypeId column exists');
      } else {
        console.log('incidentTypeId column does not exist');
      }
    } else {
      console.log('No incidents found');
    }
    
    // Try to create a test incident
    console.log('Creating test incident...');
    const testIncident = await prisma.incident.create({
      data: {
        title: 'Test Incident',
        description: 'Test description',
        reporterId: 'test-reporter',
        handlerId: 'test-handler',
        incidentTypeId: 'clx0000000000000000000009', // 'Khác'
        startDate: new Date(),
        status: 'RECEIVED'
      }
    });
    console.log('Test incident created:', testIncident);
    
    // Clean up
    await prisma.incident.delete({
      where: { id: testIncident.id }
    });
    console.log('Test incident deleted');
    
  } catch (error) {
    console.error('Error fixing incidents table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixIncidentsTable();
















