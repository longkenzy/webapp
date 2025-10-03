"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Bell, Search, Settings, User, LogOut, ChevronDown, Menu, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAvatarRefresh } from "@/contexts/AvatarRefreshContext";
import NotificationCenter from "@/components/shared/common/NotificationCenter";

interface AdminTopbarProps {
  onMenuClick?: () => void;
}

export default function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const { data } = useSession();
  const { registerRefreshCallback } = useAvatarRefresh();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Fetch user avatar function
  const fetchUserAvatar = useCallback(async () => {
    if (data?.user?.id) {
      try {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (response.ok) {
          const profileData = await response.json();
          setUserAvatar(profileData.avatarUrl);
        } else if (response.status === 401) {
          console.warn('User not authenticated for profile fetch');
        } else {
          console.error('Failed to fetch user profile:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching user avatar:', error);
      }
    }
  }, [data?.user?.id]);

  // Register refresh callback with context
  useEffect(() => {
    registerRefreshCallback(fetchUserAvatar);
  }, [registerRefreshCallback, fetchUserAvatar]);

  // Initial fetch when session changes
  useEffect(() => {
    if (data?.user?.id) {
      fetchUserAvatar();
    }
  }, [data?.user?.id, fetchUserAvatar]);

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 border-b bg-white/80 backdrop-blur-md flex items-center justify-between px-3 md:px-6 z-40 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile: Hamburger Menu */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search - Hidden on small mobile */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 w-48 md:w-80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 backdrop-blur-sm text-sm"
          />
        </div>
      </div>

      {/* Right Section - Actions & User */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications */}
        <NotificationCenter />

        {/* Settings - Hidden on mobile */}
        <button className="hidden md:block p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200">
          <Settings className="h-5 w-5" />
        </button>

        {/* Divider - Hidden on mobile */}
        <div className="hidden md:block w-px h-6 bg-gray-200"></div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden">
              {userAvatar ? (
                <img 
                  src={userAvatar.startsWith('/avatars/') ? userAvatar : `/avatars/${userAvatar}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {data?.user?.name?.charAt(0) || data?.user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-gray-900">
                {data?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {data?.user?.email}
              </p>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 hidden sm:block ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {data?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {data?.user?.email}
                </p>
              </div>
              
              <div className="py-1">
                <Link
                  href="/admin/profile"
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                
                <Link
                  href="/admin/settings"
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </div>
              
              <div className="border-t border-gray-100 pt-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}
