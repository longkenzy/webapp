import { db } from "@/lib/db";
import { atLeast } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { FileText, PieChart, BarChart3 } from 'lucide-react';
import DashboardCasesTable from "@/components/dashboard/DashboardCasesTable";
import AdminAllCasesTable from "@/components/admin/AdminAllCasesTable";
import CasesPieChart from "@/components/dashboard/CasesPieChart";
import UserCasesStats from "@/components/dashboard/UserCasesStats";
import LiveIndicator from "@/components/shared/common/LiveIndicator";
import { DashboardRefreshProvider } from "@/contexts/DashboardRefreshContext";
import DashboardNotificationWrapper from "@/components/dashboard/DashboardNotificationWrapper";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!atLeast(session?.user.role, Role.IT_STAFF)) return null;

  return (
    <DashboardRefreshProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Realtime Notifications */}
        <DashboardNotificationWrapper />
        
        {/* Main Content */}
        <div className="p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <LiveIndicator />
          </div>

          {/* All Cases Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
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

          {/* Cases Pie Chart - Compact */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
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
    </DashboardRefreshProvider>
  );
}