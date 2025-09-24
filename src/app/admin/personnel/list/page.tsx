'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Users } from "lucide-react";
import Link from "next/link";
import DeleteConfirmationModal from '@/components/shared/common/DeleteConfirmationModal';

interface Employee {
  id: string;
  fullName: string;
  dateOfBirth: Date;
  gender: string;
  hometown: string;
  religion: string;
  ethnicity: string;
  startDate: Date;
  primaryPhone: string;
  secondaryPhone: string | null;
  personalEmail: string;
  companyEmail: string;
  placeOfBirth: string;
  permanentAddress: string;
  temporaryAddress: string | null;
  position: string | null;
  department: string | null;
  status: string;
  contractType: string | null;
  avatar: string | null;
  createdAt: Date;
}

export default function PersonnelListPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  
  // Sort states
  const [sortBy, setSortBy] = useState<'startDate' | 'name' | 'department' | 'position'>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter employees when filters change
  useEffect(() => {
    applyFilters();
  }, [employees, searchTerm, genderFilter, departmentFilter, positionFilter, sortBy, sortDirection]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...employees];

    // Search by name
    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.companyEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.personalEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by gender
    if (genderFilter) {
      filtered = filtered.filter(employee => employee.gender === genderFilter);
    }

    // Filter by department
    if (departmentFilter) {
      filtered = filtered.filter(employee => 
        employee.department && employee.department.toLowerCase().includes(departmentFilter.toLowerCase())
      );
    }

    // Filter by position
    if (positionFilter) {
      filtered = filtered.filter(employee => 
        employee.position && employee.position.toLowerCase().includes(positionFilter.toLowerCase())
      );
    }

    // Sort employees
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'startDate':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case 'name':
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case 'department':
          const deptA = a.department || '';
          const deptB = b.department || '';
          comparison = deptA.localeCompare(deptB);
          break;
        case 'position':
          const posA = a.position || '';
          const posB = b.position || '';
          comparison = posA.localeCompare(posB);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredEmployees(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGenderFilter('');
    setDepartmentFilter('');
    setPositionFilter('');
    setSortBy('startDate');
    setSortDirection('asc');
  };

  const getUniqueDepartments = () => {
    const departments = employees
      .map(emp => emp.department)
      .filter((dept): dept is string => dept !== null && dept !== undefined && dept.trim() !== '')
      .filter((dept, index, arr) => arr.indexOf(dept) === index);
    return departments.sort();
  };

  const getUniquePositions = () => {
    const positions = employees
      .map(emp => emp.position)
      .filter((pos): pos is string => pos !== null && pos !== undefined && pos.trim() !== '')
      .filter((pos, index, arr) => arr.indexOf(pos) === index);
    return positions.sort();
  };

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/employees/${employeeToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Có lỗi xảy ra khi xóa nhân sự');
        setShowDeleteModal(false);
        setEmployeeToDelete(null);
        return;
      }

      setSuccess('Xóa nhân sự thành công!');
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      
      // Refresh the employee list
      await fetchEmployees();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getGenderBadge = (gender: string) => {
    switch (gender) {
      case 'Nam':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Nam</span>;
      case 'Nữ':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">Nữ</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{gender}</span>;
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Chưa xác định</span>;
    }
    
    switch (status.toLowerCase()) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Đang làm việc</span>;
      case 'inactive':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Nghỉ việc</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getContractTypeBadge = (contractType: string | null) => {
    if (!contractType) return null;
    switch (contractType) {
      case 'Chính thức':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Chính thức</span>;
      case 'Thử việc':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Thử việc</span>;
      case 'Cộng tác viên':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Cộng tác viên</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{contractType}</span>;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getYearOfBirth = (dateOfBirth: Date) => {
    return new Date(dateOfBirth).getFullYear();
  };

  const getWarningMessage = () => {
    if (employeeToDelete?.status === 'active') {
      return 'Nhân sự này đang có trạng thái "Đang làm việc". Vui lòng cập nhật trạng thái trước khi xóa.';
    }
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">×</button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span>✅ {success}</span>
            <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">×</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa nhân sự"
        itemName={employeeToDelete?.fullName || ''}
        isDeleting={isDeleting}
        warningMessage={getWarningMessage()}
        disabled={employeeToDelete?.status === 'active'}
      />

      {/* Main Content */}
      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Danh sách nhân sự</h1>
            <p className="text-gray-600 mt-1">Quản lý thông tin nhân sự trong hệ thống</p>
          </div>
          
          <Link
            href="/admin/personnel/add"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm nhân sự
          </Link>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-md">
                <Search className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Tìm kiếm & Lọc</h3>
                <p className="text-xs text-gray-600">Tìm kiếm và lọc nhân sự theo nhiều tiêu chí</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="space-y-4">
              {/* Search Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, email công ty, email cá nhân..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  />
                </div>
              </div>

              {/* Sort Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sắp xếp
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>Sắp xếp theo</span>
                      </div>
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'startDate' | 'name' | 'department' | 'position')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="startDate">Ngày vào làm</option>
                      <option value="name">Tên nhân sự</option>
                      <option value="department">Phòng ban</option>
                      <option value="position">Chức vụ</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                        <span>Thứ tự</span>
                      </div>
                    </label>
                    <select
                      value={sortDirection}
                      onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="asc">Cũ nhất trước</option>
                      <option value="desc">Mới nhất trước</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bộ lọc
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Gender Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                        <span>Giới tính</span>
                      </div>
                    </label>
                    <select
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  {/* Department Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Phòng ban</span>
                      </div>
                    </label>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả phòng ban</option>
                      {getUniqueDepartments().map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Position Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>Chức vụ</span>
                      </div>
                    </label>
                    <select
                      value={positionFilter}
                      onChange={(e) => setPositionFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="">Tất cả chức vụ</option>
                      {getUniquePositions().map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Active Filters & Actions */}
              {(searchTerm || genderFilter || departmentFilter || positionFilter || sortBy !== 'startDate' || sortDirection !== 'asc') && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-3 border border-blue-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-1.5 mb-1.5">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-semibold text-gray-800">Bộ lọc đang áp dụng</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {searchTerm && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            <Search className="h-2.5 w-2.5 mr-1" />
                            &quot;{searchTerm}&quot;
                          </span>
                        )}
                        {genderFilter && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800 border border-pink-200">
                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5"></div>
                            {genderFilter}
                          </span>
                        )}
                        {departmentFilter && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                            {departmentFilter}
                          </span>
                        )}
                        {positionFilter && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></div>
                            {positionFilter}
                          </span>
                        )}
                        {(sortBy !== 'startDate' || sortDirection !== 'asc') && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></div>
                            {sortBy === 'startDate' ? 'Ngày vào làm' : 
                             sortBy === 'name' ? 'Tên nhân sự' :
                             sortBy === 'department' ? 'Phòng ban' : 'Chức vụ'} 
                            {sortDirection === 'desc' ? ' (Mới nhất)' : ' (Cũ nhất)'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-800">
                          {filteredEmployees.length} kết quả
                        </div>
                        <div className="text-xs text-gray-500">
                          từ {employees.length} nhân sự
                        </div>
                      </div>
                      <button
                        onClick={clearFilters}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                      >
                        <span className="text-xs font-medium">Xóa bộ lọc</span>
                        <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                          {[searchTerm, genderFilter, departmentFilter, positionFilter].filter(Boolean).length + 
                           ((sortBy !== 'startDate' || sortDirection !== 'asc') ? 1 : 0)}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thông tin cá nhân
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vị trí công việc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liên hệ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee, index) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getYearOfBirth(employee.dateOfBirth)} • {getGenderBadge(employee.gender)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.position || 'Chưa phân công'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.department || 'Chưa phân công'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.primaryPhone}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.companyEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {getStatusBadge(employee.status)}
                        {getContractTypeBadge(employee.contractType)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/personnel/view/${employee.id}`}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Xem"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/personnel/edit/${employee.id}`}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => handleDeleteClick(employee)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors" 
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Empty State */}
          {filteredEmployees.length === 0 && employees.length > 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy nhân sự nào</h3>
              <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            </div>
          )}

          {employees.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <Users className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có nhân sự</h3>
              <p className="mt-1 text-sm text-gray-500">
                Bắt đầu bằng cách thêm nhân sự đầu tiên.
              </p>
              <div className="mt-6">
                <Link
                  href="/admin/personnel/add"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm nhân sự
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
