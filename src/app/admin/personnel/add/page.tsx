"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, User, Building } from "lucide-react";
import Link from "next/link";

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
        router.push("/admin/personnel/list");
      } else {
        const error = await response.json();
        alert(error.message || "Có lỗi xảy ra khi thêm nhân sự");
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      alert("Có lỗi xảy ra khi thêm nhân sự");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/admin/personnel/list"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thêm nhân sự mới</h1>
              <p className="text-gray-600">Tạo hồ sơ nhân sự mới</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Cột trái - Thông tin cá nhân */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h3>
                </div>
                
                <div className="space-y-5">
                  <div className="flex items-center">
                    <label htmlFor="employeeId" className="w-32 text-sm font-medium text-gray-700">
                      Mã số <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="employeeId"
                      name="employeeId"
                      required
                      value={formData.employeeId || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="NV001"
                    />
                  </div>

                  <div className="flex items-center">
                    <label htmlFor="name" className="w-32 text-sm font-medium text-gray-700">
                      Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div className="flex items-center">
                    <label htmlFor="dateOfBirth" className="w-32 text-sm font-medium text-gray-700">
                      Năm sinh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      required
                      value={formData.dateOfBirth || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center">
                    <label htmlFor="gender" className="w-32 text-sm font-medium text-gray-700">
                      Giới tính <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      required
                      value={formData.gender || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label htmlFor="hometown" className="w-32 text-sm font-medium text-gray-700">
                      Quê quán
                    </label>
                    <input
                      type="text"
                      id="hometown"
                      name="hometown"
                      value={formData.hometown || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Hà Nội"
                    />
                  </div>

                  <div className="flex items-center">
                    <label htmlFor="religion" className="w-32 text-sm font-medium text-gray-700">
                      Tôn giáo
                    </label>
                    <input
                      type="text"
                      id="religion"
                      name="religion"
                      value={formData.religion || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Không"
                    />
                  </div>

                  <div className="flex items-center">
                    <label htmlFor="ethnicity" className="w-32 text-sm font-medium text-gray-700">
                      Dân tộc
                    </label>
                    <input
                      type="text"
                      id="ethnicity"
                      name="ethnicity"
                      value={formData.ethnicity || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Kinh"
                    />
                  </div>

                  <div className="flex items-center">
                    <label htmlFor="seniority" className="w-32 text-sm font-medium text-gray-700">
                      Thâm niên
                    </label>
                    <input
                      type="text"
                      id="seniority"
                      name="seniority"
                      value={formData.seniority || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="2 năm"
                    />
                  </div>

                  <div className="flex items-center">
                    <label htmlFor="startDate" className="w-32 text-sm font-medium text-gray-700">
                      Ngày vào làm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      required
                      value={formData.startDate || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center">
                    <label htmlFor="phone" className="w-32 text-sm font-medium text-gray-700">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0123456789"
                    />
                  </div>

                  <div className="flex items-center">
                    <label htmlFor="email" className="w-32 text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="example@company.com"
                    />
                  </div>

                  <div className="flex items-center">
                    <label htmlFor="placeOfBirth" className="w-32 text-sm font-medium text-gray-700">
                      Nơi sinh
                    </label>
                    <input
                      type="text"
                      id="placeOfBirth"
                      name="placeOfBirth"
                      value={formData.placeOfBirth || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Thông tin công việc</h3>
                </div>
                
                <div className="space-y-5">
                  <div className="flex items-center">
                    <label htmlFor="avatar" className="w-32 text-sm font-medium text-gray-700">
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

                  <div className="flex items-center">
                    <label htmlFor="position" className="w-32 text-sm font-medium text-gray-700">
                      Chức vụ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      required
                      value={formData.position || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Developer, Manager, Staff..."
                    />
                  </div>

                  <div className="flex items-center">
                    <label htmlFor="contractType" className="w-32 text-sm font-medium text-gray-700">
                      Loại hợp đồng <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="contractType"
                      name="contractType"
                      required
                      value={formData.contractType || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn loại hợp đồng</option>
                      <option value="Chính thức">Chính thức</option>
                      <option value="Thử việc">Thử việc</option>
                      <option value="Hợp đồng xác định thời hạn">Hợp đồng xác định thời hạn</option>
                      <option value="Hợp đồng không xác định thời hạn">Hợp đồng không xác định thời hạn</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label htmlFor="department" className="w-32 text-sm font-medium text-gray-700">
                      Phòng ban <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      required
                      value={formData.department || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="IT, HR, Sales, Marketing..."
                    />
                  </div>

                  <div className="flex items-center">
                    <label htmlFor="officeLocation" className="w-32 text-sm font-medium text-gray-700">
                      Văn phòng làm việc
                    </label>
                    <input
                      type="text"
                      id="officeLocation"
                      name="officeLocation"
                      value={formData.officeLocation || ""}
                      onChange={handleInputChange}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tầng 5, Tòa A"
                    />
                  </div>

                  <div className="flex items-start">
                    <label htmlFor="officeAddress" className="w-32 text-sm font-medium text-gray-700 pt-2">
                      Địa chỉ văn phòng
                    </label>
                    <textarea
                      id="officeAddress"
                      name="officeAddress"
                      value={formData.officeAddress || ""}
                      onChange={handleInputChange}
                      rows={3}
                      className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Nhập địa chỉ văn phòng làm việc"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 mt-8 border-t border-gray-200">
              <Link
                href="/admin/personnel/list"
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Đang lưu..." : "Lưu nhân sự"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
