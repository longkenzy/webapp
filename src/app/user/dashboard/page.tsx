'use client';

import { useState, useEffect } from 'react';
import { getSession } from "@/lib/auth/session";
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Calendar,
  TrendingUp,
  User,
  Settings,
  FileText,
  Eye,
  Edit,
  Truck,
  Package,
  Wrench,
  Shield,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Search,
  Building2
} from "lucide-react";
import Link from "next/link";

interface CaseData {
  id: string;
  title: string;
  description: string;
  handler: {
    fullName: string;
  };
  customer?: {
    shortName?: string;
    fullCompanyName?: string;
  };
  supplier?: {
    shortName?: string;
    fullCompanyName?: string;
  };
  reporter?: {
    fullName: string;
  };
  status: string;
  startDate: string;
  endDate?: string;
  caseType: string;
  createdAt: string;
  updatedAt: string;
}

interface UnifiedCase {
  id: string;
  title: string;
  description: string;
  handlerName: string;
  handler?: {
    avatar?: string;
  };
  customerName: string;
  status: string;
  startDate: string;
  endDate?: string;
  caseType: string;
  createdAt: string;
  updatedAt: string;
  type: 'internal' | 'delivery' | 'receiving' | 'maintenance' | 'incident' | 'warranty';
}

export default function UserDashboardPage() {
  const [cases, setCases] = useState<UnifiedCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<UnifiedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'current' | 'all'>('current');
  
  // Filter states
  const [filters, setFilters] = useState({
    caseType: '',
    handler: '',
    status: '',
    customer: '',
    startDate: '',
    endDate: ''
  });
  
  // Customer search states
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [uniqueCustomers, setUniqueCustomers] = useState<Array<{name: string, count: number}>>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Mobile filter visibility
  const [showFilters, setShowFilters] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'RECEIVED':
      case 'REPORTED':
      case 'TIẾP NHẬN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
      case 'INVESTIGATING':
      case 'PROCESSING':
      case 'ĐANG XỬ LÝ':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
      case 'COMPLETED':
      case 'HOÀN THÀNH':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
      case 'HỦY':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'RECEIVED':
      case 'REPORTED':
        return 'Tiếp nhận';
      case 'IN_PROGRESS':
      case 'INVESTIGATING':
      case 'PROCESSING':
        return 'Đang xử lý';
      case 'RESOLVED':
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Hủy';
      default:
        return status;
    }
  };

  const getCaseTypeIcon = (type: string) => {
    switch (type) {
      case 'internal':
        return <FileText className="h-4 w-4" />;
      case 'delivery':
        return <Truck className="h-4 w-4" />;
      case 'receiving':
        return <Package className="h-4 w-4" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      case 'incident':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warranty':
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getCaseTypeLabel = (type: string) => {
    switch (type) {
      case 'internal':
        return 'Case nội bộ';
      case 'delivery':
        return 'Case giao hàng';
      case 'receiving':
        return 'Case nhận hàng';
      case 'maintenance':
        return 'Case bảo trì';
      case 'incident':
        return 'Case sự cố';
      case 'warranty':
        return 'Case bảo hành';
      default:
        return 'Case';
    }
  };

  const getActionLink = (type: string, id: string) => {
    switch (type) {
      case 'internal':
        return `/user/work/internal`;
      case 'delivery':
        return `/user/work/delivery`;
      case 'receiving':
        return `/user/work/receiving`;
      case 'maintenance':
        return `/user/work/maintenance`;
      case 'incident':
        return `/user/work/incident`;
      case 'warranty':
        return `/user/work/warranty`;
      default:
        return '#';
    }
  };

  const fetchAllCases = async () => {
    try {
      setLoading(true);
      const [internalRes, deliveryRes, receivingRes, maintenanceRes, incidentRes, warrantyRes] = await Promise.all([
        fetch('/api/internal-cases?limit=50'),
        fetch('/api/delivery-cases?limit=50'),
        fetch('/api/receiving-cases?limit=50'),
        fetch('/api/maintenance-cases?limit=50'),
        fetch('/api/incidents?limit=50'),
        fetch('/api/warranties?limit=50')
      ]);

      const [internalData, deliveryData, receivingData, maintenanceData, incidentData, warrantyData] = await Promise.all([
        internalRes.json(),
        deliveryRes.json(),
        receivingRes.json(),
        maintenanceRes.json(),
        incidentRes.json(),
        warrantyRes.json()
      ]);

      const unifiedCases: UnifiedCase[] = [];

      // Process internal cases
      if (internalData.data) {
        internalData.data.forEach((case_: any) => {
          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;
          
          unifiedCases.push({
            id: case_.id,
            title: titleWithForm,
            description: case_.description,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: `Smart Services\n${case_.requester?.fullName || 'Nội bộ'}`,
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            caseType: case_.caseType || 'Nội bộ',
            createdAt: case_.createdAt,
            updatedAt: case_.updatedAt,
            type: 'internal'
          });
        });
      }

      // Process delivery cases
      if (deliveryData.deliveryCases) {
        deliveryData.deliveryCases.forEach((case_: any) => {
          // Format products for delivery cases
          let productsInfo = case_.description;
          
          if (case_.products && case_.products.length > 0) {
            // Handle both array and JSON string formats
            let products = case_.products;
            if (typeof products === 'string') {
              try {
                products = JSON.parse(products);
              } catch (e) {
                console.error('Error parsing products JSON:', e);
                products = [];
              }
            }
            
            if (Array.isArray(products) && products.length > 0) {
              productsInfo = products.map((product: any) => 
                `**${product.name}** | SL: ${product.quantity} | Mã: ${product.code || product.serialNumber || ''}`
              ).join('\n');
            }
          }

          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;

          unifiedCases.push({
            id: case_.id,
            title: titleWithForm,
            description: productsInfo,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.customer?.shortName || case_.customer?.fullCompanyName || 'Khách hàng',
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            caseType: 'Giao hàng',
            createdAt: case_.createdAt,
            updatedAt: case_.updatedAt,
            type: 'delivery'
          });
        });
      }

      // Process receiving cases
      if (receivingData.receivingCases) {
        receivingData.receivingCases.forEach((case_: any) => {
          // Format products for receiving cases
          let productsInfo = case_.description;
          
          if (case_.products && case_.products.length > 0) {
            // Handle both array and JSON string formats
            let products = case_.products;
            if (typeof products === 'string') {
              try {
                products = JSON.parse(products);
              } catch (e) {
                console.error('Error parsing products JSON:', e);
                products = [];
              }
            }
            
            if (Array.isArray(products) && products.length > 0) {
              productsInfo = products.map((product: any) => 
                `**${product.name}** | SL: ${product.quantity} | Mã: ${product.code || product.serialNumber || ''}`
              ).join('\n');
            }
          }

          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;

          unifiedCases.push({
            id: case_.id,
            title: titleWithForm,
            description: productsInfo,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.supplier?.shortName || case_.supplier?.fullCompanyName || 'Nhà cung cấp',
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            caseType: 'Nhận hàng',
            createdAt: case_.createdAt,
            updatedAt: case_.updatedAt,
            type: 'receiving'
          });
        });
      }

      // Process maintenance cases
      if (maintenanceData.success && maintenanceData.data) {
        maintenanceData.data.forEach((case_: any) => {
          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;
          
          unifiedCases.push({
            id: case_.id,
            title: titleWithForm,
            description: case_.description,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.customer?.shortName || case_.customer?.fullCompanyName || case_.customerName || 'Khách hàng',
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            caseType: case_.maintenanceCaseType?.name || 'Bảo trì',
            createdAt: case_.createdAt,
            updatedAt: case_.updatedAt,
            type: 'maintenance'
          });
        });
      }

      // Process incidents
      if (incidentData.data) {
        incidentData.data.forEach((case_: any) => {
          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;
          
          unifiedCases.push({
            id: case_.id,
            title: titleWithForm,
            description: case_.description,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.customer?.shortName || case_.customer?.fullCompanyName || 'Khách hàng',
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            caseType: case_.incidentType || 'Sự cố',
            createdAt: case_.createdAt,
            updatedAt: case_.updatedAt,
            type: 'incident'
          });
        });
      }

      // Process warranties
      if (warrantyData.data) {
        warrantyData.data.forEach((case_: any) => {
          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;
          
          unifiedCases.push({
            id: case_.id,
            title: titleWithForm,
            description: case_.description,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.customer?.shortName || case_.customer?.fullCompanyName || 'Khách hàng',
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            caseType: case_.warrantyType || 'Bảo hành',
            createdAt: case_.createdAt,
            updatedAt: case_.updatedAt,
            type: 'warranty'
          });
        });
      }

      // Sort by start date (newest first) - create a copy before sorting to avoid read-only error
      const sortedCases = [...unifiedCases].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      
      // Extract unique customers for search dropdown
      const customerMap = new Map<string, number>();
      sortedCases.forEach(case_ => {
        if (case_.type !== 'internal' && case_.customerName && case_.customerName !== 'Khách hàng' && case_.customerName !== 'Nhà cung cấp') {
          const customerName = case_.customerName;
          customerMap.set(customerName, (customerMap.get(customerName) || 0) + 1);
        }
      });
      
      const uniqueCustomersList = Array.from(customerMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count); // Sort by frequency
      
      setUniqueCustomers(uniqueCustomersList);
      setCases(sortedCases);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('Không thể tải danh sách cases. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Filter cases based on current filters and tab
  const applyFilters = () => {
    let filtered = [...cases];

    // Apply tab filter first
    if (activeTab === 'current') {
      // Show cases that are either:
      // 1. Not completed and not cancelled (active cases)
      // 2. OR cases that start today (regardless of status)
      filtered = filtered.filter(case_ => {
        const caseStatus = case_.status.toUpperCase();
        const caseDate = new Date(case_.startDate);
        const today = new Date();
        
        // Check if case is from today
        const isToday = caseDate.toDateString() === today.toDateString();
        
        // Check if case is not completed and not cancelled (active cases)
        const isActiveStatus = !['COMPLETED', 'RESOLVED', 'HOÀN THÀNH', 'CANCELLED', 'HỦY'].includes(caseStatus);
        
        // Show if: (not completed and not cancelled) OR (starts today)
        return isActiveStatus || isToday;
      });
    }
    // For 'all' tab, show all cases (no additional filtering)

    if (filters.caseType) {
      filtered = filtered.filter(case_ => case_.type === filters.caseType);
    }

    if (filters.handler) {
      filtered = filtered.filter(case_ => 
        case_.handlerName.toLowerCase().includes(filters.handler.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(case_ => {
        const caseStatus = case_.status.toUpperCase();
        const filterStatus = filters.status.toUpperCase();
        
        // Group equivalent statuses
        switch (filterStatus) {
          case 'RECEIVED':
            return ['RECEIVED', 'REPORTED'].includes(caseStatus);
          case 'PROCESSING':
            return ['PROCESSING', 'IN_PROGRESS', 'INVESTIGATING'].includes(caseStatus);
          case 'COMPLETED':
            return ['COMPLETED', 'RESOLVED'].includes(caseStatus);
          case 'CANCELLED':
            return caseStatus === 'CANCELLED';
          default:
            return caseStatus === filterStatus;
        }
      });
    }

    if (filters.customer) {
      filtered = filtered.filter(case_ => 
        case_.customerName.toLowerCase().includes(filters.customer.toLowerCase())
      );
    }

    // Date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0); // Start of day
      filtered = filtered.filter(case_ => {
        const caseDate = new Date(case_.startDate);
        caseDate.setHours(0, 0, 0, 0);
        return caseDate >= startDate;
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(case_ => {
        const caseDate = new Date(case_.startDate);
        caseDate.setHours(0, 0, 0, 0);
        return caseDate <= endDate;
      });
    }

    setFilteredCases(filtered);
  };

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page when filters change
  }, [cases, filters, activeTab]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCases = filteredCases.slice(startIndex, endIndex);
  
  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };
  
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  useEffect(() => {
    fetchAllCases();
  }, []);

  // Sync customerSearch with filters.customer
  useEffect(() => {
    if (filters.customer !== customerSearch) {
      setCustomerSearch(filters.customer);
    }
  }, [filters.customer]);

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      caseType: '',
      handler: '',
      status: '',
      customer: '',
      startDate: '',
      endDate: ''
    });
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  // Handle customer search
  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
    setShowCustomerDropdown(true);
    handleFilterChange('customer', value);
  };

  // Handle customer selection from dropdown
  const handleCustomerSelect = (customerName: string) => {
    setCustomerSearch(customerName);
    setShowCustomerDropdown(false);
    handleFilterChange('customer', customerName);
  };

  // Filter customers based on search term
  const filteredCustomers = uniqueCustomers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-8">
        <div className="flex flex-col items-center justify-center h-48 md:h-64">
          <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-3">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
          <p className="text-sm md:text-base text-red-800">{error}</p>
          <button 
            onClick={fetchAllCases}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-3 md:py-8">
      {/* Header */}
      <div className="mb-3 md:mb-8">
        <h1 className="text-lg md:text-3xl font-bold text-gray-900">
          Dashboard Tổng Quan Cases
        </h1>
        <p className="text-xs md:text-base text-gray-600 mt-1 md:mt-2 hidden sm:block">
          Tổng hợp tất cả các case: nội bộ, giao hàng, nhận hàng, bảo trì, sự cố, bảo hành. Tab "Cases hiện tại" hiển thị cases chưa hoàn thành/hủy và cases bắt đầu hôm nay.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 md:mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 md:space-x-8">
            <button
              onClick={() => setActiveTab('current')}
              className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm transition-colors duration-200 ${
                activeTab === 'current'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-1 md:space-x-2">
                <Clock className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Cases hiện tại</span>
                <span className="sm:hidden">Hiện tại</span>
                <span className={`inline-flex items-center px-1.5 md:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activeTab === 'current' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {cases.filter(c => {
                    const status = c.status.toUpperCase();
                    const caseDate = new Date(c.startDate);
                    const today = new Date();
                    const isToday = caseDate.toDateString() === today.toDateString();
                    const isActiveStatus = !['COMPLETED', 'RESOLVED', 'HOÀN THÀNH', 'CANCELLED', 'HỦY'].includes(status);
                    return isActiveStatus || isToday;
                  }).length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm transition-colors duration-200 ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-1 md:space-x-2">
                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Tất cả cases</span>
                <span className="sm:hidden">Tất cả</span>
                <span className={`inline-flex items-center px-1.5 md:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activeTab === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {cases.length}
                </span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-1.5 md:gap-4 mb-3 md:mb-8">
        {[
          { type: 'internal', label: 'Case nội bộ', shortLabel: 'Nội bộ', icon: FileText, color: 'bg-blue-500' },
          { type: 'delivery', label: 'Case giao hàng', shortLabel: 'Giao', icon: Truck, color: 'bg-green-500' },
          { type: 'receiving', label: 'Case nhận hàng', shortLabel: 'Nhận', icon: Package, color: 'bg-yellow-500' },
          { type: 'maintenance', label: 'Case bảo trì', shortLabel: 'Bảo trì', icon: Wrench, color: 'bg-purple-500' },
          { type: 'incident', label: 'Case sự cố', shortLabel: 'Sự cố', icon: AlertTriangle, color: 'bg-red-500' },
          { type: 'warranty', label: 'Case bảo hành', shortLabel: 'Bảo hành', icon: Shield, color: 'bg-indigo-500' }
        ].map(({ type, label, shortLabel, icon: Icon, color }) => {
          const count = filteredCases.filter(c => c.type === type).length;
          return (
            <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-4">
              <div className="flex md:items-center md:justify-between flex-col md:flex-row">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate mb-0.5 md:mb-0">
                    <span className="hidden md:inline">{label}</span>
                    <span className="md:hidden">{shortLabel}</span>
                  </p>
                  <div className="flex items-center justify-between md:block">
                    <p className="text-lg md:text-2xl font-bold text-gray-900">{count}</p>
                    <div className={`md:hidden p-1 rounded ${color} text-white`}>
                      <Icon className="h-3 w-3" />
                    </div>
                  </div>
                </div>
                <div className={`hidden md:block p-2 rounded-lg ${color} text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters - Minimal Design */}
      <div className="bg-white rounded-lg border border-gray-200 mb-3 md:mb-6">
        {/* Filter Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 flex-1 md:pointer-events-none"
          >
            <div className="p-1 bg-blue-50 rounded">
              <Settings className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Bộ lọc</span>
            {(filters.caseType || filters.handler || filters.status || filters.customer || filters.startDate || filters.endDate) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                {[filters.caseType, filters.handler, filters.status, filters.customer, filters.startDate, filters.endDate].filter(Boolean).length}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform md:hidden ml-auto ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          {(filters.caseType || filters.handler || filters.status || filters.customer || filters.startDate || filters.endDate) && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1"
            >
              Xóa hết
            </button>
          )}
        </div>
        
        {/* Filter Content */}
        <div className={`${showFilters ? 'block' : 'hidden md:block'}`}>
          {/* Filter Grid */}
          <div className="p-3 space-y-2.5 md:space-y-0 md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-3">
            {/* Case Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Loại case</label>
              <select
                value={filters.caseType}
                onChange={(e) => handleFilterChange('caseType', e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              >
                <option value="">Tất cả</option>
                <option value="internal">Nội bộ</option>
                <option value="delivery">Giao hàng</option>
                <option value="receiving">Nhận hàng</option>
                <option value="maintenance">Bảo trì</option>
                <option value="incident">Sự cố</option>
                <option value="warranty">Bảo hành</option>
              </select>
            </div>

            {/* Handler */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Người xử lý</label>
              <input
                type="text"
                placeholder="Tên người xử lý"
                value={filters.handler}
                onChange={(e) => handleFilterChange('handler', e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              >
                <option value="">Tất cả</option>
                <option value="RECEIVED">Tiếp nhận</option>
                <option value="PROCESSING">Đang xử lý</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Hủy</option>
              </select>
            </div>

            {/* Customer */}
            <div className="relative customer-dropdown-container">
              <label className="block text-xs font-medium text-gray-700 mb-1">Khách hàng</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tên khách hàng"
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearchChange(e.target.value)}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400"
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.map((customer, index) => (
                      <button
                        key={index}
                        onClick={() => handleCustomerSelect(customer.name)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-900 truncate">{customer.name}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded ml-2">
                            {customer.count}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              />
            </div>
          </div>

          {/* Active Filters - Compact Chips */}
          {(filters.caseType || filters.handler || filters.status || filters.customer || filters.startDate || filters.endDate) && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
              <div className="flex flex-wrap gap-1.5">
                {filters.caseType && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-700">
                    {getCaseTypeLabel(filters.caseType)}
                    <button
                      onClick={() => handleFilterChange('caseType', '')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.handler && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-700">
                    {filters.handler}
                    <button
                      onClick={() => handleFilterChange('handler', '')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.status && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-700">
                    {getStatusLabel(filters.status)}
                    <button
                      onClick={() => handleFilterChange('status', '')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.customer && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-700">
                    {filters.customer}
                    <button
                      onClick={() => handleFilterChange('customer', '')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.startDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-700">
                    Từ: {new Date(filters.startDate + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })}
                    <button
                      onClick={() => handleFilterChange('startDate', '')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.endDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-700">
                    Đến: {new Date(filters.endDate + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })}
                    <button
                      onClick={() => handleFilterChange('endDate', '')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-xl font-bold text-gray-900">
                {activeTab === 'current' ? 'Danh sách cases hiện tại' : 'Danh sách tất cả cases'}
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                Hiển thị: <span className="font-semibold text-blue-600">{startIndex + 1}-{Math.min(endIndex, filteredCases.length)}</span> / <span className="font-semibold text-gray-600">{filteredCases.length}</span> cases (trang {currentPage}/{totalPages})
                {activeTab === 'current' && (
                  <span className="ml-1 md:ml-2 text-xs text-orange-600 bg-orange-100 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
                    <span className="hidden sm:inline">Hiển thị cases chưa hoàn thành/hủy và cases bắt đầu hôm nay</span>
                    <span className="sm:hidden">Active cases</span>
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchAllCases();
              }}
              className="flex items-center space-x-1 md:space-x-2 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{loading ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
          </div>
                      </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {currentCases.map((case_, index) => (
            <Link
              key={case_.id}
              href={getActionLink(case_.type, case_.id)}
              className="block p-3 active:bg-blue-50 transition-colors"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Type Icon & Badge */}
                  <div className={`p-1 rounded-md ${
                    case_.type === 'internal' ? 'bg-blue-100 text-blue-600' :
                    case_.type === 'delivery' ? 'bg-green-100 text-green-600' :
                    case_.type === 'receiving' ? 'bg-yellow-100 text-yellow-600' :
                    case_.type === 'maintenance' ? 'bg-purple-100 text-purple-600' :
                    case_.type === 'incident' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {getCaseTypeIcon(case_.type)}
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(case_.status)}`}>
                    {getStatusLabel(case_.status)}
                  </span>
                </div>
                
                {/* Case Number */}
                <span className="text-xs font-mono text-gray-400 ml-2">#{filteredCases.length - (startIndex + index)}</span>
              </div>

              {/* Title - Prominent */}
              <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-snug">{case_.title}</h3>

              {/* Info Grid - Compact 2-column */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2 text-xs">
                {/* Handler */}
                <div className="flex items-center gap-1 text-gray-600 min-w-0">
                  <User className="h-3 w-3 flex-shrink-0 text-gray-400" />
                  <span className="truncate">{case_.handlerName}</span>
                </div>
                
                {/* Customer */}
                <div className="flex items-center gap-1 text-gray-600 min-w-0">
                  <Building2 className="h-3 w-3 flex-shrink-0 text-gray-400" />
                  <span className="truncate">
                    {case_.type === 'internal' ? 'Smart Services' : case_.customerName}
                  </span>
                </div>
                
                {/* Time */}
                <div className="col-span-2 flex items-center gap-1 text-gray-500 mt-0.5">
                  <Clock className="h-3 w-3 flex-shrink-0 text-gray-400" />
                  <span className="text-xs">
                    {new Date(case_.startDate).toLocaleString('vi-VN', { 
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Ho_Chi_Minh'
                    })}
                    {case_.endDate && (
                      <span className="text-gray-400"> → </span>
                    )}
                    {case_.endDate && new Date(case_.endDate).toLocaleString('vi-VN', { 
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Ho_Chi_Minh'
                    })}
                  </span>
                </div>
              </div>

              {/* Description - Subtle */}
              {case_.description && (
                <p className="text-xs text-gray-500 line-clamp-1 mb-2 leading-relaxed">
                  {case_.type === 'delivery' || case_.type === 'receiving' ? (
                    <span dangerouslySetInnerHTML={{
                      __html: case_.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, ' • ')
                    }} />
                  ) : (
                    case_.description
                  )}
                </p>
              )}

              {/* Action Indicator */}
              <div className="flex items-center justify-end text-blue-600 text-xs font-medium">
                <span>Xem chi tiết</span>
                <ChevronDown className="h-3 w-3 ml-1 -rotate-90" />
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Loại Case
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Người xử lý
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Khách hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Tiêu đề
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Chi tiết
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-32">
                  Thời gian
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentCases.map((case_, index) => (
                <tr key={case_.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-b border-gray-100">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                      <span className="text-sm font-bold text-gray-700">{filteredCases.length - (startIndex + index)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {getCaseTypeLabel(case_.type)}
                        </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
                        {case_.handler?.avatar ? (
                          <img 
                            src={case_.handler.avatar.startsWith('/avatars/') ? case_.handler.avatar : `/avatars/${case_.handler.avatar}`} 
                            alt={case_.handlerName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <span className="text-sm text-gray-900 font-medium">{case_.handlerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm">
                      {case_.type === 'internal' ? (
                        <div className="whitespace-pre-line">
                          <div className="font-semibold text-blue-700">Smart Services</div>
                          <div className="text-gray-600 text-xs">{case_.customerName.split('\n')[1]}</div>
                        </div>
                      ) : (
                        <span className="text-green-700 font-medium">{case_.customerName}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-sm text-gray-900 whitespace-pre-line" title={case_.title}>
                      {case_.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-sm text-gray-600 whitespace-pre-line" title={case_.description}>
                      {case_.type === 'delivery' || case_.type === 'receiving' ? (
                        <div dangerouslySetInnerHTML={{
                          __html: case_.description.replace(/\*\*(.*?)\*\*/g, '<strong><em>$1</em></strong>')
                        }} />
                      ) : (
                        case_.description
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 w-32">
                    <div className="text-xs">
                      <div className="flex items-center space-x-1 mb-1">
                        <Clock className="h-3 w-3 text-blue-500" />
                        <span className="text-blue-700 font-medium">Bắt đầu</span>
                      </div>
                      <div className="text-gray-600">
                        {new Date(case_.startDate).toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false,
                          timeZone: 'Asia/Ho_Chi_Minh'
                        }).replace(':', 'H')} {new Date(case_.startDate).toLocaleDateString('vi-VN')}
                      </div>
                      {case_.endDate && (
                        <>
                          <div className="flex items-center space-x-1 mt-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-green-700 font-medium">Kết thúc</span>
                          </div>
                          <div className="text-gray-600">
                            {new Date(case_.endDate).toLocaleTimeString('vi-VN', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: false,
                              timeZone: 'Asia/Ho_Chi_Minh'
                            }).replace(':', 'H')} {new Date(case_.endDate).toLocaleDateString('vi-VN')}
              </div>
                        </>
            )}
          </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded ${getStatusColor(case_.status)} shadow-sm`}>
                      {getStatusLabel(case_.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <Link
                      href={getActionLink(case_.type, case_.id)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Xem</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

        {filteredCases.length === 0 && cases.length > 0 && (
          <div className="text-center py-12 md:py-16 bg-gray-50">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <FileText className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
            </div>
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'current' ? 'Không có case hiện tại' : 'Không tìm thấy case nào'}
            </h3>
            <p className="text-sm md:text-base text-gray-500 px-4">
              {activeTab === 'current' 
                ? 'Không có case nào chưa hoàn thành/hủy hoặc bắt đầu hôm nay. Chuyển sang tab "Tất cả cases" để xem toàn bộ.'
                : 'Thử thay đổi bộ lọc để xem thêm kết quả'
              }
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-2 sm:px-4 py-2 md:py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between items-center sm:hidden">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="text-xs text-gray-600">
                Trang {currentPage}/{totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    onClick={goToPreviousPage}
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
                        onClick={() => goToPage(pageNum)}
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
                    onClick={goToNextPage}
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

        {cases.length === 0 && (
          <div className="text-center py-12 md:py-16 bg-gray-50">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <FileText className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
            </div>
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Không có case nào</h3>
            <p className="text-sm md:text-base text-gray-500">Chưa có case nào được tạo trong hệ thống</p>
          </div>
        )}
      </div>
    </div>
  );
}


