'use client';

import { useState, useEffect } from 'react';
import { X, Save, Shield, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Role } from '@prisma/client';

interface User {
  id: string;
  email: string;
  name?: string;
  username: string;
  role: Role;
  status?: string;
  department?: string;
}

interface EditPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userId: string, updates: { role: Role; status: string; username?: string; password?: string }) => Promise<void>;
}

export default function EditPermissionsModal({ isOpen, onClose, user, onSave }: EditPermissionsModalProps) {
  const [role, setRole] = useState<Role>(Role.USER);
  const [status, setStatus] = useState<string>('active');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setStatus(user.status || 'active');
      setUsername(user.username);
      setPassword('');
      setError('');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    // Validate username
    if (!username.trim()) {
      setError('Username không được để trống');
      return;
    }

    if (username.length < 3) {
      setError('Username phải có ít nhất 3 ký tự');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username chỉ được chứa chữ cái, số và dấu gạch dưới');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const updates: any = { role, status };
      
      // Only include username if it changed
      if (username !== user.username) {
        updates.username = username;
      }
      
      // Only include password if it's provided
      if (password.trim() !== '') {
        if (password.length < 6) {
          setError('Mật khẩu phải có ít nhất 6 ký tự');
          setIsLoading(false);
          return;
        }
        updates.password = password;
      }

      await onSave(user.id, updates);
      onClose();
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDescription = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'Quyền truy cập đầy đủ vào tất cả tính năng hệ thống';
      case Role.IT_LEAD:
        return 'Quyền quản lý IT staff và xử lý ticket ưu tiên cao';
      case Role.IT_STAFF:
        return 'Quyền xử lý ticket và quản lý cơ bản';
      case Role.USER:
        return 'Quyền tạo ticket và xem thông tin cá nhân';
      default:
        return '';
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa thông tin tài khoản</h3>
              <p className="text-sm text-gray-500">Cập nhật thông tin và quyền truy cập</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - 2 Column Layout */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - User Info & Basic Settings */}
            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-200 rounded-full">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name || user.username}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">ID: {user.id}</p>
                  </div>
                </div>
              </div>

              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập username mới"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Username phải có ít nhất 3 ký tự, chỉ chứa chữ cái, số và dấu gạch dưới
                </p>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Để trống nếu không thay đổi mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Để trống nếu không muốn thay đổi mật khẩu. Mật khẩu mới phải có ít nhất 6 ký tự.
                </p>
              </div>
            </div>

            {/* Right Column - Role & Status */}
            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Phân quyền hệ thống
                </label>
                <div className="space-y-2">
                  {Object.values(Role).map((roleOption) => (
                    <label key={roleOption} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value={roleOption}
                        checked={role === roleOption}
                        onChange={(e) => setRole(e.target.value as Role)}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {roleOption === Role.ADMIN && 'Admin'}
                            {roleOption === Role.IT_LEAD && 'IT Lead'}
                            {roleOption === Role.IT_STAFF && 'IT Staff'}
                            {roleOption === Role.USER && 'User'}
                          </span>
                          {role === roleOption && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Hiện tại
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {getRoleDescription(roleOption)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Trạng thái tài khoản
                </label>
                <div className="space-y-2">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={status === 'active'}
                      onChange={(e) => setStatus(e.target.value)}
                      className="mt-1 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">Hoạt động</span>
                        {status === 'active' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Hiện tại
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Tài khoản có thể đăng nhập và sử dụng hệ thống
                      </p>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={status === 'inactive'}
                      onChange={(e) => setStatus(e.target.value)}
                      className="mt-1 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">Bị khóa</span>
                        {status === 'inactive' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Hiện tại
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Tài khoản bị khóa, không thể đăng nhập vào hệ thống
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

                        {/* Warning for Admin role - Full Width */}
              {role === Role.ADMIN && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Cảnh báo bảo mật</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Quyền Admin cung cấp quyền truy cập đầy đủ vào hệ thống. 
                        Chỉ cấp quyền này cho những người thực sự cần thiết.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning for Inactive status - Full Width */}
              {status === 'inactive' && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Cảnh báo khóa tài khoản</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Khi chọn trạng thái "Không hoạt động", tài khoản này sẽ bị khóa và không thể đăng nhập vào hệ thống. 
                        Người dùng sẽ nhận được thông báo "Tài khoản đã bị khóa" khi cố gắng đăng nhập.
                        {role === Role.ADMIN && ' Đặc biệt chú ý: Khóa tài khoản Admin có thể ảnh hưởng đến quyền quản trị hệ thống.'}
                        {(role === Role.IT_LEAD || role === Role.IT_STAFF) && ' Chú ý: Khóa tài khoản IT Staff có thể ảnh hưởng đến việc xử lý ticket.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

          {/* Error Message - Full Width */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

