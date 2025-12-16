'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAvatarRefresh } from '@/contexts/AvatarRefreshContext';
import {
  Home,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  Settings,
  Briefcase,
  ChevronDown,
  Building2,
  Package,
  Truck,
  AlertTriangle,
  Wrench,
  Rocket,
  Printer,
  Bell,
  Shield
} from 'lucide-react';
import Image from 'next/image';

export default function UserNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { registerRefreshCallback } = useAvatarRefresh();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isWorkDropdownOpen, setIsWorkDropdownOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Timeout refs for consistent hover behavior
  const workDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navigation = [
    { name: 'Dashboard', href: '/user/dashboard', icon: Home },
    { name: 'In phiếu', href: '/user/print', icon: Printer },
  ];

  const workMenuItems = [
    { name: 'Case nhận hàng', href: '/user/work/receiving', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'Case giao hàng', href: '/user/work/delivery', icon: Truck, color: 'text-green-500', bg: 'bg-green-50' },
    { name: 'Case triển khai', href: '/user/work/deployment', icon: Rocket, color: 'text-purple-500', bg: 'bg-purple-50' },
    { name: 'Case bảo hành', href: '/user/work/warranty', icon: Shield, color: 'text-orange-500', bg: 'bg-orange-50' },
    { name: 'Case bảo trì', href: '/user/work/maintenance', icon: Wrench, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { name: 'Case xử lý sự cố', href: '/user/work/incident', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
    { name: 'Case nội bộ', href: '/user/work/internal', icon: Building2, color: 'text-gray-500', bg: 'bg-gray-50' },
  ];

  const isActive = (href: string) => {
    if (href === '/user/print') {
      return pathname.startsWith('/user/print');
    }
    return pathname === href;
  };

  const router = useRouter();
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  // Helper functions for consistent hover behavior
  const handleWorkDropdownEnter = () => {
    if (workDropdownTimeoutRef.current) {
      clearTimeout(workDropdownTimeoutRef.current);
      workDropdownTimeoutRef.current = null;
    }
    setIsWorkDropdownOpen(true);
  };

  const handleWorkDropdownLeave = () => {
    workDropdownTimeoutRef.current = setTimeout(() => {
      setIsWorkDropdownOpen(false);
    }, 150);
  };

  const handleProfileDropdownEnter = () => {
    if (profileDropdownTimeoutRef.current) {
      clearTimeout(profileDropdownTimeoutRef.current);
      profileDropdownTimeoutRef.current = null;
    }
    setIsProfileDropdownOpen(true);
  };

  const handleProfileDropdownLeave = () => {
    profileDropdownTimeoutRef.current = setTimeout(() => {
      setIsProfileDropdownOpen(false);
    }, 150);
  };

  // Fetch user avatar function
  const fetchUserAvatar = useCallback(async () => {
    if (session?.user?.id) {
      try {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserAvatar(data.avatarUrl);
        }
      } catch (error) {
        console.error('Error fetching user avatar:', error);
      }
    }
  }, [session?.user?.id]);

  // Register refresh callback with context
  useEffect(() => {
    registerRefreshCallback(fetchUserAvatar);
  }, [registerRefreshCallback, fetchUserAvatar]);

  // Initial fetch when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserAvatar();
    }
  }, [session?.user?.id, fetchUserAvatar]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isWorkDropdownOpen && !target.closest('.work-dropdown')) {
        setIsWorkDropdownOpen(false);
      }
      if (isProfileDropdownOpen && !target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isWorkDropdownOpen, isProfileDropdownOpen]);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200/50'
        : 'bg-white border-b border-gray-200'
        }`}
    >
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo and Brand */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/user/dashboard" className="flex items-center space-x-3 group">
              <div className="relative w-10 h-10 md:w-11 md:h-11 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo/logo.png"
                  alt="IT Services"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                  IT Services
                </span>
                <span className="text-[10px] md:text-xs font-medium text-gray-500 tracking-wide uppercase">
                  Management System
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 group ${active
                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <Icon className={`h-4 w-4 transition-colors duration-200 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Work Dropdown */}
            <div
              className="relative work-dropdown px-1"
              onMouseEnter={handleWorkDropdownEnter}
              onMouseLeave={handleWorkDropdownLeave}
            >
              <button
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 group ${workMenuItems.some(item => isActive(item.href))
                  ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <Briefcase className={`h-4 w-4 transition-colors duration-200 ${workMenuItems.some(item => isActive(item.href)) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                <span>Công việc</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isWorkDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Work Dropdown Menu */}
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden transition-all duration-200 origin-top ${isWorkDropdownOpen
                  ? 'opacity-100 visible transform scale-100 translate-y-0'
                  : 'opacity-0 invisible transform scale-95 -translate-y-2 pointer-events-none'
                  }`}
              >
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                  Quản lý công việc
                </div>
                <div className="p-1">
                  {workMenuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${active
                          ? 'bg-gray-50 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        onClick={() => setIsWorkDropdownOpen(false)}
                      >
                        <div className={`p-1.5 rounded-md ${active ? 'bg-white shadow-sm ring-1 ring-gray-100' : item.bg} group-hover:bg-white group-hover:shadow-sm group-hover:ring-1 group-hover:ring-gray-100 transition-all`}>
                          <Icon className={`h-4 w-4 ${item.color}`} />
                        </div>
                        <span>{item.name}</span>
                        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Profile & Notifications */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Notification Bell (Placeholder for now) */}
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors relative group">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

            {/* Profile Dropdown */}
            <div
              className="relative profile-dropdown"
              onMouseEnter={handleProfileDropdownEnter}
              onMouseLeave={handleProfileDropdownLeave}
            >
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-3 p-1.5 rounded-full hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 group"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-gray-100 group-hover:ring-blue-100 transition-all">
                  {userAvatar ? (
                    <Image
                      src={userAvatar.includes('/') ? userAvatar : `/api/avatars/${userAvatar}`}
                      alt="Avatar"
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="hidden md:flex flex-col items-start pr-2">
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {session?.user?.role || 'Nhân viên'}
                  </p>
                </div>
                <ChevronDown className={`hidden md:block h-4 w-4 text-gray-400 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              <div
                className={`absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden transition-all duration-200 origin-top-right ${isProfileDropdownOpen
                  ? 'opacity-100 visible transform scale-100 translate-y-0'
                  : 'opacity-0 invisible transform scale-95 -translate-y-2 pointer-events-none'
                  }`}
              >
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                  <p className="text-sm font-semibold text-gray-900">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {session?.user?.email}
                  </p>
                </div>

                <div className="p-1.5">
                  <Link
                    href="/user/profile"
                    className="flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 group"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md group-hover:bg-white group-hover:shadow-sm transition-all">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Hồ sơ cá nhân</span>
                  </Link>

                  <Link
                    href="/user/settings"
                    className="flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 group"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <div className="p-1.5 bg-gray-100 text-gray-600 rounded-md group-hover:bg-white group-hover:shadow-sm transition-all">
                      <Settings className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Cài đặt</span>
                  </Link>
                </div>

                <div className="border-t border-gray-50 mt-1 pt-1 p-1.5">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 px-3 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 w-full text-left transition-all duration-150 group"
                  >
                    <div className="p-1.5 bg-red-50 text-red-500 rounded-md group-hover:bg-white group-hover:shadow-sm transition-all">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-[80vh] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="py-4 space-y-1 bg-white">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Mobile Work Menu */}
            <div className="pt-4 mt-2 border-t border-gray-100">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Công việc
              </div>
              <div className="grid grid-cols-1 gap-1">
                {workMenuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${active
                        ? 'bg-gray-50 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className={`p-1.5 rounded-md ${item.bg} ${item.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span>{item.name}</span>
                      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
