'use client';

import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  TrendingUp, 
  User, 
  Users,
  BarChart3,
  Award,
  Target
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useDashboardRefresh } from '@/contexts/DashboardRefreshContext';

interface UserStats {
  userId: string;
  userName: string;
  totalCases: number;
  completedCases: number;
  inProgressCases: number;
  pendingCases: number;
  completionRate: number;
  avatar?: string;
  department?: string;
  position?: string;
}

interface UserCasesData {
  users: UserStats[];
  totalUsers: number;
  totalCases: number;
  averageCompletionRate: number;
}

export default function UserCasesStats() {
  const [stats, setStats] = useState<UserCasesData | null>(null);
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

      // Collect all cases with handler information
      const allCases: any[] = [];

      // Process internal cases
      if (internalData.data) {
        internalData.data.forEach((case_: any) => {
          if (case_.handler) {
            allCases.push({
              ...case_,
              handlerId: case_.handler.id,
              handlerName: case_.handler.fullName,
              handlerAvatar: case_.handler.avatar,
              handlerDepartment: case_.handler.department,
              handlerPosition: case_.handler.position,
              startDate: case_.startDate,
              status: case_.status
            });
          }
        });
      }

      // Process delivery cases
      if (deliveryData.deliveryCases) {
        deliveryData.deliveryCases.forEach((case_: any) => {
          if (case_.handler) {
            allCases.push({
              ...case_,
              handlerId: case_.handler.id,
              handlerName: case_.handler.fullName,
              handlerAvatar: case_.handler.avatar,
              handlerDepartment: case_.handler.department,
              handlerPosition: case_.handler.position,
              startDate: case_.startDate,
              status: case_.status
            });
          }
        });
      }

      // Process receiving cases
      if (receivingData.receivingCases) {
        receivingData.receivingCases.forEach((case_: any) => {
          if (case_.handler) {
            allCases.push({
              ...case_,
              handlerId: case_.handler.id,
              handlerName: case_.handler.fullName,
              handlerAvatar: case_.handler.avatar,
              handlerDepartment: case_.handler.department,
              handlerPosition: case_.handler.position,
              startDate: case_.startDate,
              status: case_.status
            });
          }
        });
      }

      // Process maintenance cases
      if (maintenanceData.success && maintenanceData.data) {
        maintenanceData.data.forEach((case_: any) => {
          if (case_.handler) {
            allCases.push({
              ...case_,
              handlerId: case_.handler.id,
              handlerName: case_.handler.fullName,
              handlerAvatar: case_.handler.avatar,
              handlerDepartment: case_.handler.department,
              handlerPosition: case_.handler.position,
              startDate: case_.startDate,
              status: case_.status
            });
          }
        });
      }

      // Process incidents
      if (incidentData.data) {
        incidentData.data.forEach((case_: any) => {
          if (case_.handler) {
            allCases.push({
              ...case_,
              handlerId: case_.handler.id,
              handlerName: case_.handler.fullName,
              handlerAvatar: case_.handler.avatar,
              handlerDepartment: case_.handler.department,
              handlerPosition: case_.handler.position,
              startDate: case_.startDate,
              status: case_.status
            });
          }
        });
      }

      // Process warranties
      if (warrantyData.data) {
        warrantyData.data.forEach((case_: any) => {
          if (case_.handler) {
            allCases.push({
              ...case_,
              handlerId: case_.handler.id,
              handlerName: case_.handler.fullName,
              handlerAvatar: case_.handler.avatar,
              handlerDepartment: case_.handler.department,
              handlerPosition: case_.handler.position,
              startDate: case_.startDate,
              status: case_.status
            });
          }
        });
      }

      // Process deployment cases
      if (deploymentData.data) {
        deploymentData.data.forEach((case_: any) => {
          if (case_.handler) {
            allCases.push({
              ...case_,
              handlerId: case_.handler.id,
              handlerName: case_.handler.fullName,
              handlerAvatar: case_.handler.avatar,
              handlerDepartment: case_.handler.department,
              handlerPosition: case_.handler.position,
              startDate: case_.startDate,
              status: case_.status
            });
          }
        });
      }

      // Filter by current month if needed
      let filteredCases = allCases;
      if (activeTab === 'current') {
        filteredCases = allCases.filter(case_ => isCurrentMonth(case_.startDate));
      }

      // Group by handler and calculate stats
      const userStatsMap = new Map<string, UserStats>();

      filteredCases.forEach(case_ => {
        const handlerId = case_.handlerId;
        const handlerName = case_.handlerName;
        const status = case_.status.toUpperCase();

        if (!userStatsMap.has(handlerId)) {
          userStatsMap.set(handlerId, {
            userId: handlerId,
            userName: handlerName,
            totalCases: 0,
            completedCases: 0,
            inProgressCases: 0,
            pendingCases: 0,
            completionRate: 0,
            avatar: case_.handlerAvatar,
            department: case_.handlerDepartment,
            position: case_.handlerPosition
          });
        }

        const userStats = userStatsMap.get(handlerId)!;
        userStats.totalCases++;

        if (['COMPLETED', 'RESOLVED', 'HOÀN THÀNH'].includes(status)) {
          userStats.completedCases++;
        } else if (['IN_PROGRESS', 'INVESTIGATING', 'PROCESSING', 'ĐANG XỬ LÝ'].includes(status)) {
          userStats.inProgressCases++;
        } else {
          userStats.pendingCases++;
        }
      });

      // Calculate completion rates
      const users = Array.from(userStatsMap.values()).map(user => ({
        ...user,
        completionRate: user.totalCases > 0 ? Math.round((user.completedCases / user.totalCases) * 100) : 0
      })).sort((a, b) => b.totalCases - a.totalCases); // Sort by total cases

      const totalCases = users.reduce((sum, user) => sum + user.totalCases, 0);
      const averageCompletionRate = users.length > 0 
        ? Math.round(users.reduce((sum, user) => sum + user.completionRate, 0) / users.length)
        : 0;

      setStats({
        users,
        totalUsers: users.length,
        totalCases,
        averageCompletionRate
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    await fetchStats(false);
    setRefreshing(false);
  };

  // Use realtime updates hook
  useRealtimeUpdates({
    interval: 120000, // 120 seconds (2 minutes)
    enabled: true,
    onUpdate: async () => {
      setIsAutoRefreshing(true);
      await fetchStats(false);
      setIsAutoRefreshing(false);
    }
  });

  useEffect(() => {
    fetchStats(true);
    
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
          <span className="text-gray-600">Đang tải thống kê user...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <Users className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
        <p className="text-gray-500">Không có user nào xử lý case</p>
      </div>
    );
  }

  // Prepare data for chart
  const chartData = stats.users.slice(0, 10).map((user, index) => ({
    name: user.userName,
    fullName: user.userName,
    total: user.totalCases,
    completed: user.completedCases,
    inProgress: user.inProgressCases,
    pending: user.pendingCases,
    completionRate: user.completionRate,
    color: `hsl(${(index * 137.5) % 360}, 70%, 50%)` // Generate distinct colors
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-md">
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Thống kê User xử lý Case</h3>
              <p className="text-xs text-gray-600">Hiệu suất xử lý case của từng user</p>
            </div>
          </div>
          {lastUpdate && (
            <p className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <span>Cập nhật lần cuối: {lastUpdate.toLocaleTimeString('vi-VN')}</span>
              {isAutoRefreshing && (
                <RefreshCw className="h-3 w-3 animate-spin text-purple-500" />
              )}
            </p>
          )}
        </div>
        <button
          onClick={refreshStats}
          disabled={refreshing}
          className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 shadow-sm"
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
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span>Tháng hiện tại</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('total')}
              className={`py-2 px-1 border-b-2 font-medium text-xs transition-colors duration-200 ${
                activeTab === 'total'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-1">
                <Target className="h-3 w-3" />
                <span>Tổng</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-4">
          {stats.users.length > 0 ? (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-700">Tổng User</p>
                      <p className="text-lg font-bold text-blue-900">{stats.totalUsers}</p>
                    </div>
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-green-700">Tổng Cases</p>
                      <p className="text-lg font-bold text-green-900">{stats.totalCases}</p>
                    </div>
                    <BarChart3 className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-purple-700">Tỷ lệ hoàn thành TB</p>
                      <p className="text-lg font-bold text-purple-900">{stats.averageCompletionRate}%</p>
                    </div>
                    <Award className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Top 10 User xử lý nhiều nhất</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          const labels: { [key: string]: string } = {
                            total: 'Tổng cases',
                            completed: 'Hoàn thành',
                            inProgress: 'Đang xử lý',
                            pending: 'Chờ xử lý'
                          };
                          return [value, labels[name] || name];
                        }}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            return `User: ${payload[0].payload.fullName}`;
                          }
                          return label;
                        }}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="total" name="total" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* User Details Table */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Chi tiết từng User</h4>
                <div className="max-h-64 overflow-y-auto">
                  {stats.users.map((user, index) => (
                    <div key={user.userId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user.userName}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <User className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.userName}</p>
                          <p className="text-xs text-gray-500">{user.department} • {user.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="text-center">
                          <p className="font-bold text-gray-900">{user.totalCases}</p>
                          <p className="text-gray-500">Tổng</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-green-600">{user.completedCases}</p>
                          <p className="text-gray-500">Hoàn thành</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-yellow-600">{user.inProgressCases}</p>
                          <p className="text-gray-500">Đang xử lý</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-blue-600">{user.completionRate}%</p>
                          <p className="text-gray-500">Tỷ lệ</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dữ liệu</h3>
              <p className="text-gray-500">
                {activeTab === 'current' 
                  ? 'Chưa có user nào xử lý case trong tháng này' 
                  : 'Chưa có user nào xử lý case trong hệ thống'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
