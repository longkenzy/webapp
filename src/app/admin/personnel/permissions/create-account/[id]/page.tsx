"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, User, Lock, Mail, Shield } from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  fullName: string;
  companyEmail: string;
  position: string | null;
  department: string | null;
}

export default function CreateAccountPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "USER" as "ADMIN" | "IT_LEAD" | "IT_STAFF" | "USER"
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEmployee();
  }, [params.id]);

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/employees/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setEmployee(data);
        // Pre-fill username with email prefix
        const emailPrefix = data.companyEmail.split('@')[0];
        setFormData(prev => ({ ...prev, username: emailPrefix }));
      } else {
        console.error("Failed to fetch employee");
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username không được để trống";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username phải có ít nhất 3 ký tự";
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu không được để trống";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/create-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: params.id,
          username: formData.username,
          password: formData.password,
          role: formData.role,
        }),
      });

      if (response.ok) {
        toast.success("Tạo tài khoản thành công!", {
          duration: 3000,
          position: 'top-right',
        });
        router.push("/admin/personnel/permissions");
      } else {
        const error = await response.json();
        toast.error(`Lỗi: ${error.message || "Không thể tạo tài khoản"}`, {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error("Có lỗi xảy ra khi tạo tài khoản", {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy thông tin nhân sự</p>
          <Link href="/admin/personnel/permissions" className="text-blue-600 hover:underline mt-2 block">
            Quay lại trang phân quyền
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/personnel/permissions"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại trang phân quyền
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản cho nhân sự</h1>
          <p className="text-gray-600 mt-1">Thiết lập thông tin đăng nhập cho {employee.fullName}</p>
        </div>

        {/* Employee Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin nhân sự</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Họ và tên</p>
              <p className="text-gray-900">{employee.fullName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Email công việc</p>
              <p className="text-gray-900">{employee.companyEmail}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Chức vụ</p>
              <p className="text-gray-900">{employee.position || 'Chưa phân công'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Phòng ban</p>
              <p className="text-gray-900">{employee.department || 'Chưa phân công'}</p>
            </div>
          </div>
        </div>

        {/* Create Account Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Thiết lập tài khoản</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Username
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.username ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Nhập username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="h-4 w-4 inline mr-2" />
                Mật khẩu
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.password ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Nhập mật khẩu"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="h-4 w-4 inline mr-2" />
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.confirmPassword ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Nhập lại mật khẩu"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="h-4 w-4 inline mr-2" />
                Phân quyền
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="USER">User - Nhân viên thường</option>
                <option value="IT_STAFF">IT Staff - Nhân viên IT</option>
                <option value="IT_LEAD">IT Lead - Trưởng nhóm IT</option>
                <option value="ADMIN">Admin - Quản trị viên</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Chọn quyền truy cập phù hợp với vị trí công việc
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/admin/personnel/permissions"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Tạo tài khoản
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
