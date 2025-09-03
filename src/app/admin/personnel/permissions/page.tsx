'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";
import { Plus, Search, Filter, UserCheck, Users, Shield, Key, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import EditPermissionsModal from "@/components/shared/common/EditPermissionsModal";
import Notification from "@/components/shared/common/Notification";

interface User {
  id: string;
  email: string;
  name?: string;
  username: string;
  role: Role;
  status?: string;
  createdAt: Date;
}

interface Employee {
  id: string;
  fullName: string;
  companyEmail: string;
  position: string;
  department: string;
}

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function PermissionsPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    message: ''
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/login');
    }
    
    if (!atLeast(session.user.role, Role.IT_STAFF)) {
      redirect('/user/dashboard');
    }

    fetchData();
  }, [session, status]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch users
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      // Fetch employees
      const employeesResponse = await fetch('/api/employees');
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ show: true, type, message });
  };

  const handleEditPermissions = (user: User) => {
    // Prevent users from editing their own permissions
    if (session?.user?.id && user.id === session.user.id) {
      showNotification('warning', 'Bạn không thể chỉnh sửa thông tin của chính mình');
      return;
    }
    
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSavePermissions = async (userId: string, updates: { role: Role; status: string; username?: string; password?: string }) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { 
                  ...user, 
                  role: updates.role, 
                  status: updates.status,
                  username: updates.username || user.username
                }
              : user
          )
        );

        // Show different messages based on status change
        if (updates.status === 'inactive') {
          showNotification('warning', 'Tài khoản đã được khóa thành công. Người dùng sẽ không thể đăng nhập vào hệ thống.');
        } else if (updates.status === 'active') {
          showNotification('success', 'Tài khoản đã được kích hoạt thành công.');
        } else {
          showNotification('success', 'Cập nhật thông tin tài khoản thành công!');
        }
        setIsEditModalOpen(false);
        setSelectedUser(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showNotification('error', error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật thông tin tài khoản');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hoàn toàn tài khoản này? Hành động này sẽ xóa tất cả dữ liệu liên quan và không thể hoàn tác.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove user from local state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        showNotification('success', 'Xóa tài khoản thành công!');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification('error', error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa tài khoản');
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      user.name?.toLowerCase().includes(searchLower) ||
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  // Create a map of employee info by email
  const employeeMap = new Map();
  employees.forEach(emp => {
    employeeMap.set(emp.companyEmail, emp);
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Admin</span>;
      case 'IT_LEAD':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">IT Lead</span>;
      case 'IT_STAFF':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">IT Staff</span>;
      case 'USER':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">User</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{role}</span>;
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (status === 'active') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Hoạt động</span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Bị khóa</span>;
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản người dùng</h1>
            <p className="text-gray-600 mt-1">Quản lý thông tin, quyền truy cập và trạng thái tài khoản người dùng</p>
          </div>
          
          <Link
            href="/admin/personnel/permissions/create-account"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo tài khoản mới
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Tổng tài khoản</p>
                <p className="text-xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Admin</p>
                <p className="text-xl font-bold text-gray-900">{users.filter(u => u.role === 'ADMIN').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">IT Staff</p>
                <p className="text-xl font-bold text-gray-900">{users.filter(u => u.role === 'IT_STAFF' || u.role === 'IT_LEAD').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Key className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">User</p>
                <p className="text-xl font-bold text-gray-900">{users.filter(u => u.role === 'USER').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tài khoản..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                />
              </div>
              
              {/* Role Filter */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="ADMIN">Admin</option>
                <option value="IT_LEAD">IT Lead</option>
                <option value="IT_STAFF">IT Staff</option>
                <option value="USER">User</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-500">
              Hiển thị <span className="font-medium">{filteredUsers.length}</span> tài khoản
              {selectedRole !== 'all' && (
                <span className="ml-2 text-blue-600">
                  • Lọc theo vai trò: {selectedRole === 'ADMIN' ? 'Admin' : selectedRole === 'IT_LEAD' ? 'IT Lead' : selectedRole === 'IT_STAFF' ? 'IT Staff' : 'User'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thông tin tài khoản
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phân quyền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => {
                  const employee = employeeMap.get(user.email);
                  const isCurrentUser = session?.user?.id && user.id === session.user.id;
                  return (
                    <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${
                      isCurrentUser ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {user.name || user.username}
                            </span>
                            {isCurrentUser && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.username} • {user.email}
                          </div>
                          {employee && (
                            <div className="text-xs text-gray-400">
                              {employee.position} • {employee.department}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                                                      <button 
                              onClick={() => handleEditPermissions(user)}
                              disabled={session?.user?.id ? user.id === session.user.id : false}
                              className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                session?.user?.id && user.id === session.user.id
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                              title={session?.user?.id && user.id === session.user.id ? 'Không thể chỉnh sửa thông tin của chính mình' : 'Chỉnh sửa thông tin tài khoản'}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Chỉnh sửa
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={session?.user?.id ? user.id === session.user.id : false}
                              className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                session?.user?.id && user.id === session.user.id
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                              title={session?.user?.id && user.id === session.user.id ? 'Không thể xóa tài khoản của chính mình' : 'Xóa tài khoản'}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                                                              Xóa
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <Users className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'Không tìm thấy tài khoản nào' : 'Chưa có tài khoản nào'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm.' : 'Bắt đầu bằng cách tạo tài khoản cho nhân sự.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Link
                    href="/admin/personnel/permissions/create-account"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo tài khoản đầu tiên
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Permissions Modal */}
      <EditPermissionsModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={handleSavePermissions}
      />

      {/* Notification */}
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}
