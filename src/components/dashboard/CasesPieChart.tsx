'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useDashboardRefresh } from '@/contexts/DashboardRefreshContext';

interface ChartData {
  label: string;
  value: number;
  color: string;
  percentage: string;
}

interface CasesStats {
  monthly: {
    totalCases: number;
    completedCases: number;
    completionRate: string;
    chartData: ChartData[];
    month: string;
  };
  total: {
    totalCases: number;
    completedCases: number;
    completionRate: string;
    chartData: ChartData[];
  };
}

export default function CasesPieChart() {
  const [stats, setStats] = useState<CasesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  
  const { registerRefreshStats } = useDashboardRefresh();

  const fetchStats = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const response = await fetch('/api/dashboard/cases-stats', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
        setLastUpdate(new Date());
      } else {
        console.error('Failed to fetch cases stats:', response.status, response.statusText);
      }
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
    interval: 30000, // 30 seconds
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

  const getStatusIcon = (label: string) => {
    switch (label) {
      case 'Hoàn thành':
        return <CheckCircle className="h-4 w-4" />;
      case 'Đang xử lý':
        return <Clock className="h-4 w-4" />;
      case 'Tiếp nhận':
        return <AlertTriangle className="h-4 w-4" />;
      case 'Hủy':
        return <XCircle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Thống kê Case</h3>
          <p className="text-sm text-gray-600">Tháng hiện tại & Tổng số</p>
          {lastUpdate && (
            <p className="text-xs text-gray-500 flex items-center space-x-1">
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
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Làm mới</span>
        </button>
      </div>


      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Tháng {stats.monthly.month}</h4>
          
          {stats.monthly.chartData.length > 0 ? (
            <div className="space-y-4">
              {/* Chart */}
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.monthly.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {stats.monthly.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value} case (${stats.monthly.chartData.find(item => item.label === name)?.percentage}%)`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Summary */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.monthly.totalCases}</div>
                <div className="text-sm text-gray-600">Tổng case tháng</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-gray-400 mb-2">
                <CheckCircle className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-sm text-gray-500">Chưa có case nào</p>
            </div>
          )}
        </div>

        {/* Total Chart */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Tổng số (Tất cả thời gian)</h4>
          
          {stats.total.chartData.length > 0 ? (
            <div className="space-y-4">
              {/* Chart */}
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.total.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {stats.total.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value} case (${stats.total.chartData.find(item => item.label === name)?.percentage}%)`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Summary */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total.totalCases}</div>
                <div className="text-sm text-gray-600">Tổng case</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-gray-400 mb-2">
                <CheckCircle className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-sm text-gray-500">Chưa có case nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Chú thích</h4>
        <div className="grid grid-cols-2 gap-3">
          {stats.monthly.chartData.length > 0 && stats.monthly.chartData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              ></div>
              <div className="flex items-center space-x-1">
                {getStatusIcon(item.label)}
                <span className="text-sm font-medium text-gray-900">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
