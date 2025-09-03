import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Find user by email or username
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: email }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        status: true,
        role: true
      }
    });

    if (!user) {
      // Return generic error for security
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if password is correct
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Return generic error for security
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Return user status and basic info
    return NextResponse.json({
      status: user.status,
      role: user.role,
      email: user.email,
      username: user.username
    });

  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
