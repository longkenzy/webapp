'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, UserPlus, Users, Shield, Key, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Notification from '@/components/shared/common/Notification';

interface Employee {
  id: string;
  fullName: string;
  companyEmail: string;
  position: string | null;
  department: string | null;
  status: string;
}

interface CreateAccountFormData {
  employeeId: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: string;
  isActive: boolean;
}

export default function CreateAccountPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<CreateAccountFormData>({
    employeeId: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
    isActive: true,
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        // Filter only active employees who don't have accounts yet
        const activeEmployees = data.filter((emp: Employee) => emp.status === 'active');
        setEmployees(activeEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Không thể tải danh sách nhân sự');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEmployeeChange = (employeeId: string) => {
    const selectedEmployee = employees.find(emp => emp.id === employeeId);
    if (selectedEmployee) {
      setFormData(prev => ({
        ...prev,
        employeeId,
        username: selectedEmployee.companyEmail.split('@')[0] || '',
      }));
    }
  };

  const validateForm = () => {
    if (!formData.employeeId) {
      setError('Vui lòng chọn nhân sự');
      return false;
    }
    if (!formData.username) {
      setError('Vui lòng nhập tên đăng nhập');
      return false;
    }
    if (!formData.password) {
      setError('Vui lòng nhập mật khẩu');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }
    if (!formData.role) {
      setError('Vui lòng chọn quyền');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: formData.employeeId,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Có lỗi xảy ra khi tạo tài khoản');
      }

      setSuccess('Tạo tài khoản thành công!');
      setTimeout(() => {
        router.push('/admin/personnel/permissions');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedEmployee = () => {
    return employees.find(emp => emp.id === formData.employeeId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notifications */}
      {error && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}
      
      {success && (
        <Notification
          type="success"
          message={success}
          onClose={() => setSuccess('')}
        />
      )}

      {/* Main Content */}
      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/personnel/permissions"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản mới</h1>
              <p className="text-gray-600 mt-1">Tạo tài khoản đăng nhập cho nhân sự</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Chọn nhân sự</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nhân sự <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  >
                    <option value="">Chọn nhân sự</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {getSelectedEmployee() && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Thông tin nhân sự đã chọn:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Họ tên:</span>
                        <span className="ml-2 font-medium">{getSelectedEmployee()?.fullName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-medium">{getSelectedEmployee()?.companyEmail}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Chức vụ:</span>
                        <span className="ml-2 font-medium">{getSelectedEmployee()?.position || 'Chưa phân công'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Phòng ban:</span>
                        <span className="ml-2 font-medium">{getSelectedEmployee()?.department || 'Chưa phân công'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Thông tin tài khoản</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Nhập tên đăng nhập"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Nhập mật khẩu"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Nhập lại mật khẩu"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quyền <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  >
                    <option value="USER">User - Nhân viên thường</option>
                    <option value="IT_STAFF">IT Staff - Nhân viên IT</option>
                    <option value="IT_LEAD">IT Lead - Trưởng nhóm IT</option>
                    <option value="ADMIN">Admin - Quản trị viên</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Trạng thái tài khoản</h3>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label className="text-sm font-medium text-gray-700">
                  Kích hoạt tài khoản ngay sau khi tạo
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Nếu không kích hoạt, tài khoản sẽ ở trạng thái không hoạt động và không thể đăng nhập
              </p>
            </div>

            {/* Submit Button */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Save className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Tạo tài khoản</h3>
                    <p className="text-sm text-gray-600">Xác nhận để tạo tài khoản mới</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Link
                    href="/admin/personnel/permissions"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Hủy
                  </Link>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
