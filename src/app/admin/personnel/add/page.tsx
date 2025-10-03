"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, User, Building } from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';

export default function AddPersonnelPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Thông tin cá nhân
    employeeId: "",
    name: "",
    dateOfBirth: "",
    gender: "",
    hometown: "",
    religion: "",
    ethnicity: "",
    seniority: "",
    startDate: "",
    phone: "",
    email: "",
    placeOfBirth: "",
    temporaryAddress: "",
    
    // Thông tin công việc
    avatar: "",
    position: "",
    contractType: "",
    department: "",
    officeLocation: "",
    officeAddress: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: formData.employeeId,
          name: formData.name,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          hometown: formData.hometown,
          religion: formData.religion,
          ethnicity: formData.ethnicity,
          seniority: formData.seniority,
          startDate: formData.startDate,
          phone: formData.phone,
          email: formData.email,
          placeOfBirth: formData.placeOfBirth,
          temporaryAddress: formData.temporaryAddress,
          avatar: formData.avatar,
          position: formData.position,
          contractType: formData.contractType,
          department: formData.department,
          officeLocation: formData.officeLocation,
          officeAddress: formData.officeAddress,
        }),
      });

      if (response.ok) {
        toast.success("Thêm nhân sự thành công!", {
          duration: 4000,
          position: 'top-right',
        });
        router.push("/admin/personnel/list");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Có lỗi xảy ra khi thêm nhân sự", {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error("Có lỗi xảy ra khi thêm nhân sự", {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* iOS Safari input fix */}
      <style dangerouslySetInnerHTML={{ __html: `
        input, select, textarea {
          -webkit-text-fill-color: #111827 !important;
          opacity: 1 !important;
          color: #111827 !important;
        }
        input::placeholder, select::placeholder, textarea::placeholder {
          -webkit-text-fill-color: #9CA3AF !important;
          opacity: 1 !important;
          color: #9CA3AF !important;
        }
      ` }} />
      
      <div className="max-w-6xl mx-auto p-3 md:p-6">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-6">
            <Link
              href="/admin/personnel/list"
              className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Link>
            <div>
              <h1 className="text-base md:text-2xl font-bold text-gray-900">Thêm nhân sự mới</h1>
              <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Tạo hồ sơ nhân sự mới</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm">
          <form onSubmit={handleSubmit} className="p-3 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-10">
              {/* Cột trái - Thông tin cá nhân */}
              <div>
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm md:text-lg font-semibold text-gray-900">Thông tin cá nhân</h3>
                </div>
                
                <div className="space-y-3 md:space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="employeeId" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Mã số <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="employeeId"
                      name="employeeId"
                      required
                      value={formData.employeeId || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                      placeholder="NV001"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="name" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="dateOfBirth" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Năm sinh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      required
                      value={formData.dateOfBirth || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="gender" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Giới tính <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      required
                      value={formData.gender || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="hometown" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Quê quán
                    </label>
                    <input
                      type="text"
                      id="hometown"
                      name="hometown"
                      value={formData.hometown || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                      placeholder="Hà Nội"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="religion" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Tôn giáo
                    </label>
                    <input
                      type="text"
                      id="religion"
                      name="religion"
                      value={formData.religion || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                      placeholder="Không"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="ethnicity" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Dân tộc
                    </label>
                    <input
                      type="text"
                      id="ethnicity"
                      name="ethnicity"
                      value={formData.ethnicity || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                      placeholder="Kinh"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="seniority" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Thâm niên
                    </label>
                    <input
                      type="text"
                      id="seniority"
                      name="seniority"
                      value={formData.seniority || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                      placeholder="2 năm"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="startDate" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Ngày vào làm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      required
                      value={formData.startDate || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="phone" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                      placeholder="0123456789"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="email" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                      placeholder="example@company.com"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="placeOfBirth" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Nơi sinh
                    </label>
                    <input
                      type="text"
                      id="placeOfBirth"
                      name="placeOfBirth"
                      value={formData.placeOfBirth || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                      placeholder="Hà Nội"
                    />
                  </div>

                  <div className="flex items-start">
                    <label htmlFor="temporaryAddress" className="w-32 text-sm font-medium text-gray-700 pt-2">
                      Địa chỉ tạm trú
                    </label>
                    <textarea
                      id="temporaryAddress"
                      name="temporaryAddress"
                      value={formData.temporaryAddress || ""}
                      onChange={handleInputChange}
                      rows={3}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Nhập địa chỉ tạm trú hiện tại"
                    />
                  </div>
                </div>
              </div>

              {/* Cột phải - Thông tin công việc */}
              <div>
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <Building className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
                  </div>
                  <h3 className="text-sm md:text-lg font-semibold text-gray-900">Thông tin công việc</h3>
                </div>
                
                <div className="space-y-3 md:space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="avatar" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Avatar
                    </label>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                      <input
                        type="file"
                        id="avatar"
                        name="avatar"
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('avatar')?.click()}
                        className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                      >
                        Chọn ảnh
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="position" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Chức vụ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      required
                      value={formData.position || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                      placeholder="Developer, Manager, Staff..."
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="contractType" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Loại hợp đồng <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="contractType"
                      name="contractType"
                      required
                      value={formData.contractType || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                    >
                      <option value="">Chọn loại hợp đồng</option>
                      <option value="Chính thức">Chính thức</option>
                      <option value="Thử việc">Thử việc</option>
                      <option value="Hợp đồng xác định thời hạn">Hợp đồng xác định thời hạn</option>
                      <option value="Hợp đồng không xác định thời hạn">Hợp đồng không xác định thời hạn</option>
                    </select>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="department" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Phòng ban <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      required
                      value={formData.department || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                      placeholder="IT, HR, Sales, Marketing..."
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <label htmlFor="officeLocation" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-0">
                      Văn phòng làm việc
                    </label>
                    <input
                      type="text"
                      id="officeLocation"
                      name="officeLocation"
                      value={formData.officeLocation || ""}
                      onChange={handleInputChange}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      style={{ WebkitAppearance: 'none' }}
                      placeholder="Tầng 5, Tòa A"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-start">
                    <label htmlFor="officeAddress" className="md:w-32 text-xs md:text-sm font-medium text-gray-700 mb-1 md:pt-2 md:mb-0">
                      Địa chỉ văn phòng
                    </label>
                    <textarea
                      id="officeAddress"
                      name="officeAddress"
                      value={formData.officeAddress || ""}
                      onChange={handleInputChange}
                      rows={3}
                      className="flex-1 md:ml-4 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs md:text-sm"
                      placeholder="Nhập địa chỉ văn phòng làm việc"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-2 md:gap-3 pt-4 md:pt-6 mt-4 md:mt-8 border-t border-gray-200">
              <Link
                href="/admin/personnel/list"
                className="w-full md:w-auto text-center px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto inline-flex items-center justify-center px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white text-xs md:text-sm rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                {isLoading ? "Đang lưu..." : "Lưu nhân sự"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
