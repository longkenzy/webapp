'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, AlertCircle, Trash2 } from 'lucide-react';
import Notification from '@/components/shared/common/Notification';
import DeleteConfirmationModal from '@/components/shared/common/DeleteConfirmationModal';

interface Employee {
  id: string;
  fullName: string;
  dateOfBirth: Date;
  gender: string;
  hometown: string;
  religion: string;
  ethnicity: string;
  startDate: Date;
  primaryPhone: string;
  secondaryPhone: string | null;
  personalEmail: string;
  companyEmail: string;
  placeOfBirth: string;
  permanentAddress: string;
  temporaryAddress: string | null;
  position: string | null;
  department: string | null;
  status: string;
  contractType: string | null;
  avatar: string | null;
}

interface EmployeeEditFormProps {
  employee: Employee;
}

export default function EmployeeEditForm({ employee }: EmployeeEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatDateForInput = (date: Date) => {
    // Convert to Vietnam timezone and format for date input (YYYY-MM-DD)
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    fullName: employee.fullName,
    dateOfBirth: formatDateForInput(employee.dateOfBirth),
    gender: employee.gender,
    hometown: employee.hometown,
    religion: employee.religion,
    ethnicity: employee.ethnicity,
    startDate: formatDateForInput(employee.startDate),
    primaryPhone: employee.primaryPhone,
    secondaryPhone: employee.secondaryPhone || '',
    personalEmail: employee.personalEmail,
    companyEmail: employee.companyEmail,
    placeOfBirth: employee.placeOfBirth,
    permanentAddress: employee.permanentAddress,
    temporaryAddress: employee.temporaryAddress || '',
    position: employee.position || '',
    department: employee.department || '',
    status: employee.status,
    contractType: employee.contractType || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Có lỗi xảy ra khi cập nhật thông tin');
      }

      setSuccess('Cập nhật thông tin thành công!');
      setTimeout(() => {
        router.push(`/admin/personnel/view/${employee.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Có lỗi xảy ra khi xóa nhân sự');
      }

      setSuccess('Xóa nhân sự thành công!');
      setShowDeleteModal(false);
      setTimeout(() => {
        router.push('/admin/personnel/list');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsDeleting(false);
    }
  };

  const getWarningMessage = () => {
    if (employee.status === 'active') {
      return 'Nhân sự này đang có trạng thái "Đang làm việc". Vui lòng cập nhật trạng thái trước khi xóa.';
    }
    return undefined;
  };

  return (
    <>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa nhân sự"
        itemName={employee.fullName}
        isDeleting={isDeleting}
        warningMessage={getWarningMessage()}
        disabled={employee.status === 'active'}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Nhập họ và tên đầy đủ"
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Ngày sinh <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Giới tính <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              >
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Nơi sinh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="placeOfBirth"
                value={formData.placeOfBirth}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Nhập nơi sinh"
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Quê quán <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="hometown"
                value={formData.hometown}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Nhập quê quán"
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Dân tộc <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ethnicity"
                value={formData.ethnicity}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Nhập dân tộc"
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Tôn giáo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="religion"
                value={formData.religion}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Nhập tôn giáo"
              />
            </div>
          </div>
        </div>

        {/* Work Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Thông tin công việc</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Chức vụ
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Nhập chức vụ"
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Phòng ban
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Nhập phòng ban"
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Loại hợp đồng
              </label>
              <select
                name="contractType"
                value={formData.contractType}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              >
                <option value="">Chọn loại hợp đồng</option>
                <option value="Chính thức">Chính thức</option>
                <option value="Thử việc">Thử việc</option>
                <option value="Cộng tác viên">Cộng tác viên</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Trạng thái <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              >
                <option value="active">Đang làm việc</option>
                <option value="inactive">Nghỉ việc</option>
                <option value="pending">Chờ duyệt</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Thông tin liên hệ</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="primaryPhone"
                value={formData.primaryPhone}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Nhập số điện thoại chính"
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Số điện thoại phụ
              </label>
              <input
                type="tel"
                name="secondaryPhone"
                value={formData.secondaryPhone}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Nhập số điện thoại phụ (tùy chọn)"
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Email cá nhân <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="personalEmail"
                value={formData.personalEmail}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Nhập email cá nhân"
              />
            </div>

            <div className="flex items-center space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px]">
                Email công ty <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="companyEmail"
                value={formData.companyEmail}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Nhập email công ty"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Thông tin địa chỉ</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px] mt-2">
                Địa chỉ thường trú <span className="text-red-500">*</span>
              </label>
              <textarea
                name="permanentAddress"
                value={formData.permanentAddress}
                onChange={handleInputChange}
                required
                rows={3}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                placeholder="Nhập địa chỉ thường trú đầy đủ"
              />
            </div>

            <div className="flex items-start space-x-3">
              <label className="block text-sm font-semibold text-gray-700 min-w-[120px] mt-2">
                Địa chỉ tạm trú
              </label>
              <textarea
                name="temporaryAddress"
                value={formData.temporaryAddress}
                onChange={handleInputChange}
                rows={3}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                placeholder="Nhập địa chỉ tạm trú (nếu có)"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Save className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thao tác</h3>
                <p className="text-sm text-gray-600">Lưu thay đổi hoặc xóa nhân sự</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center px-4 py-3 border border-red-300 text-red-700 rounded-xl hover:bg-red-50 transition-all duration-200 font-medium"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa nhân sự
              </button>
              
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Hủy
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
