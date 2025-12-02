'use client';

import { useState, useEffect } from 'react';
import { FileText, Calendar, User, Clock, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useDashboardRefresh } from '@/contexts/DashboardRefreshContext';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  avatar?: string;
}

interface InternalCase {
  id: string;
  title: string;
  description: string;
  requester: Employee;
  handler: Employee;
  caseType: string;
  form: string;
  status: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  // User assessment fields
  userDifficultyLevel?: number;
  userEstimatedTime?: number;
  userImpactLevel?: number;
  userUrgencyLevel?: number;
  userFormScore?: number;
  userAssessmentDate?: string;
  // Admin assessment fields
  adminDifficultyLevel?: number;
  adminEstimatedTime?: number;
  adminImpactLevel?: number;
  adminUrgencyLevel?: number;
  adminAssessmentDate?: string;
  adminAssessmentNotes?: string;
}

export default function DashboardCasesTable() {
  const [cases, setCases] = useState<InternalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { registerRefreshCases } = useDashboardRefresh();

  const fetchCases = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const response = await fetch('/api/dashboard/cases', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCases(data.data || []);
        setLastUpdate(new Date());
      } else {
        console.error('Failed to fetch dashboard cases:', response.status, response.statusText);
        setCases([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard cases:', error);
      setCases([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const refreshCases = async () => {
    setRefreshing(true);
    await fetchCases(false); // Don't show loading for manual refresh
    setRefreshing(false);
  };

  // Use realtime updates hook
  useRealtimeUpdates({
    interval: 60000, // 60 seconds - reduced frequency
    enabled: true,
    onUpdate: () => fetchCases(false) // Don't show loading for auto-refresh
  });

  useEffect(() => {
    fetchCases(true); // Show loading only on initial load

    // Register refresh function with context
    registerRefreshCases(() => fetchCases(false));
  }, [registerRefreshCases]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
      case 'Tiếp nhận':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS':
      case 'Đang xử lý':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
      case 'Hoàn thành':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
      case 'Hủy':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Tạm dừng':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'Tiếp nhận';
      case 'IN_PROGRESS':
        return 'Đang xử lý';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Hủy';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RECEIVED':
      case 'Tiếp nhận':
        return <AlertTriangle className="h-4 w-4" />;
      case 'IN_PROGRESS':
      case 'Đang xử lý':
        return <Clock className="h-4 w-4" />;
      case 'COMPLETED':
      case 'Hoàn thành':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
      case 'Hủy':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  const formatCaseType = (caseType: string) => {
    switch (caseType) {
      case 'cai-dat-phan-mem':
        return 'Cài đặt phần mềm';
      case 'bao-tri':
        return 'Bảo trì';
      case 'kiem-tra-bao-mat':
        return 'Kiểm tra bảo mật';
      case 'cai-dat-thiet-bi':
        return 'Cài đặt thiết bị';
      case 'ho-tro-ky-thuat':
        return 'Hỗ trợ kỹ thuật';
      default:
        return caseType;
    }
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Đang tải danh sách case...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">
            {cases.length} case{cases.length !== 1 ? 's' : ''}
          </span>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              • Cập nhật: {lastUpdate.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
            </span>
          )}
        </div>
        <button
          onClick={refreshCases}
          disabled={refreshing}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Làm mới</span>
        </button>
      </div>

      {/* Cases Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Case
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Người yêu cầu
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Người xử lý
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Thời gian
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Loại
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cases.length > 0 ? (
              cases.map((case_) => (
                <tr key={case_.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {case_.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {isToday(case_.createdAt) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                              <Calendar className="h-3 w-3 mr-1" />
                              Hôm nay
                            </span>
                          )}
                          Tạo: {formatDate(case_.createdAt)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-900">{case_.requester.fullName}</div>
                        <div className="text-xs text-gray-500">{case_.requester.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        {case_.handler.avatar ? (
                          <img
                            src={case_.handler.avatar.startsWith('/avatars/') ? case_.handler.avatar : `/avatars/${case_.handler.avatar}`}
                            alt={case_.handler.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-gray-900">{case_.handler.fullName}</div>
                        <div className="text-xs text-gray-500">{case_.handler.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(case_.status)}`}>
                      {getStatusIcon(case_.status)}
                      <span className="ml-1">{getStatusText(case_.status)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-700">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>Bắt đầu: {formatDate(case_.startDate)}</span>
                      </div>
                      {case_.endDate && (
                        <div className="flex items-center space-x-1 mt-1">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span>Kết thúc: {formatDate(case_.endDate)}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                      {formatCaseType(case_.caseType)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <FileText className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không có case nào</h3>
                  <p className="text-gray-500">Không có case trong ngày hôm nay hoặc case cần xử lý</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
