'use client';

import { useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash } from 'lucide-react';
import CreateInternalCaseModal from './CreateInternalCaseModal';

interface InternalCase {
  id: string;
  title: string;
  requester: string;
  handler: string;
  caseType: string;
  status: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export default function InternalCasePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const mockCases: InternalCase[] = [
    {
      id: '1',
      title: 'Cài đặt phần mềm mới cho phòng IT',
      requester: 'Nguyễn Văn A',
      handler: 'Trần Thị B',
      caseType: 'Cài đặt phần mềm',
      status: 'Đang xử lý',
      startDate: '03/09/2025 08:30',
      endDate: '05/09/2025 17:00',
      createdAt: '02/09/2025'
    },
    {
      id: '2',
      title: 'Bảo trì máy chủ hệ thống',
      requester: 'Lê Văn C',
      handler: 'Phạm Văn D',
      caseType: 'Bảo trì',
      status: 'Hoàn thành',
      startDate: '01/09/2025 09:00',
      endDate: '02/09/2025 16:00',
      createdAt: '31/08/2025'
    },
    {
      id: '3',
      title: 'Kiểm tra bảo mật mạng',
      requester: 'Hoàng Thị E',
      handler: 'Vũ Văn F',
      caseType: 'Kiểm tra bảo mật',
      status: 'Tiếp nhận',
      startDate: '04/09/2025 10:00',
      createdAt: '03/09/2025'
    }
  ];

  const filteredCases = mockCases.filter(case_ =>
    case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.handler.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tiếp nhận':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Đang xử lý':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Hoàn thành':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Tạm dừng':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Case Nội Bộ</h1>
              <p className="text-slate-600">Quản lý và theo dõi các case nội bộ của công ty</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              <span>Tạo Case Nội Bộ</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm case..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all duration-200">
                <Filter className="h-4 w-4" />
                <span>Lọc</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cases Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Thông tin Case
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Người yêu cầu
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Người xử lý
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Loại case
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((case_) => (
                  <tr key={case_.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900 mb-1">
                          {case_.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          ID: {case_.id} • Tạo: {case_.createdAt}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{case_.requester}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{case_.handler}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">{case_.caseType}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(case_.status)}`}>
                        {case_.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">
                        <div>Bắt đầu: {case_.startDate}</div>
                        {case_.endDate && (
                          <div className="text-slate-500">Kết thúc: {case_.endDate}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCases.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Không tìm thấy case nào</h3>
              <p className="text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc tạo case mới</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Case Modal */}
      <CreateInternalCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
