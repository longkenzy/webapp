import { db } from "@/lib/db";
import { atLeast } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { TrendingUp, TrendingDown } from 'lucide-react';
import DashboardCharts from "@/components/charts/DashboardCharts";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!atLeast(session?.user.role, Role.IT_STAFF)) return null;

  // Fetch data for dashboard
  const [openTickets, totalTickets, usersCount, ticketsByStatus, ticketsByPriority, recentTickets] = await Promise.all([
    db.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    db.ticket.count(),
    db.user.count(),
    db.ticket.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    db.ticket.groupBy({
      by: ['priority'],
      _count: { priority: true }
    }),
    db.ticket.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { requester: true }
    })
  ]);

  // Calculate statistics
  const resolvedTickets = totalTickets - openTickets;
  const resolutionRate = totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(1) : '0';

  // Prepare chart data
  const statusData = ticketsByStatus.map(item => ({
    name: item.status,
    value: item._count.status
  }));

  const priorityData = ticketsByPriority.map(item => ({
    name: item.priority,
    value: item._count.priority
  }));

  // Mock data for time-based charts (you can replace with real data)
  const revenueData = [
    { day: '01', current: 120, previous: 100 },
    { day: '02', current: 150, previous: 120 },
    { day: '03', current: 180, previous: 140 },
    { day: '04', current: 200, previous: 160 },
    { day: '05', current: 220, previous: 180 },
    { day: '06', current: 250, previous: 200 },
  ];

  const orderData = [
    { day: '01', current: 45, previous: 40 },
    { day: '02', current: 52, previous: 45 },
    { day: '03', current: 48, previous: 42 },
    { day: '04', current: 60, previous: 50 },
    { day: '05', current: 55, previous: 48 },
    { day: '06', current: 65, previous: 55 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Tickets</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Report
              </button>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {totalTickets.toLocaleString()}
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+{resolutionRate}% resolution rate</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">Tickets from all time</p>
          </div>

          {/* Order Time Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Open Tickets</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Report
              </button>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {openTickets}
            </div>
            <div className="flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-600">-{((openTickets / totalTickets) * 100).toFixed(1)}% of total</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">Currently pending</p>
          </div>

          {/* Rating Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Users</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {usersCount}
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">Active users</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">Registered in system</p>
          </div>

          {/* Order Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resolution Rate</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Report
              </button>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {resolutionRate}%
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+{resolutionRate}% success</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">Tickets resolved</p>
          </div>
        </div>

        {/* Charts */}
        <DashboardCharts 
          statusData={statusData}
          revenueData={revenueData}
          orderData={orderData}
          recentTickets={recentTickets}
        />
      </div>
    </div>
  );
}


