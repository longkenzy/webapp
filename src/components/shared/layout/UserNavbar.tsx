'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Ticket, 
  Calendar, 
  User, 
  LogOut, 
  Menu, 
  X,
  Search,
  Settings,
  Briefcase,
  ChevronDown,
  Bell,
  Building2,
  Package,
  Truck,
  AlertTriangle,
  Wrench,
  Shield
} from 'lucide-react';
import NotificationDropdown from '@/components/shared/common/NotificationDropdown';

export default function UserNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isWorkDropdownOpen, setIsWorkDropdownOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/user/dashboard', icon: Home },
    { name: 'Lịch làm việc', href: '/user/schedule', icon: Calendar },
    { name: 'Hồ sơ', href: '/user/profile', icon: User },
  ];

  const workMenuItems = [
    { name: 'Case nội bộ', href: '/user/work/internal', icon: Building2 },
    { name: 'Case nhận hàng', href: '/user/work/receiving', icon: Package },
    { name: 'Case giao hàng', href: '/user/work/delivery', icon: Truck },
    { name: 'Case xử lý sự cố', href: '/user/work/incident', icon: AlertTriangle },
    { name: 'Case bảo trì', href: '/user/work/maintenance', icon: Wrench },
    { name: 'Case bảo hành', href: '/user/work/warranty', icon: Shield },
  ];

  const isActive = (href: string) => pathname === href;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close work dropdown
      if (isWorkDropdownOpen && !target.closest('.work-dropdown')) {
        setIsWorkDropdownOpen(false);
      }
      
      // Close profile dropdown
      if (isProfileDropdownOpen && !target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isWorkDropdownOpen, isProfileDropdownOpen]);

  return (
    <nav className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 shadow-lg backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/user/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg tracking-wide">IT</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
                  IT Services
                </span>
                <p className="text-xs text-slate-500 -mt-1">Professional Solutions</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:shadow-md'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive(item.href) ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Work Dropdown */}
            <div 
              className="relative work-dropdown"
              onMouseEnter={() => setIsWorkDropdownOpen(true)}
              onMouseLeave={() => {
                setTimeout(() => {
                  setIsWorkDropdownOpen(false);
                }, 150);
              }}
            >
              <button
                onClick={() => setIsWorkDropdownOpen(!isWorkDropdownOpen)}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  workMenuItems.some(item => isActive(item.href))
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:shadow-md'
                }`}
              >
                <Briefcase className={`h-4 w-4 ${workMenuItems.some(item => isActive(item.href)) ? 'text-white' : 'text-slate-500'}`} />
                <span>Công việc</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isWorkDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Work Dropdown Menu */}
              {isWorkDropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-72 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/50 py-2 z-50 space-y-0 overflow-hidden"
                >
                  {workMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-3 px-4 py-3 text-sm transition-all duration-200 border-b border-slate-100/50 last:border-b-0 ${
                          isActive(item.href)
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-l-blue-500'
                            : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 hover:text-slate-900'
                        }`}
                        onClick={() => setIsWorkDropdownOpen(false)}
                      >
                        <Icon className={`h-4 w-4 ${isActive(item.href) ? 'text-blue-600' : 'text-slate-500'}`} />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Notifications, Profile */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <div className="relative">
              <NotificationDropdown />
            </div>

            {/* Profile Dropdown */}
            <div 
              className="relative profile-dropdown"
              onMouseEnter={() => setIsProfileDropdownOpen(true)}
              onMouseLeave={() => {
                setTimeout(() => {
                  setIsProfileDropdownOpen(false);
                }, 150);
              }}
            >
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/60 transition-all duration-200 hover:shadow-md group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-semibold text-sm">
                    {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-900">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {session?.user?.email}
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/50 py-3 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100/50 bg-gradient-to-r from-slate-50 to-blue-50">
                    <p className="text-sm font-semibold text-slate-900">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {session?.user?.email}
                    </p>
                  </div>
                  
                  <Link
                    href="/user/profile"
                    className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 transition-all duration-200"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <User className="h-4 w-4 text-slate-500" />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                  
                  <Link
                    href="/user/settings"
                    className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 transition-all duration-200"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <Settings className="h-4 w-4 text-slate-500" />
                    <span>Cài đặt</span>
                  </Link>
                  
                  <div className="border-t border-slate-100/50 mt-2 pt-2">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 w-full text-left transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 text-slate-600 hover:text-slate-900 hover:bg-white/60 rounded-xl transition-all duration-200 hover:shadow-md"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200/50 py-4 bg-white/95 backdrop-blur-sm rounded-b-2xl shadow-lg">
            <div className="space-y-2 px-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className={`h-4 w-4 ${isActive(item.href) ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Work Menu */}
              <div className="border-t border-slate-200/50 pt-3 mt-3">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Công việc
                </div>
                {workMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive(item.href)
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className={`h-4 w-4 ${isActive(item.href) ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            

          </div>
        )}
      </div>
    </nav>
  );
}
