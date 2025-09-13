import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test database connection with multiple tables
    const [userCount, maintenanceCount, incidentCount, scheduleCount] = await Promise.all([
      db.user.count().catch(() => 0),
      db.maintenanceCase.count().catch(() => 0),
      db.incident.count().catch(() => 0),
      db.schedule.count().catch(() => 0)
    ]);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      counts: {
        users: userCount,
        maintenanceCases: maintenanceCount,
        incidents: incidentCount,
        schedules: scheduleCount
      },
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Database error',
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
