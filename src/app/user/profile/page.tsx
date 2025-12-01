"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { useAvatarRefresh } from "@/contexts/AvatarRefreshContext";
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  MapPin,
  Shield,
  Edit3,
  Camera,
  Save,
  X,
  Lock,
  Briefcase,
  Globe,
  Award,
  Clock
} from "lucide-react";
import Image from "next/image";

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-600 animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-8 w-8 rounded-full bg-blue-100"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Yêu cầu đăng nhập</h2>
          <p className="text-gray-500 mb-6">Vui lòng đăng nhập để xem thông tin cá nhân của bạn.</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-gray-500 mb-6">Đã xảy ra lỗi khi tải thông tin hồ sơ. Vui lòng thử lại sau.</p>
          <button
            onClick={fetchProfile}
            className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Cover Image & Header */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/30 to-transparent"></div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white relative">
              <Image
                src={profile.avatarUrl ? (profile.avatarUrl.startsWith('/avatars/') ? profile.avatarUrl : `/avatars/${profile.avatarUrl}`) : "/logo/logo.png"}
                alt="Avatar"
                fill
                className="object-cover"
                priority
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </div>
            <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-blue-700 transition-all shadow-lg hover:scale-110 z-30 group-hover:opacity-100 opacity-90">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
              <Camera className="h-5 w-5" />
            </label>
          </div>

          {/* User Info Header */}
          <div className="flex-1 pb-2 text-white md:text-gray-900 mt-2 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white md:text-gray-900 drop-shadow-md md:drop-shadow-none">
                  {profile.name || profile.username}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-white/90 md:text-gray-600 text-sm font-medium">
                  <span className="flex items-center bg-white/20 md:bg-blue-50 md:text-blue-700 px-3 py-1 rounded-full backdrop-blur-sm">
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    {profile.role}
                  </span>
                  <span className="flex items-center">
                    <Mail className="h-4 w-4 mr-1.5 opacity-80" />
                    {profile.email}
                  </span>
                  {profile.employee?.department && (
                    <span className="flex items-center">
                      <Building2 className="h-4 w-4 mr-1.5 opacity-80" />
                      {profile.employee.department}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md transition-all font-medium border border-gray-200"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all font-medium"
                    >
                      <Save className="h-4 w-4 mr-2" />
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
                      className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 border border-gray-200 transition-all font-medium"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Info & Security */}
          <div className="space-y-8">
            {/* Quick Stats Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-blue-600" />
                  Thông tin nhanh
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full mr-3 text-blue-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Họ và tên</p>
                    <p className="text-sm font-semibold text-gray-900">{profile.employee?.fullName || "Chưa cập nhật"}</p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-full mr-3 text-purple-600">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Vị trí</p>
                    <p className="text-sm font-semibold text-gray-900">{profile.employee?.position || "Chưa cập nhật"}</p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-full mr-3 text-green-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Ngày tham gia</p>
                    <p className="text-sm font-semibold text-gray-900">{new Date(profile.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-red-600" />
                  Bảo mật tài khoản
                </h3>
              </div>
              <div className="p-6">
                {!changingPassword ? (
                  <button
                    onClick={() => setChangingPassword(true)}
                    className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    <Lock className="h-4 w-4 mr-2 text-gray-500" />
                    Đổi mật khẩu
                  </button>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Mật khẩu mới</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Xác nhận mật khẩu</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleChangePassword}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all"
                      >
                        Cập nhật
                      </button>
                      <button
                        onClick={() => {
                          setChangingPassword(false);
                          setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-sm transition-all"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Thông tin tài khoản
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase group-hover:text-blue-600 transition-colors">Họ và tên</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!editing}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase group-hover:text-blue-600 transition-colors">Số điện thoại</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!editing}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase group-hover:text-blue-600 transition-colors">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 sm:text-sm shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase group-hover:text-blue-600 transition-colors">Username</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={profile.username}
                        disabled
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 sm:text-sm shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase group-hover:text-blue-600 transition-colors">Phòng ban</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        disabled={!editing}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Info Card */}
            {profile.employee && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                    Hồ sơ nhân viên
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-6">
                      <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Thông tin cá nhân</h4>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">Ngày sinh</label>
                          <p className="text-sm font-medium text-gray-900 mt-1 flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {new Date(profile.employee.dateOfBirth).toLocaleDateString('vi-VN')}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">Giới tính</label>
                          <p className="text-sm font-medium text-gray-900 mt-1 flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            {profile.employee.gender}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">Quê quán</label>
                          <p className="text-sm font-medium text-gray-900 mt-1 flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            {profile.employee.hometown}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Thông tin liên hệ & Công việc</h4>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">Email cá nhân</label>
                          <p className="text-sm font-medium text-gray-900 mt-1 flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {profile.employee.personalEmail}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">Ngày bắt đầu</label>
                          <p className="text-sm font-medium text-gray-900 mt-1 flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {new Date(profile.employee.startDate).toLocaleDateString('vi-VN')}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">Địa chỉ thường trú</label>
                          <p className="text-sm font-medium text-gray-900 mt-1 flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            {profile.employee.permanentAddress}
                          </p>
                        </div>
                      </div>
                    </div>
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
