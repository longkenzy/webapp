const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPI() {
  try {
    console.log('Testing API logic...');
    
    // Test the same query as in the API
    const incidents = await prisma.incident.findMany({
      take: 10,
      orderBy: { createdAt: "asc" },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true
          }
        },
        handler: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true
          }
        },
        customer: {
          select: {
            id: true,
            fullCompanyName: true,
            shortName: true,
            contactPerson: true,
            contactPhone: true
          }
        },
        incidentType: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });
    
    console.log('Incidents found:', incidents.length);
    console.log('Sample incidents:', incidents);
    
  } catch (error) {
    console.error('Error testing API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();
















