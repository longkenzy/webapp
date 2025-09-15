import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/notifications - Starting request');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.id ? 'Found' : 'Not found');
    
    if (!session?.user?.id) {
      console.log('Unauthorized: No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type');

    console.log('Query params:', { page, limit, isRead, type });

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id
    };

    if (isRead !== null && isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    if (type) {
      where.type = type;
    }

    // Check if notification table exists and is accessible
    try {
      await db.notification.count();
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      // Return empty result instead of error
      return NextResponse.json({
        notifications: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      });
    }

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.notification.count({ where })
    ]);

    console.log('Found notifications:', notifications.length, 'Total:', total);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      message,
      type,
      userId,
      caseId,
      caseType
    } = body;

    // Validate required fields
    if (!title || !message || !type || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = ['CASE_CREATED', 'CASE_UPDATED', 'CASE_COMPLETED', 'CASE_ASSIGNED', 'SYSTEM_ALERT'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Create notification
    const notification = await db.notification.create({
      data: {
        title,
        message,
        type,
        userId,
        caseId,
        caseType
      }
    });

    return NextResponse.json(notification, { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
