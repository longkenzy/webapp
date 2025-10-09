'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Search, Filter, Download, RefreshCw, FileText, Trash2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import DeliveryCaseTable from '@/components/admin/DeliveryCaseTable';
import CreateDeliveryCaseModal from './CreateDeliveryCaseModal';
import * as XLSX from 'xlsx';
import { DeliveryCaseStatus } from '@prisma/client';
import { getCurrentDateForFilename } from '@/lib/date-utils';

interface DeliveryCase {
  id: string;
  title: string;
  description: string;
  form: string;
  startDate: string;
  endDate: string | null;
  status: DeliveryCaseStatus;
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
  const [showFilters, setShowFilters] = useState(false);
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletedCases, setDeletedCases] = useState<Set<string>>(new Set());
  
  // Create/Edit modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCase, setEditingCase] = useState<DeliveryCase | null>(null);


  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch all data function
  const fetchAllData = useCallback(async () => {
    console.log('🔄🔄🔄 fetchAllData called - THIS WILL OVERWRITE STATE!');
    console.trace('Call stack:');
    
    try {
      // Fetch all cases for stats
      const casesResponse = await fetch('/api/delivery-cases?limit=1000');
      if (casesResponse.ok) {
        const casesData = await casesResponse.json();
        console.log('🔄 Fetched from API:', casesData.deliveryCases.length, 'cases');
        console.log('🔄 First case handler from API:', casesData.deliveryCases[0]?.handler?.fullName);
        setAllCases(casesData.deliveryCases);
      }

      // Fetch delivery persons (employees)
      const deliveryPersonsResponse = await fetch('/api/employees/list');
      if (deliveryPersonsResponse.ok) {
        const deliveryPersonsResult = await deliveryPersonsResponse.json();
        // Handle both old and new API response formats
        const deliveryPersonsData = deliveryPersonsResult.data || deliveryPersonsResult;
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
    setEditingCase(caseItem);
    setShowCreateModal(true); // Sử dụng create modal cho edit
  };

  const handleOpenDeleteModal = (caseItem: DeliveryCase) => {
    setSelectedCase(caseItem);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedCase(null);
    setDeleting(false);
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
      const response = await fetch(`/api/delivery-cases/${caseToDelete.id}`, {
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

  const handleCreateSuccess = (newCase: any) => {
    console.log('✅ handleCreateSuccess called with:', newCase);
    console.log('✅ New status:', newCase.status);
    console.log('✅ New endDate:', newCase.endDate);
    console.log('✅ New handler:', newCase.handler?.fullName);
    console.log('✅ Full newCase data:', JSON.stringify(newCase, null, 2));
    
    if (editingCase) {
      // EDIT mode: Update the case in the list immediately (optimistic update)
      const updatedCases = allCases.map(c => {
        if (c.id === newCase.id) {
          console.log('🔄 FOUND case to update! ID:', c.id);
          console.log('🔄 OLD handler:', c.handler?.fullName, '(', c.handler?.id, ')');
          console.log('🔄 NEW handler:', newCase.handler?.fullName, '(', newCase.handler?.id, ')');
          
          const updated = {
            ...c,  // Keep existing data
            ...newCase,  // Override with new data
            // Ensure all fields are properly formatted
            handler: newCase.handler || c.handler,
            requester: newCase.requester || c.requester,
            customer: newCase.customer || c.customer,
            products: newCase.products || c.products,
            // Explicitly update critical fields
            status: newCase.status || c.status,
            endDate: newCase.endDate !== undefined ? newCase.endDate : c.endDate,
            startDate: newCase.startDate || c.startDate
          };
          
          console.log('🔄 FINAL updated object handler:', updated.handler?.fullName, '(', updated.handler?.id, ')');
          return updated;
        }
        return c;
      });
      
      console.log('✅ Setting new allCases array with', updatedCases.length, 'items');
      console.log('✅ Updated case in new array:', updatedCases.find(c => c.id === newCase.id)?.handler?.fullName);
      setAllCases(updatedCases);
      console.log('✅ Updated case in list (optimistic):', newCase.id);
      
      // Fetch fresh data from server after a short delay to ensure consistency
      setTimeout(() => {
        console.log('🔄 Fetching fresh data from server after edit...');
        fetchAllData();
      }, 500);
    } else {
      // CREATE mode: Add new case to the list
      setAllCases(prev => [newCase, ...prev]);
      console.log('✅ Added new case to list:', newCase.id);
      
      // Also fetch for create to get complete data
      setTimeout(() => {
        console.log('🔄 Fetching fresh data from server after create...');
        fetchAllData();
      }, 500);
    }
    
    setShowCreateModal(false);
    setEditingCase(null);
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
          'Ngày bắt đầu': new Date(case_.startDate).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
          'Ngày kết thúc': case_.endDate ? new Date(case_.endDate).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa hoàn thành',
          'Ngày tạo': new Date(case_.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
          'Ngày cập nhật': new Date(case_.updatedAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
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
          'Admin - Ngày đánh giá': case_.adminAssessmentDate ? new Date(case_.adminAssessmentDate).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa đánh giá',
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
      const currentDate = getCurrentDateForFilename();
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

  // Count active filters
  const activeFiltersCount = [statusFilter, deliveryPersonFilter, customerFilter, startDate, endDate, searchTerm].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* iOS Safari input fix */}
      <style dangerouslySetInnerHTML={{__html: `
        input, select, textarea {
          -webkit-text-fill-color: rgba(0, 0, 0, 0.87) !important;
          opacity: 1 !important;
          color: rgba(0, 0, 0, 0.87) !important;
        }
        input::placeholder, textarea::placeholder {
          -webkit-text-fill-color: rgba(156, 163, 175, 1) !important;
          color: rgba(156, 163, 175, 1) !important;
          opacity: 1 !important;
        }
        input::-webkit-input-placeholder, textarea::-webkit-input-placeholder {
          -webkit-text-fill-color: rgba(156, 163, 175, 1) !important;
          color: rgba(156, 163, 175, 1) !important;
          opacity: 1 !important;
        }
      `}} />
      
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-full mx-auto px-3 md:px-4 py-4 md:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="p-1.5 md:p-2 bg-green-100 rounded-lg">
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-gray-900">Quản lý case giao hàng</h1>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 hidden sm:block">
                    Quản lý và theo dõi các case giao hàng đến khách hàng
                  </p>
                </div>
              </div>
              
              {/* Create Case Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md md:rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-sm text-xs md:text-sm cursor-pointer"
              >
                <Package className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="font-medium hidden sm:inline">Tạo Case</span>
                <span className="font-medium sm:hidden">Tạo</span>
              </button>
            </div>
            
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-full mx-auto px-3 md:px-4 py-4 md:py-8">

        {/* Main Content */}
        <div className="space-y-4 md:space-y-6">

        {/* Search and Filter Bar */}
        <div className="mb-4 md:mb-6 bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 md:px-4 py-2 md:py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center space-x-2 flex-1 cursor-pointer"
                    >
                      <div className="p-1 md:p-1.5 bg-green-100 rounded-md">
                        <Search className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 flex items-center gap-2">
                          Tìm kiếm & Lọc
                          {activeFiltersCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-green-600 rounded-full">
                              {activeFiltersCount}
                            </span>
                          )}
                        </h3>
                        <p className="text-[10px] md:text-xs text-gray-600 hidden md:block">Tìm kiếm và lọc case giao hàng theo nhiều tiêu chí</p>
                      </div>
                      <ChevronDown className={`h-4 w-4 md:h-5 md:w-5 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="hidden md:flex items-center space-x-2 ml-2">
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
          <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-3 md:p-4">
            <div className="space-y-3 md:space-y-4">
              {/* Search Section */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên case, người giao hàng, khách hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 md:pl-10 pr-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                    style={{ WebkitAppearance: 'none' }}
                  />
                </div>
              </div>

              {/* Filters Section */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                  Bộ lọc
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
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
                      className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
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
                      className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
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
                      className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
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
                      className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
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
                      className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Active Filters & Actions */}
              {(statusFilter || deliveryPersonFilter || customerFilter || startDate || endDate || searchTerm) && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-md p-2 md:p-3 border border-green-100">
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
                            Từ: {new Date(startDate).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                          </span>
                        )}
                        {endDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1"></div>
                            Đến: {new Date(endDate).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
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
                      className="flex items-center space-x-1 md:space-x-1.5 px-2.5 md:px-3 py-1 md:py-1.5 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      <span className="text-xs md:text-sm font-medium">Xóa tất cả</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
          <div className="bg-white rounded-md shadow p-3 md:p-6">
            <div className="flex items-center">
              <div className="p-1.5 md:p-2 bg-green-100 rounded-md md:rounded-lg">
                <Package className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-[10px] md:text-sm font-medium text-gray-600">Tổng Case</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-md shadow p-3 md:p-6">
            <div className="flex items-center">
              <div className="p-1.5 md:p-2 bg-yellow-100 rounded-md md:rounded-lg">
                <Package className="h-4 w-4 md:h-6 md:w-6 text-yellow-600" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-[10px] md:text-sm font-medium text-gray-600">Đang xử lý</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-md shadow p-3 md:p-6">
            <div className="flex items-center">
              <div className="p-1.5 md:p-2 bg-green-100 rounded-md md:rounded-lg">
                <Package className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-[10px] md:text-sm font-medium text-gray-600">Hoàn thành</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-md shadow p-3 md:p-6">
            <div className="flex items-center">
              <div className="p-1.5 md:p-2 bg-red-100 rounded-md md:rounded-lg">
                <Package className="h-4 w-4 md:h-6 md:w-6 text-red-600" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-[10px] md:text-sm font-medium text-gray-600">Đã hủy</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <DeliveryCaseTable
          onView={handleViewCase}
          onEdit={handleEditCase}
          onDelete={handleOpenDeleteModal}
          searchTerm={debouncedSearchTerm}
          statusFilter={statusFilter}
          deliveryPersonFilter={deliveryPersonFilter}
          customerFilter={customerFilter}
          startDate={startDate}
          endDate={endDate}
          allCases={allCases}
          deletedCases={deletedCases}
        />
          </div>
        </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-lg shadow-xl w-full md:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-4 md:px-6 py-4 md:py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-md">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Xác nhận xóa case</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5">Thao tác này không thể hoàn tác</p>
                </div>
              </div>
            </div>
            <div className="p-4 md:p-6">
              <p className="text-sm md:text-base text-gray-700 mb-3">
                Bạn có chắc chắn muốn xóa case:
              </p>
              <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-1">{selectedCase.title}</p>
                <p className="text-xs text-gray-600">{selectedCase.description}</p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 md:px-6 py-3 md:py-4 flex gap-2 md:gap-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="flex-1 md:flex-none px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer font-medium disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteCase}
                disabled={deleting}
                className="flex-1 md:flex-none px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer font-medium disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xóa case'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Case Modal */}
      <CreateDeliveryCaseModal
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
