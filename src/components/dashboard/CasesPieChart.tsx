'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle, RefreshCw, FileText, Truck, Package, Wrench, Shield, TrendingUp, PieChart as PieChartIcon, Rocket } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LabelList } from 'recharts';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useDashboardRefresh } from '@/contexts/DashboardRefreshContext';

interface CaseTypeData {
  name: string;
  value: number;
  color: string;
  icon: any;
  label: string;
}

interface CasesStats {
  caseTypes: CaseTypeData[];
  totalCases: number;
}

export default function CasesPieChart() {
  const [stats, setStats] = useState<CasesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'total'>('current');
  
  const { registerRefreshStats } = useDashboardRefresh();

  const fetchStats = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Fetch all case types data
      const [internalRes, deliveryRes, receivingRes, maintenanceRes, incidentRes, warrantyRes, deploymentRes] = await Promise.all([
        fetch('/api/internal-cases?limit=1000'),
        fetch('/api/delivery-cases?limit=1000'),
        fetch('/api/receiving-cases?limit=1000'),
        fetch('/api/maintenance-cases?limit=1000'),
        fetch('/api/incidents?limit=1000'),
        fetch('/api/warranties?limit=1000'),
        fetch('/api/deployment-cases?limit=1000')
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

      // Get current month filter
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Filter function for current month
      const isCurrentMonth = (dateString: string) => {
        const date = new Date(dateString);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      };

      // Process case type statistics
      let caseTypeCounts;
      
      if (activeTab === 'current') {
        // Filter for current month only
        caseTypeCounts = {
          internal: internalData.data?.filter((case_: any) => isCurrentMonth(case_.startDate)).length || 0,
          delivery: deliveryData.deliveryCases?.filter((case_: any) => isCurrentMonth(case_.startDate)).length || 0,
          receiving: receivingData.receivingCases?.filter((case_: any) => isCurrentMonth(case_.startDate)).length || 0,
          maintenance: maintenanceData.data?.filter((case_: any) => isCurrentMonth(case_.startDate)).length || 0,
          incident: incidentData.data?.filter((case_: any) => isCurrentMonth(case_.startDate)).length || 0,
          warranty: warrantyData.data?.filter((case_: any) => isCurrentMonth(case_.startDate)).length || 0,
          deployment: deploymentData.data?.filter((case_: any) => isCurrentMonth(case_.startDate)).length || 0
        };
      } else {
        // All time data
        caseTypeCounts = {
          internal: internalData.data?.length || 0,
          delivery: deliveryData.deliveryCases?.length || 0,
          receiving: receivingData.receivingCases?.length || 0,
          maintenance: maintenanceData.data?.length || 0,
          incident: incidentData.data?.length || 0,
          warranty: warrantyData.data?.length || 0,
          deployment: deploymentData.data?.length || 0
        };
      }

      const totalCases = Object.values(caseTypeCounts).reduce((sum, count) => sum + count, 0);

      const caseTypes: CaseTypeData[] = [
        {
          name: 'Case nội bộ',
          value: caseTypeCounts.internal,
          color: '#3B82F6',
          icon: FileText,
          label: 'Case nội bộ'
        },
        {
          name: 'Case giao hàng',
          value: caseTypeCounts.delivery,
          color: '#10B981',
          icon: Truck,
          label: 'Case giao hàng'
        },
        {
          name: 'Case nhận hàng',
          value: caseTypeCounts.receiving,
          color: '#F59E0B',
          icon: Package,
          label: 'Case nhận hàng'
        },
        {
          name: 'Case bảo trì',
          value: caseTypeCounts.maintenance,
          color: '#8B5CF6',
          icon: Wrench,
          label: 'Case bảo trì'
        },
        {
          name: 'Case sự cố',
          value: caseTypeCounts.incident,
          color: '#EF4444',
          icon: AlertTriangle,
          label: 'Case sự cố'
        },
        {
          name: 'Case bảo hành',
          value: caseTypeCounts.warranty,
          color: '#6366F1',
          icon: Shield,
          label: 'Case bảo hành'
        },
        {
          name: 'Case triển khai',
          value: caseTypeCounts.deployment,
          color: '#06B6D4',
          icon: Rocket,
          label: 'Case triển khai'
        }
      ].filter(item => item.value > 0); // Only show types with cases

      setStats({
        caseTypes,
        totalCases
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching cases stats:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    await fetchStats(false); // Don't show loading for manual refresh
    setRefreshing(false);
  };

  // Use realtime updates hook
  useRealtimeUpdates({
    interval: 120000, // 120 seconds (2 minutes) - reduced frequency for stats
    enabled: true,
    onUpdate: async () => {
      setIsAutoRefreshing(true);
      await fetchStats(false); // Don't show loading for auto-refresh
      setIsAutoRefreshing(false);
    }
  });

  useEffect(() => {
    fetchStats(true); // Show loading only on initial load
    
    // Register refresh function with context
    registerRefreshStats(() => fetchStats(false));
  }, [registerRefreshStats]);

  // Refetch data when tab changes
  useEffect(() => {
    if (stats) {
      fetchStats(false);
    }
  }, [activeTab]);


  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Đang tải thống kê...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <CheckCircle className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
        <p className="text-gray-500">Không có case nào trong tháng này</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-md">
              <PieChartIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Thống kê loại Case</h3>
              <p className="text-xs text-gray-600">Phân bố các loại case trong hệ thống</p>
            </div>
          </div>
          {lastUpdate && (
            <p className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <span>Cập nhật lần cuối: {lastUpdate.toLocaleTimeString('vi-VN')}</span>
              {isAutoRefreshing && (
                <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
              )}
            </p>
          )}
        </div>
        <button
          onClick={refreshStats}
          disabled={refreshing}
          className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-xs font-medium">Làm mới</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('current')}
              className={`py-2 px-1 border-b-2 font-medium text-xs transition-colors duration-200 ${
                activeTab === 'current'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Tháng hiện tại</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('total')}
              className={`py-2 px-1 border-b-2 font-medium text-xs transition-colors duration-200 ${
                activeTab === 'total'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span>Tổng</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Pie Chart */}
        <div className="p-4">
        {stats && stats.caseTypes.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            {/* Chart */}
            <div className="relative">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.caseTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({value, name}) => {
                        if (value === undefined || value === null) return '';
                        const total = stats.totalCases;
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        const shortName = name.replace('Case ', '').replace(/^\w/, c => c.toUpperCase());
                        const caseText = value === 1 ? 'case' : 'cases';
                        return percentage >= 5 ? `${shortName}\n(${value} ${caseText})\n${percentage}%` : ''; // Show name, count in parentheses, and percentage
                      }}
                      labelLine={false}
                    >
                      {stats.caseTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        const total = stats.totalCases;
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return [`${value} case (${percentage}%)`, name];
                      }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{stats.totalCases}</div>
                  <div className="text-xs text-gray-600 font-medium">
                    {activeTab === 'current' ? 'Tháng hiện tại' : 'Tổng case'}
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Chi tiết</h4>
              {[...stats.caseTypes]
                .sort((a, b) => b.value - a.value)
                .map((item, index) => {
                  const Icon = item.icon;
                  const percentage = stats.totalCases > 0 ? Math.round((item.value / stats.totalCases) * 100) : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="p-1.5 rounded-md shadow-sm"
                          style={{ backgroundColor: `${item.color}20`, color: item.color }}
                        >
                          <Icon className="h-3 w-3" />
                        </div>
                        <span className="text-xs font-medium text-gray-900">{item.label}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-bold text-gray-900">{item.value}</span>
                        <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded-full shadow-sm">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PieChartIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dữ liệu</h3>
            <p className="text-gray-500">
              {activeTab === 'current' 
                ? 'Chưa có case nào được tạo trong tháng này' 
                : 'Chưa có case nào được tạo trong hệ thống'
              }
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
