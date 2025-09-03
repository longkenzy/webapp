'use client';

import { useState } from 'react';
import { X, Info, Calendar } from 'lucide-react';

interface CreateInternalCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateInternalCaseModal({ isOpen, onClose }: CreateInternalCaseModalProps) {
  const [formData, setFormData] = useState({
    requester: '',
    position: '',
    handler: '',
    caseType: '',
    form: 'Onsite',
    title: '',
    description: '',
    startDate: '03/09/2025 08:31 AM',
    endDate: '',
    status: 'Tiếp nhận',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // TODO: Handle form submission
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        {/* Simple Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Tạo Case Nội Bộ</h2>
            <p className="text-gray-600 mt-1">Điền thông tin để tạo case nội bộ mới</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Simple Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Row 1: Người yêu cầu & Chức danh */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Người yêu cầu <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.requester}
                  onChange={(e) => handleInputChange('requester', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Chọn nhân sự</option>
                  <option value="nguyen-van-a">Nguyễn Văn A</option>
                  <option value="tran-thi-b">Trần Thị B</option>
                  <option value="le-van-c">Lê Văn C</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chức danh
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Nhập chức danh"
                />
              </div>
            </div>

            {/* Row 2: Người xử lý */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Người xử lý <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.handler}
                onChange={(e) => handleInputChange('handler', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Chọn nhân sự</option>
                <option value="tran-thi-b">Trần Thị B</option>
                <option value="pham-van-d">Phạm Văn D</option>
                <option value="vu-van-f">Vũ Văn F</option>
              </select>
            </div>

            {/* Row 3: Loại case & Hình thức */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại case <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.caseType}
                  onChange={(e) => handleInputChange('caseType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Chọn loại case</option>
                  <option value="cai-dat-phan-mem">Cài đặt phần mềm</option>
                  <option value="bao-tri">Bảo trì</option>
                  <option value="kiem-tra-bao-mat">Kiểm tra bảo mật</option>
                  <option value="cai-dat-thiet-bi">Cài đặt thiết bị</option>
                  <option value="ho-tro-ky-thuat">Hỗ trợ kỹ thuật</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <span>Hình thức</span>
                  <div className="relative group">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      Chọn hình thức xử lý case
                    </div>
                  </div>
                </label>
                <select
                  value={formData.form}
                  onChange={(e) => handleInputChange('form', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="Onsite">Onsite</option>
                  <option value="Remote">Remote</option>
                  <option value="Phone">Phone</option>
                  <option value="Email">Email</option>
                </select>
              </div>
            </div>

            {/* Row 4: Vụ việc */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <span>Vụ việc</span>
                <div className="relative group">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Nhập tiêu đề ngắn gọn cho vụ việc
                  </div>
                </div>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Nhập tiêu đề vụ việc"
                required
              />
            </div>

            {/* Row 5: Mô tả chi tiết */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Mô tả chi tiết vấn đề..."
                required
              />
            </div>

            {/* Row 6: Bắt đầu & Kết thúc */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bắt đầu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kết thúc
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="dd/mm/yyyy --:--"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 7: Trạng thái & Ghi chú */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="Tiếp nhận">Tiếp nhận</option>
                  <option value="Đang xử lý">Đang xử lý</option>
                  <option value="Tạm dừng">Tạm dừng</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Đã hủy">Đã hủy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Ghi chú thêm (nếu có)..."
                />
              </div>
            </div>
          </div>

          {/* Simple Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tạo Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
