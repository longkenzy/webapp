"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { useAvatarRefresh } from "@/contexts/AvatarRefreshContext";

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
    <div className="max-w-6xl mx-auto px-4 pt-4 pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Thông tin cá nhân</h1>
        <p className="text-gray-600">Quản lý thông tin tài khoản và cài đặt bảo mật</p>
      </div>

      {/* Avatar Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={profile.avatarUrl ? (profile.avatarUrl.startsWith('/avatars/') ? profile.avatarUrl : `/avatars/${profile.avatarUrl}`) : "/logo/logo.png"}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
            <label className="absolute -bottom-1 -right-1 bg-gray-800 text-white rounded-full p-1.5 cursor-pointer hover:bg-gray-700 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </label>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">{profile.name || profile.username}</h2>
            <p className="text-gray-600">{profile.email}</p>
            <p className="text-sm text-gray-500 capitalize">{profile.role.toLowerCase()}</p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Thông tin cơ bản</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Chỉnh sửa
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Hủy
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={profile.username}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!editing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!editing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              disabled={!editing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
            <input
              type="text"
              value={profile.role}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Bảo mật</h3>
          <button
            onClick={() => setChangingPassword(!changingPassword)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {changingPassword ? "Hủy" : "Đổi mật khẩu"}
          </button>
        </div>

        {changingPassword && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleChangePassword}
                className="px-6 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cập nhật mật khẩu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Employee Information */}
      {profile.employee && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Thông tin nhân viên</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên đầy đủ</label>
              <input
                type="text"
                value={profile.employee.fullName}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input
                type="text"
                value={new Date(profile.employee.dateOfBirth).toLocaleDateString('vi-VN')}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
              <input
                type="text"
                value={profile.employee.gender}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quê quán</label>
              <input
                type="text"
                value={profile.employee.hometown}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu làm việc</label>
              <input
                type="text"
                value={new Date(profile.employee.startDate).toLocaleDateString('vi-VN')}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
              <input
                type="text"
                value={profile.employee.position || "Chưa cập nhật"}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


