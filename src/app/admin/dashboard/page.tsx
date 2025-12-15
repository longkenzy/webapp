'use client';

import { useState } from 'react';
import { FileText, PieChart, BarChart3, Users } from 'lucide-react';
import AdminAllCasesTable from "@/components/admin/AdminAllCasesTable";
import CasesPieChart from "@/components/dashboard/CasesPieChart";
import UserCasesStats from "@/components/dashboard/UserCasesStats";
import LiveIndicator from "@/components/shared/common/LiveIndicator";
import { DashboardRefreshProvider } from "@/contexts/DashboardRefreshContext";
import DashboardNotificationWrapper from "@/components/dashboard/DashboardNotificationWrapper";
import ITStatusOverview from "@/components/admin/ITStatusOverview";

type MainTab = 'cases' | 'statistics' | 'users';

export default function AdminDashboardPage() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('cases');

  return (
    <DashboardRefreshProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Realtime Notifications */}
        <DashboardNotificationWrapper />

        {/* Main Content */}
        <div className="p-3 md:p-6">
          <ITStatusOverview />

          {/* Page Header - Responsive */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
            <LiveIndicator />
          </div>

          {/* Mobile: Main Tab Navigation */}
          <div className="md:hidden mb-4">
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-1">
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setActiveMainTab('cases')}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-md transition-all ${activeMainTab === 'cases'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <FileText className={`h-5 w-5 mb-1 ${activeMainTab === 'cases' ? 'text-white' : 'text-blue-600'}`} />
                  <span className="text-xs font-semibold">Cases</span>
                </button>
                <button
                  onClick={() => setActiveMainTab('statistics')}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-md transition-all ${activeMainTab === 'statistics'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <PieChart className={`h-5 w-5 mb-1 ${activeMainTab === 'statistics' ? 'text-white' : 'text-green-600'}`} />
                  <span className="text-xs font-semibold">Thống kê</span>
                </button>
                <button
                  onClick={() => setActiveMainTab('users')}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-md transition-all ${activeMainTab === 'users'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Users className={`h-5 w-5 mb-1 ${activeMainTab === 'users' ? 'text-white' : 'text-purple-600'}`} />
                  <span className="text-xs font-semibold">Users</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile: Tab Content */}
          <div className="md:hidden">
            {activeMainTab === 'cases' && (
              <div className="bg-white rounded-md shadow-sm border border-gray-100">
                <div className="px-3 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-md">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Quản Lý Cases</h3>
                  </div>
                </div>
                <div className="p-3">
                  <AdminAllCasesTable />
                </div>
              </div>
            )}

            {activeMainTab === 'statistics' && (
              <div className="bg-white rounded-md shadow-sm border border-gray-100">
                <div className="px-3 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded-md">
                      <PieChart className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Thống kê Case</h3>
                  </div>
                </div>
                <div className="p-3">
                  <CasesPieChart />
                </div>
              </div>
            )}

            {activeMainTab === 'users' && (
              <div className="bg-white rounded-md shadow-sm border border-gray-100">
                <div className="px-3 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-md">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Thống kê User</h3>
                  </div>
                </div>
                <div className="p-3">
                  <UserCasesStats />
                </div>
              </div>
            )}
          </div>

          {/* Desktop: Original Layout */}
          <div className="hidden md:block space-y-6">
            {/* All Cases Table */}
            <div className="bg-white rounded-md shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Quản Lý Cases</h3>
                    <p className="text-sm text-gray-600">Xem và quản lý tất cả các case trong hệ thống</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <AdminAllCasesTable />
              </div>
            </div>

            {/* Cases Pie Chart */}
            <div className="bg-white rounded-md shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-md">
                    <PieChart className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Thống kê Case Tháng</h3>
                    <p className="text-sm text-gray-600">Phân bố trạng thái case trong tháng hiện tại</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <CasesPieChart />
              </div>
            </div>

            {/* User Cases Statistics */}
            <div className="bg-white rounded-md shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-md">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Thống kê User xử lý Case</h3>
                    <p className="text-sm text-gray-600">Hiệu suất xử lý case của từng user</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <UserCasesStats />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardRefreshProvider>
  );
}