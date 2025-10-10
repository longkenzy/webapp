"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { useAvatarRefresh } from "@/contexts/AvatarRefreshContext";
import { User, Mail, Phone, Building2, Calendar, MapPin, Shield, Edit3, Camera, Save, X, Lock } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  department: string | null;
  status: string | null;
  role: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  avatarUrl: string | null;
  employee: {
    id: string;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    hometown: string;
    religion: string;
    ethnicity: string;
    startDate: string;
    primaryPhone: string;
    secondaryPhone: string | null;
    personalEmail: string;
    companyEmail: string;
    placeOfBirth: string;
    permanentAddress: string;
    temporaryAddress: string | null;
    avatar: string | null;
    contractType: string | null;
    department: string | null;
    position: string | null;
    status: string;
  } | null;
  schedules: Array<{
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    createdAt: string;
  }>;
}

export default function UserProfilePage() {
  const { data: session } = useSession();
  const { refreshAvatar } = useAvatarRefresh();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    department: ""
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          department: data.department || ""
        });
      } else {
        const errorData = await response.json();
        toast.error(`Không thể tải thông tin profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error("Lỗi khi tải thông tin profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch("/api/user/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(prev => prev ? { ...prev, avatarUrl: result.avatarUrl } : null);
        toast.success("Cập nhật avatar thành công!");
        // Trigger refresh avatar in navbar
        refreshAvatar();
      } else {
        const error = await response.json();
        toast.error(error.error || "Lỗi khi upload avatar");
      }
    } catch (error) {
      toast.error("Lỗi khi upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(prev => prev ? { ...prev, ...result.user } : null);
        setEditing(false);
        toast.success("Cập nhật thông tin thành công!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Lỗi khi cập nhật thông tin");
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật thông tin");
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      });

      if (response.ok) {
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setChangingPassword(false);
        toast.success("Đổi mật khẩu thành công!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Lỗi khi đổi mật khẩu");
      }
    } catch (error) {
      toast.error("Lỗi khi đổi mật khẩu");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Vui lòng đăng nhập để xem thông tin profile</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Không thể tải thông tin profile</p>
        <button 
          onClick={fetchProfile}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 md:p-6">
      <div className="max-w-full mx-auto px-2 md:px-4">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2">Thông tin cá nhân</h1>
          <p className="text-xs md:text-base text-slate-600">Quản lý thông tin tài khoản và cài đặt bảo mật</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Profile Card */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              {/* Avatar Section */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <img
                    src={profile.avatarUrl ? (profile.avatarUrl.startsWith('/avatars/') ? profile.avatarUrl : `/avatars/${profile.avatarUrl}`) : "/logo/logo.png"}
                    alt="Avatar"
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-gray-100 shadow-lg"
                  />
                  <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </label>
                </div>
                
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mt-4 mb-1">
                  {profile.name || profile.username}
                </h2>
                <p className="text-sm text-gray-600 mb-1">{profile.email}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Shield className="h-3 w-3 mr-1" />
                  {profile.role.toLowerCase()}
                </span>
              </div>

              {/* Quick Stats */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Thông tin nhanh</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{profile.employee?.fullName || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{profile.employee?.department || profile.department || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Tham gia: {new Date(profile.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-gray-600" />
                Bảo mật
              </h3>
              
              <button
                onClick={() => setChangingPassword(!changingPassword)}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {changingPassword ? "Hủy đổi mật khẩu" : "Đổi mật khẩu"}
              </button>

              {changingPassword && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Nhập mật khẩu mới"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                  
                  <button
                    onClick={handleChangePassword}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Cập nhật mật khẩu
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Main Information */}
          <div className="xl:col-span-3">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-gray-600" />
                  Thông tin cơ bản
                </h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Chỉnh sửa
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Lưu
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: profile.name || "",
                          phone: profile.phone || "",
                          department: profile.department || ""
                        });
                      }}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Hủy
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Mail className="h-4 w-4 mr-1 text-gray-400" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-1 text-gray-400" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={profile.username}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-1 text-gray-400" />
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-gray-400" />
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Building2 className="h-4 w-4 mr-1 text-gray-400" />
                    Phòng ban
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-1 text-gray-400" />
                    Vai trò
                  </label>
                  <input
                    type="text"
                    value={profile.role}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Employee Information */}
            {profile.employee && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <User className="h-5 w-5 mr-2 text-gray-600" />
                  Thông tin nhân viên
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <User className="h-4 w-4 mr-1 text-gray-400" />
                      Họ tên đầy đủ
                    </label>
                    <input
                      type="text"
                      value={profile.employee.fullName}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      Ngày sinh
                    </label>
                    <input
                      type="text"
                      value={new Date(profile.employee.dateOfBirth).toLocaleDateString('vi-VN')}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <User className="h-4 w-4 mr-1 text-gray-400" />
                      Giới tính
                    </label>
                    <input
                      type="text"
                      value={profile.employee.gender}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      Quê quán
                    </label>
                    <input
                      type="text"
                      value={profile.employee.hometown}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      Ngày bắt đầu làm việc
                    </label>
                    <input
                      type="text"
                      value={new Date(profile.employee.startDate).toLocaleDateString('vi-VN')}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Building2 className="h-4 w-4 mr-1 text-gray-400" />
                      Vị trí
                    </label>
                    <input
                      type="text"
                      value={profile.employee.position || "Chưa cập nhật"}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Building2 className="h-4 w-4 mr-1 text-gray-400" />
                      Phòng ban
                    </label>
                    <input
                      type="text"
                      value={profile.employee.department || "Chưa cập nhật"}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Phone className="h-4 w-4 mr-1 text-gray-400" />
                      Số điện thoại chính
                    </label>
                    <input
                      type="text"
                      value={profile.employee.primaryPhone}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Mail className="h-4 w-4 mr-1 text-gray-400" />
                      Email cá nhân
                    </label>
                    <input
                      type="text"
                      value={profile.employee.personalEmail}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                    Thông tin địa chỉ
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nơi sinh</label>
                      <input
                        type="text"
                        value={profile.employee.placeOfBirth}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ thường trú</label>
                      <input
                        type="text"
                        value={profile.employee.permanentAddress}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                      />
                    </div>
                    
                    {profile.employee.temporaryAddress && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ tạm trú</label>
                        <input
                          type="text"
                          value={profile.employee.temporaryAddress}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


