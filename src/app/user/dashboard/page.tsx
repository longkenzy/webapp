import { db } from "@/lib/db";
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
  FileText
} from "lucide-react";
import Link from "next/link";

export default async function UserDashboardPage() {
  const session = await getSession();
  
  // Fetch user's ticket statistics
  const [
    openTickets,
    inProgressTickets,
    resolvedTickets,
    totalTickets,
    recentTickets,
    upcomingSchedules
  ] = await Promise.all([
    db.ticket.count({ 
      where: { 
        requesterId: session?.user.id, 
        status: "OPEN" 
      } 
    }),
    db.ticket.count({ 
      where: { 
        requesterId: session?.user.id, 
        status: "IN_PROGRESS" 
      } 
    }),
    db.ticket.count({ 
      where: { 
        requesterId: session?.user.id, 
        status: "RESOLVED" 
      } 
    }),
    db.ticket.count({ 
      where: { 
        requesterId: session?.user.id 
      } 
    }),
    db.ticket.findMany({
      where: { requesterId: session?.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        assignee: {
          select: { name: true, email: true }
        }
      }
    }),
    db.schedule.findMany({
      where: { userId: session?.user.id },
      orderBy: { startAt: 'asc' },
      take: 3,
      where: {
        startAt: {
          gte: new Date()
        }
      }
    })
  ]);

  const stats = [
    {
      name: 'Tickets đang mở',
      value: openTickets,
      icon: Ticket,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Đang xử lý',
      value: inProgressTickets,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      name: 'Đã giải quyết',
      value: resolvedTickets,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Tổng tickets',
      value: totalTickets,
      icon: FileText,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const quickActions = [
    {
      name: 'Tạo ticket mới',
      description: 'Báo cáo sự cố hoặc yêu cầu hỗ trợ',
      icon: Plus,
      href: '/user/tickets/create',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Xem lịch làm việc',
      description: 'Kiểm tra lịch trình và cuộc hẹn',
      icon: Calendar,
      href: '/user/schedule',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      name: 'Cập nhật hồ sơ',
      description: 'Chỉnh sửa thông tin cá nhân',
      icon: User,
      href: '/user/profile',
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Mới</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Đang xử lý</span>;
      case 'RESOLVED':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Đã giải quyết</span>;
      case 'CLOSED':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Đã đóng</span>;
      case 'ON_HOLD':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Tạm dừng</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'P1':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Cao</span>;
      case 'P2':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Trung bình</span>;
      case 'P3':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Thấp</span>;
      case 'P4':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Rất thấp</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{priority}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Chào mừng trở lại, {session?.user?.name || 'User'}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Đây là tổng quan về tình trạng tickets và lịch làm việc của bạn
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                href={action.href}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tickets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Tickets gần đây</h2>
              <Link
                href="/user/tickets"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Xem tất cả
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentTickets.length > 0 ? (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {ticket.title.length > 40 ? `${ticket.title.substring(0, 40)}...` : ticket.title}
                        </h3>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>#{ticket.id.slice(-6)}</span>
                        <span>•</span>
                        <span>{new Date(ticket.updatedAt).toLocaleDateString('vi-VN')}</span>
                        {ticket.assignee && (
                          <>
                            <span>•</span>
                            <span>Được giao: {ticket.assignee.name || ticket.assignee.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/user/tickets/${ticket.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có tickets nào</p>
                <Link
                  href="/user/tickets/create"
                  className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tạo ticket đầu tiên
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Lịch làm việc sắp tới</h2>
              <Link
                href="/user/schedule"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Xem tất cả
              </Link>
            </div>
          </div>
          <div className="p-6">
            {upcomingSchedules.length > 0 ? (
              <div className="space-y-4">
                {upcomingSchedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{schedule.title}</h3>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{new Date(schedule.startAt).toLocaleDateString('vi-VN')}</span>
                        <span>•</span>
                        <span>
                          {new Date(schedule.startAt).toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} - {new Date(schedule.endAt).toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Không có lịch làm việc sắp tới</p>
                <Link
                  href="/user/schedule"
                  className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Xem lịch làm việc
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h2 className="text-lg font-semibold text-gray-900">Trạng thái hệ thống</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Hệ thống hoạt động bình thường</p>
              <p className="text-xs text-green-600">Tất cả dịch vụ đang hoạt động</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">Thời gian phản hồi</p>
              <p className="text-xs text-blue-600">Trung bình: 2-4 giờ</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-800">Hiệu suất hệ thống</p>
              <p className="text-xs text-purple-600">99.9% uptime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


