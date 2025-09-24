'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Search, Filter, Download, RefreshCw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import DeliveryCaseTable from '@/components/admin/DeliveryCaseTable';
import * as XLSX from 'xlsx';
import { DeliveryCaseStatus } from '@prisma/client';

interface DeliveryCase {
  id: string;
  title: string;
  description: string;
  form: string;
  startDate: string;
  endDate: string | null;
  status: DeliveryCaseStatus;
  notes: string | null;
  userDifficultyLevel: number | null;
  userEstimatedTime: number | null;
  userImpactLevel: number | null;
  userUrgencyLevel: number | null;
  userFormScore: number | null;
  userAssessmentDate: string | null;
  adminDifficultyLevel: number | null;
  adminEstimatedTime: number | null;
  adminImpactLevel: number | null;
  adminUrgencyLevel: number | null;
  adminAssessmentDate: string | null;
  adminAssessmentNotes: string | null;
  createdAt: string;
  updatedAt: string;
  requester: {
    id: string;
    fullName: string;
    position: string;
    department: string;
    companyEmail: string;
  };
  handler: {
    id: string;
    fullName: string;
    position: string;
    department: string;
    companyEmail: string;
  };
  customer: {
    id: string;
    shortName: string;
    fullCompanyName: string;
    contactPerson: string | null;
    contactPhone: string | null;
  } | null;
  products: {
    id: string;
    name: string;
    code: string | null;
    quantity: number;
    serialNumber: string | null;
  }[];
  _count: {
    comments: number;
    worklogs: number;
    products: number;
  };
}

export default function DeliveryCasesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<DeliveryCase | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryPersonFilter, setDeliveryPersonFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deliveryPersons, setDeliveryPersons] = useState<Array<{id: string, fullName: string}>>([]);
  const [customers, setCustomers] = useState<Array<{id: string, shortName: string}>>([]);
  const [allCases, setAllCases] = useState<DeliveryCase[]>([]);


  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch all data function
  const fetchAllData = useCallback(async () => {
    try {
      // Fetch all cases for stats
      const casesResponse = await fetch('/api/delivery-cases?limit=1000');
      if (casesResponse.ok) {
        const casesData = await casesResponse.json();
        setAllCases(casesData.deliveryCases);
      }

      // Fetch delivery persons (employees)
      const deliveryPersonsResponse = await fetch('/api/employees/list');
      if (deliveryPersonsResponse.ok) {
        const deliveryPersonsData = await deliveryPersonsResponse.json();
        setDeliveryPersons(deliveryPersonsData.map((emp: any) => ({
          id: emp.id,
          fullName: emp.fullName
        })));
      }

      // Fetch customers (partners)
      const customersResponse = await fetch('/api/partners/list');
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        setCustomers(customersData.map((customer: any) => ({
          id: customer.id,
          shortName: customer.shortName
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);


  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Calculate stats
  const stats = {
    total: allCases.length,
    inProgress: allCases.filter(case_ => case_.status === 'IN_PROGRESS').length,
    completed: allCases.filter(case_ => case_.status === 'COMPLETED').length,
    cancelled: allCases.filter(case_ => case_.status === 'CANCELLED').length
  };

  const handleViewCase = (caseItem: DeliveryCase) => {
    setSelectedCase(caseItem);
    // You can implement a view modal here
    console.log('View case:', caseItem);
  };

  const handleEditCase = (caseItem: DeliveryCase) => {
    setSelectedCase(caseItem);
    // You can implement an edit modal here
    console.log('Edit case:', caseItem);
  };

  const handleDeleteCase = async (caseItem: DeliveryCase) => {
    if (confirm(`Bạn có chắc chắn muốn xóa case "${caseItem.title}"?`)) {
      try {
        const response = await fetch(`/api/delivery-cases/${caseItem.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remove the case from the local state
          setAllCases(prevCases => prevCases.filter(c => c.id !== caseItem.id));
          toast.success('Xóa case thành công!', {
            duration: 3000,
            position: 'top-right',
            style: {
              background: '#10B981',
              color: '#fff',
            },
          });
        } else {
          const error = await response.json();
          toast.error(`Lỗi: ${error.error || 'Không thể xóa case'}`, {
            duration: 4000,
            position: 'top-right',
          });
        }
      } catch (error) {
        console.error('Error deleting case:', error);
        toast.error('Lỗi kết nối. Vui lòng thử lại!', {
          duration: 4000,
          position: 'top-right',
        });
      }
    }
  };

  // Export to Excel function
  const exportToExcel = () => {
    try {
      // Filter cases based on current filters
      const filteredCases = allCases.filter(case_ => {
        // Status filter
        if (statusFilter && case_.status !== statusFilter) {
          return false;
        }

        // Delivery person filter
        if (deliveryPersonFilter && case_.requester?.id !== deliveryPersonFilter) {
          return false;
        }

        // Customer filter
        if (customerFilter && case_.customer?.id !== customerFilter) {
          return false;
        }

        // Date range filter
        if (startDate || endDate) {
          const caseDate = new Date(case_.createdAt);
          const fromDate = startDate ? new Date(startDate) : null;
          const toDate = endDate ? new Date(endDate) : null;

          if (fromDate && caseDate < fromDate) {
            return false;
          }
          if (toDate && caseDate > toDate) {
            return false;
          }
        }

        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch = 
            case_.title.toLowerCase().includes(searchLower) ||
            case_.description.toLowerCase().includes(searchLower) ||
            case_.requester?.fullName.toLowerCase().includes(searchLower) ||
            case_.handler?.fullName.toLowerCase().includes(searchLower) ||
            case_.customer?.shortName.toLowerCase().includes(searchLower);
          
          if (!matchesSearch) {
            return false;
          }
        }

        return true;
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Prepare data for export
      const exportData = filteredCases.map((case_, index) => {
        const userTotalScore = ((case_.userDifficultyLevel || 0) + (case_.userEstimatedTime || 0) + (case_.userImpactLevel || 0) + (case_.userUrgencyLevel || 0) + (case_.userFormScore || 0));
        const adminTotalScore = ((case_.adminDifficultyLevel || 0) + (case_.adminEstimatedTime || 0) + (case_.adminImpactLevel || 0) + (case_.adminUrgencyLevel || 0));
        const grandTotal = ((userTotalScore * 0.4) + (adminTotalScore * 0.6)).toFixed(2);
        
        return {
          'STT': filteredCases.length - index,
          'Tiêu đề Case': case_.title,
          'Mô tả': case_.description,
          'Người yêu cầu': case_.requester.fullName,
          'Vị trí người yêu cầu': case_.requester.position,
          'Phòng ban người yêu cầu': case_.requester.department,
          'Người giao hàng': case_.handler.fullName,
          'Vị trí người giao': case_.handler.position,
          'Phòng ban người giao': case_.handler.department,
          'Khách hàng': case_.customer?.shortName || 'Không xác định',
          'Tên công ty': case_.customer?.fullCompanyName || 'Không xác định',
          'Người liên hệ': case_.customer?.contactPerson || 'Không xác định',
          'SĐT liên hệ': case_.customer?.contactPhone || 'Không xác định',
          'Hình thức': case_.form,
          'Trạng thái': case_.status === 'RECEIVED' ? 'Tiếp nhận' : 
                       case_.status === 'IN_PROGRESS' ? 'Đang xử lý' :
                       case_.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy',
          'Ngày bắt đầu': new Date(case_.startDate).toLocaleDateString('vi-VN'),
          'Ngày kết thúc': case_.endDate ? new Date(case_.endDate).toLocaleDateString('vi-VN') : 'Chưa hoàn thành',
          'Ngày tạo': new Date(case_.createdAt).toLocaleDateString('vi-VN'),
          'Ngày cập nhật': new Date(case_.updatedAt).toLocaleDateString('vi-VN'),
          'Ghi chú': case_.notes || '',
          // User evaluation
          'User - Mức độ khó': case_.userDifficultyLevel ? 
            (case_.userDifficultyLevel === 1 ? 'Rất dễ' :
             case_.userDifficultyLevel === 2 ? 'Dễ' :
             case_.userDifficultyLevel === 3 ? 'Trung bình' :
             case_.userDifficultyLevel === 4 ? 'Khó' : 'Rất khó') : 'Chưa đánh giá',
          'User - Thời gian ước tính': case_.userEstimatedTime ?
            (case_.userEstimatedTime === 1 ? '< 30 phút' :
             case_.userEstimatedTime === 2 ? '30-60 phút' :
             case_.userEstimatedTime === 3 ? '1-2 giờ' :
             case_.userEstimatedTime === 4 ? '2-4 giờ' : '> 4 giờ') : 'Chưa đánh giá',
          'User - Mức độ ảnh hưởng': case_.userImpactLevel ?
            (case_.userImpactLevel === 1 ? 'Rất thấp' :
             case_.userImpactLevel === 2 ? 'Thấp' :
             case_.userImpactLevel === 3 ? 'Trung bình' :
             case_.userImpactLevel === 4 ? 'Cao' : 'Rất cao') : 'Chưa đánh giá',
          'User - Mức độ khẩn cấp': case_.userUrgencyLevel ?
            (case_.userUrgencyLevel === 1 ? 'Rất thấp' :
             case_.userUrgencyLevel === 2 ? 'Thấp' :
             case_.userUrgencyLevel === 3 ? 'Trung bình' :
             case_.userUrgencyLevel === 4 ? 'Cao' : 'Rất cao') : 'Chưa đánh giá',
          'User - Hình thức': case_.userFormScore === 1 ? 'Offsite/Remote' : 
                             case_.userFormScore === 2 ? 'Onsite' : 'Chưa đánh giá',
          'User - Tổng điểm': userTotalScore,
          // Admin evaluation
          'Admin - Mức độ khó': case_.adminDifficultyLevel ? 
            (case_.adminDifficultyLevel === 1 ? 'Rất dễ' :
             case_.adminDifficultyLevel === 2 ? 'Dễ' :
             case_.adminDifficultyLevel === 3 ? 'Trung bình' :
             case_.adminDifficultyLevel === 4 ? 'Khó' : 'Rất khó') : 'Chưa đánh giá',
          'Admin - Thời gian ước tính': case_.adminEstimatedTime ?
            (case_.adminEstimatedTime === 1 ? '< 30 phút' :
             case_.adminEstimatedTime === 2 ? '30-60 phút' :
             case_.adminEstimatedTime === 3 ? '1-2 giờ' :
             case_.adminEstimatedTime === 4 ? '2-4 giờ' : '> 4 giờ') : 'Chưa đánh giá',
          'Admin - Mức độ ảnh hưởng': case_.adminImpactLevel ?
            (case_.adminImpactLevel === 1 ? 'Rất thấp' :
             case_.adminImpactLevel === 2 ? 'Thấp' :
             case_.adminImpactLevel === 3 ? 'Trung bình' :
             case_.adminImpactLevel === 4 ? 'Cao' : 'Rất cao') : 'Chưa đánh giá',
          'Admin - Mức độ khẩn cấp': case_.adminUrgencyLevel ?
            (case_.adminUrgencyLevel === 1 ? 'Rất thấp' :
             case_.adminUrgencyLevel === 2 ? 'Thấp' :
             case_.adminUrgencyLevel === 3 ? 'Trung bình' :
             case_.adminUrgencyLevel === 4 ? 'Cao' : 'Rất cao') : 'Chưa đánh giá',
          'Admin - Tổng điểm': adminTotalScore || 'Chưa đánh giá',
          'Admin - Ngày đánh giá': case_.adminAssessmentDate ? new Date(case_.adminAssessmentDate).toLocaleDateString('vi-VN') : 'Chưa đánh giá',
          'Admin - Ghi chú đánh giá': case_.adminAssessmentNotes || '',
          // Total score
          'Tổng điểm cuối cùng': grandTotal,
          'Trạng thái đánh giá': (case_.adminDifficultyLevel && case_.adminEstimatedTime && case_.adminImpactLevel && case_.adminUrgencyLevel) ? 'Đã đánh giá' : 'Chưa đánh giá'
        };
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 5 },   // STT
        { wch: 30 },  // Tiêu đề Case
        { wch: 40 },  // Mô tả
        { wch: 20 },  // Người yêu cầu
        { wch: 20 },  // Vị trí người yêu cầu
        { wch: 20 },  // Phòng ban người yêu cầu
        { wch: 20 },  // Người giao hàng
        { wch: 20 },  // Vị trí người giao
        { wch: 20 },  // Phòng ban người giao
        { wch: 20 },  // Khách hàng
        { wch: 30 },  // Tên công ty
        { wch: 20 },  // Người liên hệ
        { wch: 15 },  // SĐT liên hệ
        { wch: 15 },  // Hình thức
        { wch: 15 },  // Trạng thái
        { wch: 20 },  // Ngày bắt đầu
        { wch: 20 },  // Ngày kết thúc
        { wch: 20 },  // Ngày tạo
        { wch: 20 },  // Ngày cập nhật
        { wch: 30 },  // Ghi chú
        { wch: 20 },  // User - Mức độ khó
        { wch: 20 },  // User - Thời gian ước tính
        { wch: 20 },  // User - Mức độ ảnh hưởng
        { wch: 20 },  // User - Mức độ khẩn cấp
        { wch: 15 },  // User - Hình thức
        { wch: 15 },  // User - Tổng điểm
        { wch: 20 },  // Admin - Mức độ khó
        { wch: 20 },  // Admin - Thời gian ước tính
        { wch: 20 },  // Admin - Mức độ ảnh hưởng
        { wch: 20 },  // Admin - Mức độ khẩn cấp
        { wch: 15 },  // Admin - Tổng điểm
        { wch: 20 },  // Admin - Ngày đánh giá
        { wch: 30 },  // Admin - Ghi chú đánh giá
        { wch: 20 },  // Tổng điểm cuối cùng
        { wch: 20 }   // Trạng thái đánh giá
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Case Giao Hàng");

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Case_Giao_Hang_${currentDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      // Show success message
      toast.success(`Đã xuất thành công ${exportData.length} case ra file Excel: ${filename}`, {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Có lỗi xảy ra khi xuất file Excel. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-full mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Quản lý case giao hàng</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Quản lý và theo dõi các case giao hàng đến khách hàng
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-full mx-auto px-4 py-8">

        {/* Main Content */}
        <div className="space-y-6">

        {/* Search and Filter Bar */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-green-100 rounded-md">
                        <Search className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">Tìm kiếm & Lọc</h3>
                        <p className="text-xs text-gray-600">Tìm kiếm và lọc case giao hàng theo nhiều tiêu chí</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={exportToExcel}
                        disabled={allCases.length === 0}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium">Xuất Excel</span>
                      </button>
                      <button 
                        onClick={fetchAllData}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer shadow-sm"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium">Làm mới</span>
                      </button>
                    </div>
                  </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="space-y-4">
              {/* Search Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên case, người giao hàng, khách hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  />
                </div>
              </div>

              {/* Filters Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bộ lọc
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>Trạng thái</span>
                      </div>
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="RECEIVED">Tiếp nhận</option>
                      <option value="IN_PROGRESS">Đang xử lý</option>
                      <option value="COMPLETED">Hoàn thành</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  </div>

                  {/* Delivery Person Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Người giao hàng</span>
                      </div>
                    </label>
                    <select
                      value={deliveryPersonFilter}
                      onChange={(e) => setDeliveryPersonFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả người giao hàng</option>
                      {deliveryPersons.map((deliveryPerson) => (
                        <option key={deliveryPerson.id} value={deliveryPerson.id}>
                          {deliveryPerson.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Customer Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        <span>Khách hàng</span>
                      </div>
                    </label>
                    <select
                      value={customerFilter}
                      onChange={(e) => setCustomerFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả khách hàng</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.shortName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date From Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>Từ ngày</span>
                      </div>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    />
                  </div>

                  {/* Date To Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                        <span>Đến ngày</span>
                      </div>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Active Filters & Actions */}
              {(statusFilter || deliveryPersonFilter || customerFilter || startDate || endDate || searchTerm) && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-md p-3 border border-green-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-1.5 mb-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-xs font-semibold text-gray-800">Bộ lọc đang áp dụng</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {searchTerm && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <Search className="h-2.5 w-2.5 mr-1" />
                            &quot;{searchTerm}&quot;
                          </span>
                        )}
                        {statusFilter && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1"></div>
                            Trạng thái: {statusFilter === 'RECEIVED' ? 'Tiếp nhận' : 
                                         statusFilter === 'IN_PROGRESS' ? 'Đang xử lý' :
                                         statusFilter === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
                          </span>
                        )}
                        {deliveryPersonFilter && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                            Người giao: {deliveryPersons.find(d => d.id === deliveryPersonFilter)?.fullName}
                          </span>
                        )}
                        {customerFilter && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></div>
                            Khách hàng: {customers.find(c => c.id === customerFilter)?.shortName}
                          </span>
                        )}
                        {startDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></div>
                            Từ: {new Date(startDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                        {endDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1"></div>
                            Đến: {new Date(endDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setStatusFilter('');
                        setDeliveryPersonFilter('');
                        setCustomerFilter('');
                        setStartDate('');
                        setEndDate('');
                        setSearchTerm('');
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      <span className="text-sm font-medium">Xóa tất cả</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng Case</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đang xử lý</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Package className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đã hủy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <DeliveryCaseTable
          onView={handleViewCase}
          onEdit={handleEditCase}
          onDelete={handleDeleteCase}
          searchTerm={debouncedSearchTerm}
          statusFilter={statusFilter}
          deliveryPersonFilter={deliveryPersonFilter}
          customerFilter={customerFilter}
          startDate={startDate}
          endDate={endDate}
          allCases={allCases}
        />
          </div>
        </div>
    </div>
  );
}
