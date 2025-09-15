import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/notifications/unread-count - Starting request');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.id ? 'Found' : 'Not found');
    
    if (!session?.user?.id) {
      console.log('Unauthorized: No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if notification table exists first
    try {
      await db.notification.count();
    } catch (dbError) {
      console.error('Database connection test failed for unread count:', dbError);
      // Return 0 instead of error
      return NextResponse.json({ unreadCount: 0 });
    }

    // Get unread count for the current user
    const unreadCount = await db.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    });

    console.log('Unread count for user', session.user.id, ':', unreadCount);

    return NextResponse.json({ unreadCount });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { unreadCount: 0 }, // Return 0 instead of error to prevent UI breaking
      { status: 200 }
    );
  }
}
