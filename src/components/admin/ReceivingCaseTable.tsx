'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Calendar,
  User,
  Truck,
  FileText,
  Clock,
  CheckCircle,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { ReceivingCaseStatus, EvaluationType, EvaluationCategory } from '@prisma/client';
import { useEvaluationForm } from '@/hooks/useEvaluation';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  companyEmail: string;
}

interface Partner {
  id: string;
  shortName: string;
  fullCompanyName: string;
  contactPerson: string | null;
  contactPhone: string | null;
}

interface Product {
  id: string;
  name: string;
  code: string | null;
  quantity: number;
  serialNumber: string | null;
}

interface ReceivingCase {
  id: string;
  title: string;
  description: string;
  form: string;
  startDate: string;
  endDate: string | null;
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
  requester: Employee;
  handler: Employee;
  supplier: Partner | null;
  products: Product[];
  _count: {
    comments: number;
    worklogs: number;
    products: number;
  };
}

interface ReceivingCaseTableProps {
  onView?: (receivingCase: ReceivingCase) => void;
  onEdit?: (receivingCase: ReceivingCase) => void;
  onDelete?: (receivingCase: ReceivingCase) => void;
  searchTerm?: string;
  statusFilter?: string;
  receiverFilter?: string;
  supplierFilter?: string;
  startDate?: string;
  endDate?: string;
  allCases?: ReceivingCase[];
  deletedCases?: Set<string>;
}

const statusConfig = {
  [ReceivingCaseStatus.RECEIVED]: {
    label: 'Tiếp nhận',
    color: 'bg-blue-100 text-blue-800',
    icon: Package
  },
  [ReceivingCaseStatus.IN_PROGRESS]: {
    label: 'Đang xử lý',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  [ReceivingCaseStatus.COMPLETED]: {
    label: 'Hoàn thành',
    color: 'bg-green-100 text-green-800',
    icon: Package
  },
  [ReceivingCaseStatus.CANCELLED]: {
    label: 'Hủy',
    color: 'bg-red-100 text-red-800',
    icon: Trash2
  }
};

export default function ReceivingCaseTable({ 
  onView, 
  onEdit, 
  onDelete, 
  searchTerm = '', 
  statusFilter = '', 
  receiverFilter = '', 
  supplierFilter = '',
  startDate = '',
  endDate = '',
  allCases: propAllCases = [],
  deletedCases = new Set()
}: ReceivingCaseTableProps) {
  const [allCases, setAllCases] = useState<ReceivingCase[]>(propAllCases);
  const [filteredCases, setFilteredCases] = useState<ReceivingCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Evaluation modal states
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<ReceivingCase | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  
  // Admin evaluation categories
  const adminCategories = [
    EvaluationCategory.DIFFICULTY,
    EvaluationCategory.TIME,
    EvaluationCategory.IMPACT,
    EvaluationCategory.URGENCY,
  ];
  
  const { getFieldOptions } = useEvaluationForm(EvaluationType.ADMIN, adminCategories);

  // Sync internal state with props when props change
  useEffect(() => {
    console.log('📊 ReceivingCaseTable - Props allCases changed:', propAllCases.length);
    setAllCases(propAllCases);
  }, [propAllCases]);

  // Helper functions for evaluation text
  const getDifficultyText = (level: number) => {
    switch (level) {
      case 1: return 'Rất dễ';
      case 2: return 'Dễ';
      case 3: return 'Trung bình';
      case 4: return 'Khó';
      case 5: return 'Rất khó';
      default: return 'Chưa đánh giá';
    }
  };

  const getEstimatedTimeText = (level: number) => {
    switch (level) {
      case 1: return '< 30 phút';
      case 2: return '30-60 phút';
      case 3: return '1-2 giờ';
      case 4: return '2-4 giờ';
      case 5: return '> 4 giờ';
      default: return 'Chưa đánh giá';
    }
  };

  const getImpactText = (level: number) => {
    switch (level) {
      case 1: return 'Rất thấp';
      case 2: return 'Thấp';
      case 3: return 'Trung bình';
      case 4: return 'Cao';
      case 5: return 'Rất cao';
      default: return 'Chưa đánh giá';
    }
  };

  const getUrgencyText = (level: number) => {
    switch (level) {
      case 1: return 'Rất thấp';
      case 2: return 'Thấp';
      case 3: return 'Trung bình';
      case 4: return 'Cao';
      case 5: return 'Rất cao';
      default: return 'Chưa đánh giá';
    }
  };

  const getFormText = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'Chưa đánh giá';
    switch (score) {
      case 1: return 'Offsite/Remote';
      case 2: return 'Onsite';
      default: return 'Chưa đánh giá';
    }
  };

  // Helper function to check if case is evaluated by admin
  const isCaseEvaluatedByAdmin = (caseItem: ReceivingCase) => {
    return caseItem.adminDifficultyLevel !== null && 
           caseItem.adminDifficultyLevel !== undefined &&
           caseItem.adminEstimatedTime !== null && 
           caseItem.adminEstimatedTime !== undefined &&
           caseItem.adminImpactLevel !== null && 
           caseItem.adminImpactLevel !== undefined &&
           caseItem.adminUrgencyLevel !== null && 
           caseItem.adminUrgencyLevel !== undefined;
  };

  // States for evaluation form
  const [evaluationForm, setEvaluationForm] = useState({
    adminDifficultyLevel: '',
    adminEstimatedTime: '',
    adminImpactLevel: '',
    adminUrgencyLevel: ''
  });

  // Evaluation modal handlers
  const handleOpenEvaluationModal = (caseItem: ReceivingCase) => {
    setSelectedCase(caseItem);
    setEvaluationForm({
      adminDifficultyLevel: caseItem.adminDifficultyLevel?.toString() || '',
      adminEstimatedTime: caseItem.adminEstimatedTime?.toString() || '',
      adminImpactLevel: caseItem.adminImpactLevel?.toString() || '',
      adminUrgencyLevel: caseItem.adminUrgencyLevel?.toString() || ''
    });
    setShowEvaluationModal(true);
  };

  const handleCloseEvaluationModal = () => {
    setShowEvaluationModal(false);
    setSelectedCase(null);
    setEvaluationForm({
      adminDifficultyLevel: '',
      adminEstimatedTime: '',
      adminImpactLevel: '',
      adminUrgencyLevel: ''
    });
  };

  const handleEvaluationSubmit = async () => {
    if (!selectedCase) return;

    try {
      setEvaluating(true);
      const response = await fetch(`/api/receiving-cases/${selectedCase.id}/evaluation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminDifficultyLevel: evaluationForm.adminDifficultyLevel,
          adminEstimatedTime: evaluationForm.adminEstimatedTime,
          adminImpactLevel: evaluationForm.adminImpactLevel,
          adminUrgencyLevel: evaluationForm.adminUrgencyLevel,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the case in the list
        setAllCases(prevCases => 
          prevCases.map(case_ => 
            case_.id === selectedCase.id 
              ? { ...case_, ...result.data }
              : case_
          )
        );
        
        // Show success toast notification
        toast.success('Cập nhật đánh giá case thành công!', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
        
        handleCloseEvaluationModal();
      } else {
        const error = await response.json();
        toast.error(`Lỗi: ${error.error || 'Không thể cập nhật đánh giá'}`, {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error updating evaluation:', error);
      toast.error('Lỗi kết nối. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setEvaluating(false);
    }
  };

  // Client-side filtering function
  const filterCases = useCallback((cases: ReceivingCase[]) => {
    return cases.filter(case_ => {
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
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && caseDate < start) {
          return false;
        }
        if (end && caseDate > end) {
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
  }, [statusFilter, receiverFilter, supplierFilter, startDate, endDate, searchTerm]);

  // Fetch all cases once
  const fetchAllCases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/receiving-cases?limit=1000'); // Get all cases
      
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }

      const data = await response.json();
      setAllCases(data.receivingCases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Refresh only data without affecting header state
  const refreshData = async () => {
    try {
      const response = await fetch('/api/receiving-cases?limit=1000');
      
      if (response.ok) {
        const data = await response.json();
        setAllCases(data.receivingCases);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  // Apply filters and pagination
  useEffect(() => {
    const filtered = filterCases(allCases).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    setFilteredCases(filtered);
    
    // Reset to page 1 when filters change
    setCurrentPage(1);
    
    // Calculate total pages
    const total = Math.ceil(filtered.length / itemsPerPage);
    setTotalPages(total);
  }, [allCases, filterCases]);

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCases.slice(startIndex, endIndex);
  };

  // Sync with props
  useEffect(() => {
    setAllCases(propAllCases);
  }, [propAllCases]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  const formatDateRange = (startDate: string, endDate: string | null) => {
    const start = formatDateTime(startDate);
    const end = endDate ? formatDateTime(endDate) : 'Chưa xác định';
    return (
      <div className="text-sm">
        <div className="flex items-center gap-1 text-gray-600">
          <Calendar className="w-3 h-3" />
          <span className="font-medium">Bắt đầu:</span>
        </div>
        <div className="ml-4 text-gray-800">{start}</div>
        {endDate && (
          <>
            <div className="flex items-center gap-1 text-gray-600 mt-1">
              <Clock className="w-3 h-3" />
              <span className="font-medium">Kết thúc:</span>
            </div>
            <div className="ml-4 text-gray-800">{end}</div>
          </>
        )}
      </div>
    );
  };

  const getStatusBadge = (status: ReceivingCaseStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getProgressSteps = (status: ReceivingCaseStatus) => {
    const steps = [
      { key: 'RECEIVED', label: 'Tiếp nhận', color: 'bg-blue-600', completed: true },
      { key: 'IN_PROGRESS', label: 'Đang xử lý', color: 'bg-yellow-500', completed: status === 'IN_PROGRESS' || status === 'COMPLETED' },
      { key: 'COMPLETED', label: 'Hoàn thành', color: 'bg-green-600', completed: status === 'COMPLETED' }
    ];

    return (
      <div className="flex items-center space-x-1">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`w-4 h-4 rounded-full ${step.completed ? step.color : 'bg-gray-300'} flex items-center justify-center`}>
              {step.completed && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-3 h-0.5 ${step.completed ? 'bg-gray-400' : 'bg-gray-300'}`}></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getProcessFlow = (caseItem: any) => {
    if (caseItem.status === 'CANCELLED') {
      return (
        <div className="text-center py-1">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-1">
            <Trash2 className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xs font-medium text-red-600">Đã hủy</div>
        </div>
      );
    }

    const currentStep = caseItem.status === 'RECEIVED' ? 1 : 
                      caseItem.status === 'IN_PROGRESS' ? 2 : 3;

    // Determine timestamps for each step
    const receivedTime = caseItem.createdAt; // Case được tạo = tiếp nhận
    const inProgressTime = caseItem.status === 'IN_PROGRESS' || caseItem.status === 'COMPLETED' ? 
                          caseItem.updatedAt : null; // Có thể cần thêm field riêng
    const completedTime = caseItem.status === 'COMPLETED' ? 
                         caseItem.endDate || caseItem.updatedAt : null;

    return (
      <div className="py-1">
        {/* Process Icons with Timestamps */}
        <div className="flex items-center justify-center mb-1">
          <div className="flex items-center space-x-3">
            {/* Step 1: Tiếp nhận */}
            <div className="flex flex-col items-center">
              <div className="text-xs font-medium text-gray-700 mb-1">
                Tiếp nhận
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <Package className="w-3 h-3" />
              </div>
              <div className="text-xs text-gray-500 text-center">
                {formatDateTime(receivedTime)}
              </div>
            </div>
            
            {/* Line */}
            <div className="flex items-center justify-center h-6 -mt-3">
              <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            </div>
            
            {/* Step 2: Đang xử lý */}
            <div className="flex flex-col items-center">
              <div className="text-xs font-medium text-gray-700 mb-1">
                Đang xử lý
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                currentStep >= 2 ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <Clock className="w-3 h-3" />
              </div>
              <div className="text-xs text-gray-500 text-center">
                {inProgressTime ? formatDateTime(inProgressTime) : '-'}
              </div>
            </div>
            
            {/* Line */}
            <div className="flex items-center justify-center h-6 -mt-3">
              <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
            </div>
            
            {/* Step 3: Hoàn thành */}
            <div className="flex flex-col items-center">
              <div className="text-xs font-medium text-gray-700 mb-1">
                Hoàn thành
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <CheckCircle className="w-3 h-3" />
              </div>
              <div className="text-xs text-gray-500 text-center">
                {completedTime ? formatDateTime(completedTime) : '-'}
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Lỗi: {error}</div>
        <button 
          onClick={fetchAllCases}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Danh sách Case Nhận Hàng
          </h3>
          
          {/* Status Filter and Refresh */}
          <div className="flex items-center gap-3">
            {statusFilter && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Trạng thái:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {statusConfig[statusFilter as ReceivingCaseStatus]?.label || statusFilter}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Process Flow Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-8">
            {/* Step 1: Tiếp nhận */}
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-700">Tiếp nhận</span>
            </div>
            
            {/* Line */}
            <div className="flex items-center justify-center h-6 -mt-1">
              <div className="w-8 h-0.5 bg-gray-300"></div>
            </div>
            
            {/* Step 2: Đang xử lý */}
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-700">Đang xử lý</span>
            </div>
            
            {/* Line */}
            <div className="flex items-center justify-center h-6 -mt-1">
              <div className="w-8 h-0.5 bg-gray-300"></div>
            </div>
            
            {/* Step 3: Hoàn thành */}
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-700">Hoàn thành</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                STT
              </th>
              <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Người nhận hàng
              </th>
              <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nội dung nhận hàng
              </th>
              <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quy trình xử lý
              </th>
              <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Điểm User
              </th>
              <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Điểm Admin
              </th>
              <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng điểm
              </th>
              <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getCurrentPageData().map((caseItem, index) => {
              const isEvaluated = isCaseEvaluatedByAdmin(caseItem);
              
              return (
                <tr key={caseItem.id} className={`hover:bg-gray-50 ${
                  !isEvaluated ? 'bg-yellow-50/50 border-l-4 border-l-yellow-400' : ''
                } ${
                  deletedCases.has(caseItem.id) ? 'opacity-50 bg-red-50/30' : ''
                }`}>
                <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-center">
                  {filteredCases.length - ((currentPage - 1) * itemsPerPage + index)}
                </td>
                
                {/* Người nhận hàng */}
                <td className="px-2 py-1 whitespace-nowrap">
                  <div>
                    <div className="text-xs font-medium text-gray-900">
                      {caseItem.handler?.fullName || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {caseItem.handler?.position || ''}
                    </div>
                  </div>
                </td>

                {/* Nội dung nhận hàng */}
                <td className="px-2 py-1">
                  <div className="max-w-lg">
                    <div className="text-xs font-medium text-gray-900 mb-1">
                      {caseItem.title.replace('Nhận hàng từ ', '')}
                    </div>
                    {caseItem.supplier?.fullCompanyName && (
                      <div className="text-xs text-gray-600 mb-2">
                        {caseItem.supplier.fullCompanyName}
                      </div>
                    )}
                    {caseItem.products && caseItem.products.length > 0 ? (
                      <div className="space-y-1">
                        {caseItem.products.map((product, idx) => (
                          <div key={product.id} className="text-xs text-gray-700">
                            <span className="font-medium">{product.name}</span>
                            <span className="text-gray-600"> | SL: {product.quantity}</span>
                            {product.code && (
                              <span className="text-gray-600"> | Mã: {product.code}</span>
                            )}
                            {product.serialNumber && (
                              <span className="text-gray-600"> | S/N: {product.serialNumber}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 italic">
                        {caseItem.description || 'Không có mô tả sản phẩm'}
                      </div>
                    )}
                  </div>
                </td>

                {/* Quy trình xử lý */}
                <td className="px-2 py-1 text-center">
                  {getProcessFlow(caseItem)}
                </td>

                {/* Điểm User */}
                <td className="px-2 py-1 text-center">
                  <span className="text-xs font-medium text-blue-600">
                    {((caseItem.userDifficultyLevel || 0) + (caseItem.userEstimatedTime || 0) + (caseItem.userImpactLevel || 0) + (caseItem.userUrgencyLevel || 0) + (caseItem.userFormScore || 0))}
                  </span>
                </td>

                {/* Điểm Admin */}
                <td className="px-2 py-1 text-center">
                  <span className="text-xs font-medium text-green-600">
                    {((caseItem.adminDifficultyLevel || 0) + (caseItem.adminEstimatedTime || 0) + (caseItem.adminImpactLevel || 0) + (caseItem.adminUrgencyLevel || 0))}
                  </span>
                </td>

                {/* Tổng điểm */}
                <td className="px-2 py-1 text-center">
                  <span className="text-xs font-bold text-purple-600">
                    {(() => {
                      const userTotal = ((caseItem.userDifficultyLevel || 0) + (caseItem.userEstimatedTime || 0) + (caseItem.userImpactLevel || 0) + (caseItem.userUrgencyLevel || 0) + (caseItem.userFormScore || 0));
                      const adminTotal = ((caseItem.adminDifficultyLevel || 0) + (caseItem.adminEstimatedTime || 0) + (caseItem.adminImpactLevel || 0) + (caseItem.adminUrgencyLevel || 0));
                      return ((userTotal * 0.4) + (adminTotal * 0.6)).toFixed(1);
                    })()}
                  </span>
                </td>

                 {/* Hành động */}
                 <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-center">
                   <div className="flex items-center justify-center gap-2">
                     {/* Nút chỉnh sửa case */}
                     {onEdit && (
                       <button
                         onClick={() => !deletedCases.has(caseItem.id) && onEdit(caseItem)}
                         disabled={deletedCases.has(caseItem.id)}
                         className={`p-1 rounded transition-colors ${
                           deletedCases.has(caseItem.id)
                             ? 'text-gray-400 cursor-not-allowed'
                             : 'text-blue-600 hover:text-blue-900 hover:bg-blue-50 cursor-pointer'
                         }`}
                         title={deletedCases.has(caseItem.id) ? "Đang xóa..." : "Chỉnh sửa case"}
                       >
                         <Edit className="h-4 w-4" />
                       </button>
                     )}
                     
                     {/* Nút đánh giá */}
                     <button
                       onClick={() => handleOpenEvaluationModal(caseItem)}
                       disabled={deletedCases.has(caseItem.id)}
                       className={`p-1 rounded transition-colors ${
                         deletedCases.has(caseItem.id)
                           ? 'text-gray-400 cursor-not-allowed'
                           : isEvaluated 
                             ? 'text-green-600 hover:text-green-900 hover:bg-green-50 cursor-pointer' 
                             : 'text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 bg-yellow-100 cursor-pointer'
                       }`}
                       title={deletedCases.has(caseItem.id) ? "Đang xóa..." : (isEvaluated ? "Đánh giá case" : "⚠️ Chưa đánh giá - Click để đánh giá")}
                     >
                       {isEvaluated ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                     </button>
                     
                     {/* Nút xóa */}
                     {onDelete && (
                       <button
                         onClick={() => !deletedCases.has(caseItem.id) && onDelete(caseItem)}
                         disabled={deletedCases.has(caseItem.id)}
                         className={`p-1 rounded transition-colors ${
                           deletedCases.has(caseItem.id)
                             ? 'text-gray-400 cursor-not-allowed'
                             : 'text-red-600 hover:text-red-900 hover:bg-red-50 cursor-pointer'
                         }`}
                         title={deletedCases.has(caseItem.id) ? "Đang xóa..." : "Xóa case"}
                       >
                         {deletedCases.has(caseItem.id) ? (
                           <RefreshCw className="h-4 w-4 animate-spin" />
                         ) : (
                           <Trash2 className="h-4 w-4" />
                         )}
                       </button>
                     )}
                   </div>
                 </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị{' '}
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' '}đến{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredCases.length)}
                </span>
                {' '}của{' '}
                <span className="font-medium">{filteredCases.length}</span>
                {' '}kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Trước</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Sau</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredCases.length === 0 && (
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không có case nào</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter ? 'Không có case nào với trạng thái này.' : 'Chưa có case nhận hàng nào được tạo.'}
          </p>
        </div>
      )}

      {/* Evaluation Modal */}
      {showEvaluationModal && selectedCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Đánh giá Case: {selectedCase.title}</h3>
              <p className="text-sm text-gray-600">Đánh giá mức độ khó, thời gian, ảnh hưởng và khẩn cấp</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* User Evaluation Display */}
                <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3">Đánh giá của User</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Mức độ khó: {getDifficultyText(selectedCase.userDifficultyLevel || 0)}</div>
                    <div>Thời gian ước tính: {getEstimatedTimeText(selectedCase.userEstimatedTime || 0)}</div>
                    <div>Mức độ ảnh hưởng: {getImpactText(selectedCase.userImpactLevel || 0)}</div>
                    <div>Mức độ khẩn cấp: {getUrgencyText(selectedCase.userUrgencyLevel || 0)}</div>
                    <div>Hình thức: {getFormText(selectedCase.userFormScore)}</div>
                    <div className="font-medium text-blue-600">
                      Tổng: {((selectedCase.userDifficultyLevel || 0) + (selectedCase.userEstimatedTime || 0) + (selectedCase.userImpactLevel || 0) + (selectedCase.userUrgencyLevel || 0) + (selectedCase.userFormScore || 0))}
                    </div>
                  </div>
                </div>

                {/* Admin Evaluation Form */}
                <div className="bg-green-50 rounded-md p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-green-800">Đánh giá của Admin</h4>
                    <button
                      type="button"
                      onClick={() => {/* fetchConfigs */}}
                      className="flex items-center space-x-1 px-2 py-1 text-xs text-green-700 hover:text-green-800 hover:bg-green-100 rounded transition-colors cursor-pointer"
                      title="Làm mới options đánh giá"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Làm mới</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Mức độ khó */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mức độ khó
                      </label>
                      <select
                        value={evaluationForm.adminDifficultyLevel}
                        onChange={(e) => setEvaluationForm(prev => ({ ...prev, adminDifficultyLevel: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Chọn mức độ khó</option>
                        {getFieldOptions(EvaluationCategory.DIFFICULTY).map((option) => (
                          <option key={option.id} value={option.points}>
                            {option.points} - {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Thời gian ước tính */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thời gian ước tính
                      </label>
                      <select
                        value={evaluationForm.adminEstimatedTime}
                        onChange={(e) => setEvaluationForm(prev => ({ ...prev, adminEstimatedTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Chọn thời gian ước tính</option>
                        {getFieldOptions(EvaluationCategory.TIME).map((option) => (
                          <option key={option.id} value={option.points}>
                            {option.points} - {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Mức độ ảnh hưởng */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mức độ ảnh hưởng
                      </label>
                      <select
                        value={evaluationForm.adminImpactLevel}
                        onChange={(e) => setEvaluationForm(prev => ({ ...prev, adminImpactLevel: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Chọn mức độ ảnh hưởng</option>
                        {getFieldOptions(EvaluationCategory.IMPACT).map((option) => (
                          <option key={option.id} value={option.points}>
                            {option.points} - {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Mức độ khẩn cấp */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mức độ khẩn cấp
                      </label>
                      <select
                        value={evaluationForm.adminUrgencyLevel}
                        onChange={(e) => setEvaluationForm(prev => ({ ...prev, adminUrgencyLevel: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Chọn mức độ khẩn cấp</option>
                        {getFieldOptions(EvaluationCategory.URGENCY).map((option) => (
                          <option key={option.id} value={option.points}>
                            {option.points} - {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseEvaluationModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleEvaluationSubmit}
                disabled={evaluating}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {evaluating ? 'Đang cập nhật...' : 'Cập nhật đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
