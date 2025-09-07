import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { atLeast } from '@/lib/auth/rbac';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
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
    const updateData: { role?: Role; status?: string; username?: string; password?: string; updatedAt: Date } = {
      role: role as Role,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('DELETE /api/users/[id] - Starting delete operation');
    
    const session = await getSession();
    if (!session) {
      console.log('DELETE /api/users/[id] - No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('DELETE /api/users/[id] - Session found:', { userId: session.user.id, role: session.user.role });

    // Check if user has permission to delete users
    if (!atLeast(session.user.role, Role.IT_STAFF)) {
      console.log('DELETE /api/users/[id] - Insufficient permissions');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    console.log('DELETE /api/users/[id] - Deleting user with ID:', id);

    // Prevent users from deleting themselves
    if (id === session.user.id) {
      console.log('DELETE /api/users/[id] - User trying to delete themselves');
      return NextResponse.json({ 
        error: 'Cannot delete your own account' 
      }, { status: 400 });
    }

    // Check if user exists
    console.log('DELETE /api/users/[id] - Checking if user exists');
    const existingUser = await db.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      console.log('DELETE /api/users/[id] - User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('DELETE /api/users/[id] - User found:', { email: existingUser.email, role: existingUser.role });

    // Check if user has higher role than the current user
    if (existingUser.role === Role.ADMIN && session.user.role !== Role.ADMIN) {
      return NextResponse.json({ 
        error: 'Cannot delete ADMIN user' 
      }, { status: 403 });
    }

    // Check if user is currently assigned to any active internal cases
    console.log('DELETE /api/users/[id] - Checking for active internal cases');
    
    // First, check if user has an associated employee record
    const userEmployee = await db.employee.findFirst({
      where: { 
        user: {
          id: id
        }
      }
    });
    
    let activeInternalCases = [];
    if (userEmployee) {
      activeInternalCases = await db.internalCase.findMany({
        where: {
          OR: [
            { requesterId: userEmployee.id },
            { handlerId: userEmployee.id }
          ],
          status: {
            in: ['RECEIVED', 'IN_PROGRESS']
          }
        }
      });
    }

    console.log('DELETE /api/users/[id] - Found active internal cases:', activeInternalCases.length);

    if (activeInternalCases.length > 0) {
      console.log('DELETE /api/users/[id] - Cannot delete user due to active cases');
      return NextResponse.json({
        error: `Không thể xóa tài khoản vì đang có ${activeInternalCases.length} case đang hoạt động. Vui lòng chuyển giao hoặc đóng các case này trước.`
      }, { status: 400 });
    }

    // Delete all related data first, then delete the user
    console.log('DELETE /api/users/[id] - Starting transaction to delete user and related data');
    const result = await db.$transaction(async (tx) => {
      try {
        console.log('DELETE /api/users/[id] - Transaction started');
        
        // Delete internal case worklogs
        console.log('DELETE /api/users/[id] - Deleting internal case worklogs');
        const deletedInternalCaseWorklogs = await tx.internalCaseWorklog.deleteMany({
          where: { userId: id }
        });
        console.log(`Deleted ${deletedInternalCaseWorklogs.count} internal case worklogs`);

        // Delete internal case comments
        console.log('DELETE /api/users/[id] - Deleting internal case comments');
        const deletedInternalCaseComments = await tx.internalCaseComment.deleteMany({
          where: { userId: id }
        });
        console.log(`Deleted ${deletedInternalCaseComments.count} internal case comments`);

        // Delete schedules
        console.log('DELETE /api/users/[id] - Deleting schedules');
        const deletedSchedules = await tx.schedule.deleteMany({
          where: { userId: id }
        });
        console.log(`Deleted ${deletedSchedules.count} schedules`);

        // Handle internal cases if user has employee record
        let deletedInternalCases = 0;
        
        if (userEmployee) {
          console.log('DELETE /api/users/[id] - User has employee record, handling internal cases');
          
          // Delete internal cases where employee is requester or handler
          const deletedCases = await tx.internalCase.deleteMany({
            where: { 
              OR: [
                { requesterId: userEmployee.id },
                { handlerId: userEmployee.id }
              ]
            }
          });
          deletedInternalCases = deletedCases.count;
          console.log(`Deleted ${deletedInternalCases} internal cases`);
        }

        // Delete the user
        console.log('DELETE /api/users/[id] - Deleting user');
        const deletedUser = await tx.user.delete({
          where: { id }
        });
        console.log(`Deleted user: ${deletedUser.email}`);

        const result = {
          deletedInternalCaseWorklogs: deletedInternalCaseWorklogs.count,
          deletedInternalCaseComments: deletedInternalCaseComments.count,
          deletedSchedules: deletedSchedules.count,
          deletedInternalCases: deletedInternalCases,
          deletedUser: deletedUser.email
        };
        
        console.log('DELETE /api/users/[id] - Transaction completed successfully:', result);
        return result;
      } catch (txError) {
        console.error('DELETE /api/users/[id] - Transaction error:', txError);
        throw txError;
      }
    });

    console.log('Transaction completed successfully:', result);

    return NextResponse.json({
      message: 'User deleted successfully',
      details: {
        deletedInternalCaseWorklogs: result.deletedInternalCaseWorklogs,
        deletedInternalCaseComments: result.deletedInternalCaseComments,
        deletedSchedules: result.deletedSchedules,
        deletedInternalCases: result.deletedInternalCases,
        deletedUser: result.deletedUser
      }
    });

  } catch (error) {
    console.error('DELETE /api/users/[id] - Error deleting user:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      console.error('DELETE /api/users/[id] - Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          { error: 'Không thể xóa tài khoản vì có dữ liệu liên quan. Vui lòng xóa các dữ liệu liên quan trước.' },
          { status: 400 }
        );
      }
      
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
      
      if (error.message.includes('Connection')) {
        return NextResponse.json(
          { error: 'Lỗi kết nối database. Vui lòng thử lại sau.' },
          { status: 500 }
        );
      }
    }
    
    // Log the full error for debugging
    console.error('DELETE /api/users/[id] - Full error object:', error);
    
    return NextResponse.json(
      { error: 'Internal server error. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
