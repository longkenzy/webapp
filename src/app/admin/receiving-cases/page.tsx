'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Search, Filter, Download, Trash2, RefreshCw, FileText, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import ReceivingCaseTable from '@/components/admin/ReceivingCaseTable';
import CreateReceivingCaseModal from './CreateReceivingCaseModal';
import * as XLSX from 'xlsx';
import { ReceivingCaseStatus } from '@prisma/client';
import { getCurrentDateForFilename, formatVietnamDate, formatVietnamDateTime } from '@/lib/date-utils';

interface ReceivingCase {
  id: string;
  title: string;
  description: string;
  form: string;
  startDate: string;
  endDate: string | null;
  inProgressAt: string | null;
  status: ReceivingCaseStatus;
  notes: string | null;
  crmReferenceCode: string | null;
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
  supplier: {
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

export default function ReceivingCasesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<ReceivingCase | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [receiverFilter, setReceiverFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [receivers, setReceivers] = useState<Array<{id: string, fullName: string}>>([]);
  const [suppliers, setSuppliers] = useState<Array<{id: string, shortName: string}>>([]);
  const [allCases, setAllCases] = useState<ReceivingCase[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletedCases, setDeletedCases] = useState<Set<string>>(new Set());
  
  // Create/Edit modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCase, setEditingCase] = useState<ReceivingCase | null>(null);

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
      const casesResponse = await fetch('/api/receiving-cases?limit=1000');
      if (casesResponse.ok) {
        const casesData = await casesResponse.json();
        setAllCases(casesData.receivingCases);
      }

      // Fetch receivers (employees)
      const receiversResponse = await fetch('/api/employees/list');
      if (receiversResponse.ok) {
        const receiversResult = await receiversResponse.json();
        const receiversData = receiversResult.data || receiversResult;
        setReceivers(receiversData.map((emp: any) => ({
          id: emp.id,
          fullName: emp.fullName
        })));
      }

      // Fetch suppliers
      const suppliersResponse = await fetch('/api/partners/list');
      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        setSuppliers(suppliersData.map((supplier: any) => ({
          id: supplier.id,
          shortName: supplier.shortName
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

  const handleViewCase = (caseItem: ReceivingCase) => {
    setSelectedCase(caseItem);
    // You can implement a view modal here
    console.log('View case:', caseItem);
  };

  const handleEditCase = (caseItem: ReceivingCase) => {
    setEditingCase(caseItem);
    setShowCreateModal(true); // Sử dụng create modal cho edit
  };

  const handleOpenDeleteModal = (caseItem: ReceivingCase) => {
    setSelectedCase(caseItem);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedCase(null);
    setDeleting(false);
  };

  const handleCreateSuccess = (newCase: any) => {
    console.log('✅ handleCreateSuccess called with:', newCase);
    console.log('✅ New status:', newCase.status);
    console.log('✅ New endDate:', newCase.endDate);
    console.log('✅ New handler:', newCase.handler?.fullName);
    
    if (editingCase) {
      // EDIT mode: Update the case in the list immediately (optimistic update)
      setAllCases(prev => prev.map(c => 
        c.id === newCase.id ? {
          ...c,  // Keep existing data
          ...newCase,  // Override with new data
          // Ensure all fields are properly formatted
          handler: newCase.handler || c.handler,
          requester: newCase.requester || c.requester,
          supplier: newCase.supplier || c.supplier,
          products: newCase.products || c.products,
          // Explicitly update status and endDate
          status: newCase.status || c.status,
          endDate: newCase.endDate !== undefined ? newCase.endDate : c.endDate,
          startDate: newCase.startDate || c.startDate
        } : c
      ));
      console.log('✅ Updated case in list (optimistic):', newCase.id);
    } else {
      // CREATE mode: Add new case to the list
      setAllCases(prev => [newCase, ...prev]);
      console.log('✅ Added new case to list:', newCase.id);
    }
    
    // Also refresh to ensure consistency
    fetchAllData();
    
    setShowCreateModal(false);
    setEditingCase(null);
  };

  const handleDeleteCase = async () => {
    if (!selectedCase) return;

    const caseToDelete = selectedCase;
    
    try {
      setDeleting(true);
      
      // Mark case as being deleted for visual feedback
      setDeletedCases(prev => new Set(prev).add(caseToDelete.id));
      
      // Optimistic update - remove from UI immediately for better UX
      setAllCases(prevCases => 
        prevCases.filter(c => c.id !== caseToDelete.id)
      );
      
      // Close modal immediately
      handleCloseDeleteModal();
      
      // Make API call in background
      const response = await fetch(`/api/receiving-cases/${caseToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // If API call fails, restore the case to the list
        setAllCases(prevCases => [...prevCases, caseToDelete]);
        setDeletedCases(prev => {
          const newSet = new Set(prev);
          newSet.delete(caseToDelete.id);
          return newSet;
        });
        
        const error = await response.json();
        toast.error(`Lỗi: ${error.error || 'Không thể xóa case'}`, {
          duration: 4000,
          position: 'top-right',
        });
      } else {
        // Success - remove from deleted cases tracking
        setDeletedCases(prev => {
          const newSet = new Set(prev);
          newSet.delete(caseToDelete.id);
          return newSet;
        });
        
        toast.success('Xóa case thành công!', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
      }
      
    } catch (error) {
      console.error('Error deleting case:', error);
      
      // Restore the case to the list on network error
      setAllCases(prevCases => [...prevCases, caseToDelete]);
      setDeletedCases(prev => {
        const newSet = new Set(prev);
        newSet.delete(caseToDelete.id);
        return newSet;
      });
      
      toast.error('Lỗi kết nối. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setDeleting(false);
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

        // Receiver filter
        if (receiverFilter && case_.handler?.id !== receiverFilter) {
          return false;
        }

        // Supplier filter
        if (supplierFilter && case_.supplier?.id !== supplierFilter) {
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
            case_.supplier?.shortName.toLowerCase().includes(searchLower);
          
          if (!matchesSearch) {
            return false;
          }
        }

        return true;
      });

      // Prepare data for export
      const exportData = filteredCases.map((case_, index) => {
        const userTotalScore = ((case_.userDifficultyLevel || 0) + (case_.userEstimatedTime || 0) + (case_.userImpactLevel || 0) + (case_.userUrgencyLevel || 0) + (case_.userFormScore || 0));
        const adminTotalScore = ((case_.adminDifficultyLevel || 0) + (case_.adminEstimatedTime || 0) + (case_.adminImpactLevel || 0) + (case_.adminUrgencyLevel || 0));
        const grandTotal = ((userTotalScore * 0.4) + (adminTotalScore * 0.6)).toFixed(2);
        
        return {
          'STT': index + 1,
          'Tiêu đề Case': case_.title,
          'Mô tả': case_.description,
          'Người yêu cầu': case_.requester.fullName,
          'Vị trí người yêu cầu': case_.requester.position,
          'Phòng ban người yêu cầu': case_.requester.department,
          'Người nhận hàng': case_.handler.fullName,
          'Vị trí người nhận': case_.handler.position,
          'Phòng ban người nhận': case_.handler.department,
          'Nhà cung cấp': case_.supplier?.shortName || 'Không xác định',
          'Tên công ty': case_.supplier?.fullCompanyName || 'Không xác định',
          'Người liên hệ': case_.supplier?.contactPerson || 'Không xác định',
          'SĐT liên hệ': case_.supplier?.contactPhone || 'Không xác định',
          'Hình thức': case_.form,
          'Trạng thái': case_.status === 'RECEIVED' ? 'Tiếp nhận' : 
                       case_.status === 'IN_PROGRESS' ? 'Đang xử lý' :
                       case_.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy',
          'Ngày bắt đầu': formatVietnamDateTime(case_.startDate),
          'Ngày kết thúc': case_.endDate ? formatVietnamDateTime(case_.endDate) : 'Chưa hoàn thành',
          'Ngày tạo': formatVietnamDate(case_.createdAt),
          'Ngày cập nhật': formatVietnamDate(case_.updatedAt),
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
          'Admin - Ngày đánh giá': case_.adminAssessmentDate ? formatVietnamDate(case_.adminAssessmentDate) : 'Chưa đánh giá',
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
        { wch: 20 },  // Người nhận hàng
        { wch: 20 },  // Vị trí người nhận
        { wch: 20 },  // Phòng ban người nhận
        { wch: 20 },  // Nhà cung cấp
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
      XLSX.utils.book_append_sheet(wb, ws, "Case Nhận Hàng");

      // Generate filename with current date
      const currentDate = getCurrentDateForFilename();
      const filename = `Case_Nhan_Hang_${currentDate}.xlsx`;

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
      {/* iOS Safari input fix */}
      <style dangerouslySetInnerHTML={{ __html: `
        input, select, textarea {
          -webkit-text-fill-color: #111827 !important;
          opacity: 1 !important;
          color: #111827 !important;
        }
        input::placeholder, select::placeholder, textarea::placeholder {
          -webkit-text-fill-color: #9CA3AF !important;
          opacity: 1 !important;
          color: #9CA3AF !important;
        }
      ` }} />
      
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-full mx-auto px-3 md:px-4 py-3 md:py-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
                  <div className="p-1.5 md:p-2 bg-yellow-100 rounded-md flex-shrink-0">
                    <Package className="h-4 w-4 md:h-6 md:w-6 text-yellow-600" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-sm md:text-2xl font-bold text-gray-900 truncate">Quản lý case nhận hàng</h1>
                    <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 hidden sm:block">
                      Quản lý và theo dõi các case nhận hàng từ nhà cung cấp
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm flex-shrink-0"
                >
                  <Package className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm font-medium hidden sm:inline">Tạo Case</span>
                  <span className="text-xs md:text-sm font-medium sm:hidden">Tạo</span>
                </button>
              </div>
            
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-full mx-auto px-3 md:px-4 py-4 md:py-8">

        {/* Main Content */}
        <div className="space-y-3 md:space-y-6">
            {/* Search and Filter Bar */}
        <div className="mb-3 md:mb-6 bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 md:px-4 py-2 md:py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5 md:space-x-2 flex-1 min-w-0">
                      <div className="p-1 md:p-1.5 bg-blue-100 rounded-md flex-shrink-0">
                        <Search className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs md:text-base font-semibold text-gray-900">Tìm kiếm & Lọc</h3>
                        <p className="text-[10px] md:text-xs text-gray-600 hidden sm:block">Tìm kiếm và lọc case nhận hàng theo nhiều tiêu chí</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                      <button 
                        onClick={exportToExcel}
                        disabled={allCases.length === 0}
                        className="flex items-center space-x-1 md:space-x-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                      >
                        <Download className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        <span className="text-[10px] md:text-sm font-medium hidden sm:inline">Xuất Excel</span>
                      </button>
                      <button 
                        onClick={fetchAllData}
                        className="flex items-center space-x-1 md:space-x-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer shadow-sm"
                      >
                        <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        <span className="text-[10px] md:text-sm font-medium hidden sm:inline">Làm mới</span>
                      </button>
                    </div>
                  </div>
          </div>

          {/* Content */}
          <div className="p-2 md:p-4">
            <div className="space-y-2 md:space-y-4">
              {/* Search Section */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative flex items-center">
                  <Search className="absolute left-2 md:left-3 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên case, người nhận, nhà cung cấp..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 md:pl-10 pr-2 md:pr-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                    style={{ WebkitAppearance: 'none', lineHeight: 'normal' }}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 border rounded-md transition-all relative ${
                    showFilters 
                      ? 'bg-blue-50 border-blue-300 text-blue-700' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm font-medium hidden sm:inline">Lọc</span>
                  {(statusFilter || receiverFilter || supplierFilter || startDate || endDate) && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-red-500 rounded-full">
                      {[statusFilter, receiverFilter, supplierFilter, startDate, endDate].filter(Boolean).length}
                    </span>
                  )}
                  <ChevronDown className={`h-3 w-3 md:h-4 md:w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Filters Section - Collapsible */}
              <div className={`overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Bộ lọc
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 md:gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1">
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-purple-500 rounded-full"></div>
                        <span>Trạng thái</span>
                      </div>
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="RECEIVED">Tiếp nhận</option>
                      <option value="IN_PROGRESS">Đang xử lý</option>
                      <option value="COMPLETED">Hoàn thành</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  </div>

                  {/* Receiver Filter */}
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1">
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-500 rounded-full"></div>
                        <span>Người nhận</span>
                      </div>
                    </label>
                    <select
                      value={receiverFilter}
                      onChange={(e) => setReceiverFilter(e.target.value)}
                      className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                    >
                      <option value="">Tất cả người nhận</option>
                      {receivers.map((receiver) => (
                        <option key={receiver.id} value={receiver.id}>
                          {receiver.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Supplier Filter */}
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1">
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-orange-500 rounded-full"></div>
                        <span>Nhà cung cấp</span>
                      </div>
                    </label>
                    <select
                      value={supplierFilter}
                      onChange={(e) => setSupplierFilter(e.target.value)}
                      className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                    >
                      <option value="">Tất cả nhà cung cấp</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.shortName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date From Filter */}
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1">
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-blue-500 rounded-full"></div>
                        <span>Từ ngày</span>
                      </div>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                    />
                  </div>

                  {/* Date To Filter */}
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-600 mb-1">
                      <div className="flex items-center space-x-1">
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-indigo-500 rounded-full"></div>
                        <span>Đến ngày</span>
                      </div>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                    />
                  </div>
                </div>
              </div>
              </div>

              {/* Active Filters & Actions */}
              {(statusFilter || receiverFilter || supplierFilter || startDate || endDate || searchTerm) && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-3 border border-blue-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-1.5 mb-1.5">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-semibold text-gray-800">Bộ lọc đang áp dụng</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {searchTerm && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
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
                        {receiverFilter && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                            Người nhận: {receivers.find(r => r.id === receiverFilter)?.fullName}
                          </span>
                        )}
                        {supplierFilter && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></div>
                            Nhà cung cấp: {suppliers.find(s => s.id === supplierFilter)?.shortName}
                          </span>
                        )}
                        {startDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></div>
                            Từ: {formatVietnamDate(startDate)}
                          </span>
                        )}
                        {endDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1"></div>
                            Đến: {formatVietnamDate(endDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setStatusFilter('');
                        setReceiverFilter('');
                        setSupplierFilter('');
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-3 md:mb-8">
          <div className="bg-white rounded-md shadow p-3 md:p-6">
            <div className="flex items-center">
              <div className="p-1 md:p-2 bg-blue-100 rounded-md flex-shrink-0">
                <Package className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div className="ml-2 md:ml-4 min-w-0">
                <p className="text-[10px] md:text-sm font-medium text-gray-600">Tổng Case</p>
                <p className="text-base md:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-md shadow p-3 md:p-6">
            <div className="flex items-center">
              <div className="p-1 md:p-2 bg-yellow-100 rounded-md flex-shrink-0">
                <Package className="h-4 w-4 md:h-6 md:w-6 text-yellow-600" />
              </div>
              <div className="ml-2 md:ml-4 min-w-0">
                <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Đang xử lý</p>
                <p className="text-base md:text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-md shadow p-3 md:p-6">
            <div className="flex items-center">
              <div className="p-1 md:p-2 bg-green-100 rounded-md flex-shrink-0">
                <Package className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
              </div>
              <div className="ml-2 md:ml-4 min-w-0">
                <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Hoàn thành</p>
                <p className="text-base md:text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-md shadow p-3 md:p-6">
            <div className="flex items-center">
              <div className="p-1 md:p-2 bg-red-100 rounded-md flex-shrink-0">
                <Package className="h-4 w-4 md:h-6 md:w-6 text-red-600" />
              </div>
              <div className="ml-2 md:ml-4 min-w-0">
                <p className="text-[10px] md:text-sm font-medium text-gray-600">Đã hủy</p>
                <p className="text-base md:text-2xl font-bold text-gray-900">{stats.cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <ReceivingCaseTable
          onView={handleViewCase}
          onEdit={handleEditCase}
          onDelete={handleOpenDeleteModal}
          searchTerm={debouncedSearchTerm}
          statusFilter={statusFilter}
          receiverFilter={receiverFilter}
          supplierFilter={supplierFilter}
          startDate={startDate}
          endDate={endDate}
          allCases={allCases}
          deletedCases={deletedCases}
        />
          </div>
        </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-md">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
              <h3 className="text-sm md:text-lg font-semibold text-gray-900">Xác nhận xóa case</h3>
            </div>
            <div className="p-4 md:p-6">
              <div className="flex items-start space-x-2 md:space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-gray-700 mb-2">
                    Bạn có chắc chắn muốn xóa case này không?
                  </p>
                  <div className="bg-gray-50 rounded-md p-2 md:p-3 text-xs md:text-sm">
                    <div className="font-medium text-gray-900 break-words">{selectedCase.title}</div>
                    <div className="text-gray-600 mt-1 space-y-0.5">
                      <div className="break-words">Người yêu cầu: {selectedCase.requester.fullName}</div>
                      <div className="break-words">Người nhận hàng: {selectedCase.handler.fullName}</div>
                      <div className="break-words">Nhà cung cấp: {selectedCase.supplier?.shortName || 'Không xác định'}</div>
                    </div>
                  </div>
                  <p className="text-[10px] md:text-xs text-red-600 mt-2">
                    ⚠️ Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 flex flex-col md:flex-row justify-end gap-2 md:gap-0 md:space-x-3">
              <button
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="w-full md:w-auto px-3 md:px-4 py-1.5 md:py-2 border border-gray-300 text-gray-700 text-xs md:text-sm rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteCase}
                disabled={deleting}
                className="w-full md:w-auto px-3 md:px-4 py-1.5 md:py-2 bg-red-600 text-white text-xs md:text-sm rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    Xóa case
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Case Modal */}
      <CreateReceivingCaseModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCase(null);
        }}
        onSuccess={handleCreateSuccess}
        editData={editingCase}
      />
    </div>
  );
}
