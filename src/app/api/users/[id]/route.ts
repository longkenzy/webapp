import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { atLeast } from '@/lib/auth/rbac';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to edit permissions
    if (!atLeast(session.user.role, Role.IT_STAFF)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { role, status, username, password } = body;

    // Validate input
    if (!role || !Object.values(Role).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent users from editing their own role to ADMIN (security measure)
    if (id === session.user.id && role === Role.ADMIN) {
      return NextResponse.json({ 
        error: 'Cannot promote yourself to ADMIN role' 
      }, { status: 400 });
    }

    // Check if username is already taken by another user
    if (username && username !== existingUser.username) {
      const usernameExists = await db.user.findUnique({
        where: { username }
      });
      if (usernameExists) {
        return NextResponse.json({ 
          error: 'Username already exists' 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: { role?: string; status?: string; username?: string; password?: string; updatedAt: Date } = {
      role,
      status,
      updatedAt: new Date()
    };

    // Add username if provided
    if (username && username !== existingUser.username) {
      updateData.username = username;
    }

    // Add password if provided
    if (password && password.trim() !== '') {
      // Validate password strength
      if (password.length < 6) {
        return NextResponse.json({ 
          error: 'Password must be at least 6 characters long' 
        }, { status: 400 });
      }

      // Hash the password before storing
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateData.password = hashedPassword;
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        username: updatedUser.username,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete users
    if (!atLeast(session.user.role, Role.IT_STAFF)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    // Prevent users from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json({ 
        error: 'Cannot delete your own account' 
      }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has higher role than the current user
    if (existingUser.role === Role.ADMIN && session.user.role !== Role.ADMIN) {
      return NextResponse.json({ 
        error: 'Cannot delete ADMIN user' 
      }, { status: 403 });
    }

    // Check if user is currently assigned to any active tickets
    const activeTickets = await db.ticket.findMany({
      where: {
        OR: [
          { requesterId: id },
          { assigneeId: id }
        ],
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD']
        }
      }
    });

    if (activeTickets.length > 0) {
      return NextResponse.json({
        error: `Không thể xóa tài khoản vì đang có ${activeTickets.length} ticket đang hoạt động. Vui lòng chuyển giao hoặc đóng các ticket này trước.`
      }, { status: 400 });
    }

    // Delete all related data first, then delete the user
    const result = await db.$transaction(async (tx) => {
      try {
        // Delete worklogs
        const deletedWorklogs = await tx.worklog.deleteMany({
          where: { userId: id }
        });
        console.log(`Deleted ${deletedWorklogs.count} worklogs`);

        // Delete comments
        const deletedComments = await tx.comment.deleteMany({
          where: { userId: id }
        });
        console.log(`Deleted ${deletedComments.count} comments`);

        // Delete schedules
        const deletedSchedules = await tx.schedule.deleteMany({
          where: { userId: id }
        });
        console.log(`Deleted ${deletedSchedules.count} schedules`);

        // Delete tickets where user is requester (cannot have null requester)
        const deletedTickets = await tx.ticket.deleteMany({
          where: { requesterId: id }
        });
        console.log(`Deleted ${deletedTickets.count} tickets`);

        // Update tickets to remove assignee reference (if any)
        const updatedTickets = await tx.ticket.updateMany({
          where: { assigneeId: id },
          data: { assigneeId: null }
        });
        console.log(`Updated ${updatedTickets.count} tickets`);

        // Delete the user
        const deletedUser = await tx.user.delete({
          where: { id }
        });
        console.log(`Deleted user: ${deletedUser.email}`);

        return {
          deletedWorklogs: deletedWorklogs.count,
          deletedComments: deletedComments.count,
          deletedSchedules: deletedSchedules.count,
          deletedTickets: deletedTickets.count,
          updatedTickets: updatedTickets.count,
          deletedUser: deletedUser.email
        };
      } catch (txError) {
        console.error('Transaction error:', txError);
        throw txError;
      }
    });

    console.log('Transaction completed successfully:', result);

    return NextResponse.json({
      message: 'User deleted successfully',
      details: {
        deletedWorklogs: result.deletedWorklogs,
        deletedComments: result.deletedComments,
        deletedSchedules: result.deletedSchedules,
        deletedTickets: result.deletedTickets,
        updatedTickets: result.updatedTickets,
        deletedUser: result.deletedUser
      }
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          { error: 'Không thể xóa tài khoản vì có dữ liệu liên quan. Vui lòng xóa các dữ liệu liên quan trước.' },
          { status: 400 }
        );
      }
      
      // Log the specific error for debugging
      console.error('Specific error details:', error.message);
      
      // Check for common database errors
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          { error: 'Tài khoản không tồn tại hoặc đã bị xóa' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Lỗi ràng buộc duy nhất trong database' },
          { status: 400 }
        );
      }
    }
    
    // Log the full error for debugging
    console.error('Full error object:', error);
    
    return NextResponse.json(
      { error: 'Internal server error. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
