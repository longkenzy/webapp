import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test API without authentication
    const maintenanceCases = await db.maintenanceCase.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const incidents = await db.incident.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'No-auth API test successful',
      data: {
        maintenanceCases,
        incidents
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('No-auth API test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'No-auth API test failed',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'API error',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
