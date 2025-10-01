import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { ArrowLeft, Edit, Calendar, Phone, Mail, MapPin, User, Building, FileText, Clock, BadgeCheck } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EmployeeViewPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!atLeast(session.user.role, Role.IT_STAFF)) redirect("/user/dashboard");

  // Fetch employee data
  const employee = await db.employee.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!employee) {
    throw new Error('Không tìm thấy nhân sự');
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  const getAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getGenderBadge = (gender: string) => {
    switch (gender) {
      case 'Nam':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Nam</span>;
      case 'Nữ':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800">Nữ</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">{gender}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Đang làm việc</span>;
      case 'inactive':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Nghỉ việc</span>;
      case 'pending':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getContractTypeBadge = (contractType: string | null) => {
    if (!contractType) return null;
    switch (contractType) {
      case 'Chính thức':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Chính thức</span>;
      case 'Thử việc':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Thử việc</span>;
      case 'Cộng tác viên':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Cộng tác viên</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">{contractType}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/personnel/list"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Quay lại danh sách
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thông tin nhân sự</h1>
              <p className="text-gray-600 mt-1">Chi tiết thông tin cá nhân và công việc</p>
            </div>
          </div>
          
          <Link
            href={`/admin/personnel/edit/${employee.id}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {employee.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{employee.fullName}</h2>
                  <div className="flex items-center space-x-4 mt-2">
                    {getStatusBadge(employee.status)}
                    {getContractTypeBadge(employee.contractType)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Họ và tên</label>
                    <p className="text-gray-900">{employee.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ngày sinh</label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{formatDate(employee.dateOfBirth)} ({getAge(employee.dateOfBirth)} tuổi)</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Giới tính</label>
                    {getGenderBadge(employee.gender)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Nơi sinh</label>
                    <p className="text-gray-900">{employee.placeOfBirth}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Quê quán</label>
                    <p className="text-gray-900">{employee.hometown}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Dân tộc</label>
                    <p className="text-gray-900">{employee.ethnicity}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Tôn giáo</label>
                    <p className="text-gray-900">{employee.religion}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Chức vụ</label>
                    <div className="flex items-center space-x-2">
                      <BadgeCheck className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{employee.position || 'Chưa phân công'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phòng ban</label>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{employee.department || 'Chưa phân công'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ngày bắt đầu làm việc</label>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{formatDate(employee.startDate)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Loại hợp đồng</label>
                    {getContractTypeBadge(employee.contractType) || <p className="text-gray-900">Chưa xác định</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Trạng thái</label>
                    {getStatusBadge(employee.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-blue-600" />
                Thông tin liên hệ
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Số điện thoại chính</label>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{employee.primaryPhone}</p>
                    </div>
                  </div>
                  {employee.secondaryPhone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Số điện thoại phụ</label>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">{employee.secondaryPhone}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email cá nhân</label>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{employee.personalEmail}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email công ty</label>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{employee.companyEmail}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                Thông tin địa chỉ
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Địa chỉ thường trú</label>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <p className="text-gray-900">{employee.permanentAddress}</p>
                  </div>
                </div>
                {employee.temporaryAddress && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Địa chỉ tạm trú</label>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <p className="text-gray-900">{employee.temporaryAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* System Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Thông tin hệ thống
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">ID nhân sự</label>
                  <p className="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded">{employee.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Ngày tạo</label>
                  <p className="text-gray-900">{formatDate(employee.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Cập nhật lần cuối</label>
                  <p className="text-gray-900">{formatDate(employee.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
              
              <div className="space-y-3">
                <Link
                  href={`/admin/personnel/edit/${employee.id}`}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa thông tin
                </Link>
                
                <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  <FileText className="h-4 w-4 mr-2" />
                  Xuất thông tin
                </button>
                
                <button className="w-full flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors">
                  <User className="h-4 w-4 mr-2" />
                  Vô hiệu hóa
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
