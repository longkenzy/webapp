'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Settings,
  FileText,
  Eye,
  Truck,
  Package,
  Wrench,
  Shield,
  AlertTriangle,
  RefreshCw,
  Search,
  Building2,
  ChevronDown,
  Filter,
  X
} from "lucide-react";
import Link from "next/link";

interface UnifiedCase {
  id: string;
  title: string;
  description: string;
  handlerName: string;
  handler?: {
    avatar?: string;
  };
  customerName: string;
  fullCustomerName?: string;
  status: string;
  startDate: string;
  endDate?: string;
  caseType: string;
  createdAt: string;
  updatedAt: string;
  type: 'internal' | 'delivery' | 'receiving' | 'maintenance' | 'incident' | 'warranty' | 'deployment';
  form?: string;
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
  const [uniqueCustomers, setUniqueCustomers] = useState<Array<{ name: string, count: number }>>([]);

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
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
      case 'INVESTIGATING':
      case 'PROCESSING':
      case 'ĐANG XỬ LÝ':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'RESOLVED':
      case 'COMPLETED':
      case 'HOÀN THÀNH':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'CANCELLED':
      case 'HỦY':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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
        return <FileText className="h-5 w-5" />;
      case 'delivery':
        return <Truck className="h-5 w-5" />;
      case 'receiving':
        return <Package className="h-5 w-5" />;
      case 'maintenance':
        return <Wrench className="h-5 w-5" />;
      case 'incident':
        return <AlertTriangle className="h-5 w-5" />;
      case 'warranty':
        return <Shield className="h-5 w-5" />;
      case 'deployment':
        return <Settings className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getCaseTypeLabel = (type: string) => {
    switch (type) {
      case 'internal':
        return 'Nội bộ';
      case 'delivery':
        return 'Giao hàng';
      case 'receiving':
        return 'Nhận hàng';
      case 'maintenance':
        return 'Bảo trì';
      case 'incident':
        return 'Sự cố';
      case 'warranty':
        return 'Bảo hành';
      case 'deployment':
        return 'Triển khai';
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
      case 'deployment':
        return `/user/work/deployment`;
      default:
        return '#';
    }
  };

  const fetchAllCases = async () => {
    try {
      setLoading(true);
      const [internalRes, deliveryRes, receivingRes, maintenanceRes, incidentRes, warrantyRes, deploymentRes] = await Promise.all([
        fetch('/api/internal-cases?limit=50'),
        fetch('/api/delivery-cases?limit=50'),
        fetch('/api/receiving-cases?limit=50'),
        fetch('/api/maintenance-cases?limit=50'),
        fetch('/api/incidents?limit=50'),
        fetch('/api/warranties?limit=50'),
        fetch('/api/deployment-cases?limit=50')
      ]);

      const [internalData, deliveryData, receivingData, maintenanceData, incidentData, warrantyData, deploymentData] = await Promise.all([
        internalRes.json(),
        deliveryRes.json(),
        receivingRes.json(),
        maintenanceRes.json(),
        incidentRes.json(),
        warrantyRes.json(),
        deploymentRes.json()
      ]);

      const unifiedCases: UnifiedCase[] = [];

      // Process internal cases
      if (internalData.data) {
        internalData.data.forEach((case_: any) => {
          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;

          unifiedCases.push({
            id: case_.id,
            title: case_.title,
            form: case_.form,
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
          let productsInfo = case_.description;
          if (case_.products && case_.products.length > 0) {
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
            title: case_.title,
            form: case_.form,
            description: productsInfo,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.customer?.shortName || case_.customer?.fullCompanyName || 'Khách hàng',
            fullCustomerName: case_.customer?.fullCompanyName,
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
          let productsInfo = case_.description;
          if (case_.products && case_.products.length > 0) {
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
            title: case_.title,
            form: case_.form,
            description: productsInfo,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.supplier?.shortName || case_.supplier?.fullCompanyName || 'Nhà cung cấp',
            fullCustomerName: case_.supplier?.fullCompanyName,
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
            title: case_.title,
            form: case_.form,
            description: case_.description,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.customer?.shortName || case_.customer?.fullCompanyName || case_.customerName || 'Khách hàng',
            fullCustomerName: case_.customer?.fullCompanyName,
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
            title: case_.title,
            form: case_.form,
            description: case_.description,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.customer?.shortName || case_.customer?.fullCompanyName || 'Khách hàng',
            fullCustomerName: case_.customer?.fullCompanyName,
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
            title: case_.title,
            form: case_.form,
            description: case_.description,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.customer?.shortName || case_.customer?.fullCompanyName || 'Khách hàng',
            fullCustomerName: case_.customer?.fullCompanyName,
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

      // Process deployment cases
      if (deploymentData.data) {
        deploymentData.data.forEach((case_: any) => {
          const titleWithForm = case_.form ? `Hình thức: ${case_.form}\n${case_.title}` : case_.title;

          unifiedCases.push({
            id: case_.id,
            title: case_.title,
            form: case_.form,
            description: case_.description,
            handlerName: case_.handler?.fullName || 'Chưa phân công',
            handler: case_.handler ? {
              avatar: case_.handler.avatar
            } : undefined,
            customerName: case_.customer?.shortName || case_.customer?.fullCompanyName || case_.customerName || 'Khách hàng',
            fullCustomerName: case_.customer?.fullCompanyName,
            status: case_.status,
            startDate: case_.startDate,
            endDate: case_.endDate,
            caseType: case_.deploymentType?.name || 'Triển khai',
            createdAt: case_.createdAt,
            updatedAt: case_.updatedAt,
            type: 'deployment'
          });
        });
      }

      const sortedCases = [...unifiedCases].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      const customerMap = new Map<string, number>();
      sortedCases.forEach(case_ => {
        if (case_.type !== 'internal' && case_.customerName && case_.customerName !== 'Khách hàng' && case_.customerName !== 'Nhà cung cấp') {
          const customerName = case_.customerName;
          customerMap.set(customerName, (customerMap.get(customerName) || 0) + 1);
        }
      });

      const uniqueCustomersList = Array.from(customerMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setUniqueCustomers(uniqueCustomersList);
      setCases(sortedCases);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('Không thể tải danh sách cases. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cases];

    if (activeTab === 'current') {
      filtered = filtered.filter(case_ => {
        const caseStatus = case_.status.toUpperCase();
        const caseDate = new Date(case_.startDate);
        const today = new Date();
        const isToday = caseDate.toDateString() === today.toDateString();
        const isActiveStatus = !['COMPLETED', 'RESOLVED', 'HOÀN THÀNH', 'CANCELLED', 'HỦY'].includes(caseStatus);
        return isActiveStatus || isToday;
      });
    }

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

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(case_ => {
        const caseDate = new Date(case_.startDate);
        caseDate.setHours(0, 0, 0, 0);
        return caseDate >= startDate;
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
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
    setCurrentPage(1);
  }, [cases, filters, activeTab]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCases = filteredCases.slice(startIndex, endIndex);

  const goToPage = (page: number) => setCurrentPage(page);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  useEffect(() => {
    fetchAllCases();
  }, []);

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

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
    setShowCustomerDropdown(true);
    handleFilterChange('customer', value);
  };

  const handleCustomerSelect = (customerName: string) => {
    setCustomerSearch(customerName);
    setShowCustomerDropdown(false);
    handleFilterChange('customer', customerName);
  };

  const filteredCustomers = uniqueCustomers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase())
  );



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-600 animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-8 w-8 rounded-full bg-blue-100"></div>
          </div>
        </div>
        <p className="mt-4 text-gray-500 font-medium animate-pulse">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchAllCases}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md hover:shadow-lg w-full"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Top Navigation / Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
            <div>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setLoading(true);
                  fetchAllCases();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm font-medium text-sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>

              <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                <button
                  onClick={() => setActiveTab('current')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'current'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Hiện tại
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'all'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Tất cả
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {[
            { type: 'internal', label: 'Nội bộ', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { type: 'delivery', label: 'Giao hàng', icon: Truck, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
            { type: 'receiving', label: 'Nhận hàng', icon: Package, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
            { type: 'maintenance', label: 'Bảo trì', icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
            { type: 'incident', label: 'Sự cố', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
            { type: 'warranty', label: 'Bảo hành', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
            { type: 'deployment', label: 'Triển khai', icon: Settings, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' }
          ].map(({ type, label, icon: Icon, color, bg, border }) => {
            const count = filteredCases.filter(c => c.type === type).length;
            const isActive = filters.caseType === type;

            return (
              <button
                key={type}
                onClick={() => handleFilterChange('caseType', isActive ? '' : type)}
                className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:shadow-md text-left group ${isActive ? `ring-2 ring-blue-500 ring-offset-2 ${bg} ${border}` : 'bg-white border-gray-200 hover:border-blue-200'
                  }`}
              >
                <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                  <Icon className="h-12 w-12 transform rotate-12" />
                </div>
                <div className={`p-2 rounded-lg w-fit mb-3 ${bg} ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Danh sách Cases</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  {filteredCases.length}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search & Filters */}
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-sm">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo người xử lý..."
                    value={filters.handler}
                    onChange={(e) => handleFilterChange('handler', e.target.value)}
                    className="border-none p-0 text-sm focus:ring-0 w-full sm:w-48 placeholder:text-gray-400"
                  />
                </div>

                <div className="relative group">
                  <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-sm">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm khách hàng..."
                      value={customerSearch}
                      onChange={(e) => handleCustomerSearchChange(e.target.value)}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                      className="border-none p-0 text-sm focus:ring-0 w-full sm:w-48 placeholder:text-gray-400"
                    />
                  </div>
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {filteredCustomers.map((customer, index) => (
                        <button
                          key={index}
                          onClick={() => handleCustomerSelect(customer.name)}
                          className="w-full px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0 flex items-center justify-between group/item"
                        >
                          <span className="text-sm text-gray-700 group-hover/item:text-blue-600 truncate">{customer.name}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full group-hover/item:bg-blue-50 group-hover/item:text-blue-600">
                            {customer.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 shadow-sm"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="RECEIVED">Tiếp nhận</option>
                  <option value="PROCESSING">Đang xử lý</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Hủy</option>
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 shadow-sm"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 shadow-sm"
                  />
                </div>

                {(filters.caseType || filters.handler || filters.status || filters.customer || filters.startDate || filters.endDate) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="px-6 py-3 w-16 text-center">#</th>
                  <th className="px-6 py-3">Thông tin Case</th>
                  <th className="px-6 py-3">Khách hàng / Đối tác</th>
                  <th className="px-6 py-3">Người xử lý</th>
                  <th className="px-6 py-3">Thời gian</th>
                  <th className="px-6 py-3 text-center">Trạng thái</th>
                  <th className="px-6 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {currentCases.length > 0 ? (
                  currentCases.map((case_, index) => (
                    <tr key={case_.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-2.5 text-center text-sm text-gray-500">
                        {filteredCases.length - (startIndex + index)}
                      </td>
                      <td className="px-6 py-2.5 max-w-md">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${case_.type === 'internal' ? 'bg-blue-100 text-blue-600' :
                            case_.type === 'delivery' ? 'bg-green-100 text-green-600' :
                              case_.type === 'receiving' ? 'bg-yellow-100 text-yellow-600' :
                                case_.type === 'maintenance' ? 'bg-purple-100 text-purple-600' :
                                  case_.type === 'incident' ? 'bg-red-100 text-red-600' :
                                    case_.type === 'warranty' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                            {getCaseTypeIcon(case_.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                {getCaseTypeLabel(case_.type)}
                              </span>
                            </div>
                            {case_.form && (
                              <div className="text-xs mb-1">
                                <span className="font-semibold text-gray-500">Hình thức:</span>{' '}
                                <span className="font-medium text-blue-600">{case_.form}</span>
                              </div>
                            )}
                            {case_.type !== 'delivery' && case_.type !== 'receiving' && (
                              <div className="mb-1">
                                <span className="text-xs font-semibold text-gray-500">Tiêu đề:</span>
                                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mt-0.5" title={case_.title}>
                                  {case_.title}
                                </h3>
                              </div>
                            )}
                            {case_.description && (
                              <div className="text-xs text-gray-500 line-clamp-2" title={case_.description}>
                                <span className="font-semibold text-gray-500 mr-1">Mô tả:</span>
                                {case_.type === 'delivery' || case_.type === 'receiving' ? (
                                  <span dangerouslySetInnerHTML={{
                                    __html: case_.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, ' • ')
                                  }} />
                                ) : (
                                  case_.description
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded-full text-gray-500">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="text-sm">
                            <p className="font-medium text-gray-900 line-clamp-1" title={case_.customerName}>
                              {case_.type === 'internal' ? 'Smart Services' : case_.customerName}
                            </p>
                            {case_.type === 'internal' ? (
                              <p className="text-xs text-gray-500">{case_.customerName.split('\n')[1]}</p>
                            ) : (
                              case_.fullCustomerName && case_.fullCustomerName !== case_.customerName && (
                                <p className="text-xs text-gray-500 line-clamp-1" title={case_.fullCustomerName}>
                                  {case_.fullCustomerName}
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2.5">
                        <div className="flex items-center gap-2">
                          {case_.handler?.avatar ? (
                            <img
                              src={case_.handler.avatar.startsWith('/avatars/') ? case_.handler.avatar : `/avatars/${case_.handler.avatar}`}
                              alt={case_.handlerName}
                              className="h-8 w-8 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs border border-blue-100">
                              {case_.handlerName.charAt(0)}
                            </div>
                          )}
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{case_.handlerName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2.5">
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span>{new Date(case_.startDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span>{new Date(case_.startDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {case_.endDate && (
                            <div className="flex items-center gap-1.5 text-green-600 text-xs mt-1 pt-1 border-t border-gray-100">
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>{new Date(case_.endDate).toLocaleDateString('vi-VN')} {new Date(case_.endDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-2.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(case_.status)}`}>
                          {getStatusLabel(case_.status)}
                        </span>
                      </td>
                      <td className="px-6 py-2.5 text-center">
                        <Link
                          href={getActionLink(case_.type, case_.id)}
                          className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="mx-auto w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="h-10 w-10 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Không tìm thấy kết quả</h3>
                      <p className="text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between rounded-b-xl">
              <p className="text-sm text-gray-500">
                Hiển thị <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filteredCases.length)}</span> trong tổng số <span className="font-medium text-gray-900">{filteredCases.length}</span> kết quả
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </button>
                <div className="flex items-center gap-1">
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
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${pageNum === currentPage
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200 ring-2 ring-blue-600 ring-offset-2'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
