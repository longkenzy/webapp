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
  Search,
  Settings,
  Briefcase,
  ChevronDown,
  Building2,
  Package,
  Truck,
  AlertTriangle,
  Wrench,
  Shield,
  Rocket,
  Printer
} from 'lucide-react';

export default function UserNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { registerRefreshCallback } = useAvatarRefresh();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isWorkDropdownOpen, setIsWorkDropdownOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  
  // Timeout refs for consistent hover behavior
  const workDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navigation = [
    { name: 'Dashboard', href: '/user/dashboard', icon: Home },
    { name: 'Lịch làm việc', href: '/user/schedule', icon: Calendar },
    { name: 'In phiếu', href: '/user/print', icon: Printer },
  ];

  const workMenuItems = [
    { name: 'Case nhận hàng', href: '/user/work/receiving', icon: Package },
    { name: 'Case giao hàng', href: '/user/work/delivery', icon: Truck },
    { name: 'Case triển khai', href: '/user/work/deployment', icon: Rocket },
    { name: 'Case bảo hành', href: '/user/work/warranty', icon: Shield },
    { name: 'Case bảo trì', href: '/user/work/maintenance', icon: Wrench },
    { name: 'Case xử lý sự cố', href: '/user/work/incident', icon: AlertTriangle },
    { name: 'Case nội bộ', href: '/user/work/internal', icon: Building2 },
  ];

  const isActive = (href: string) => {
    if (href === '/user/print') {
      // Special case for print pages - active if on any print subpage
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
          credentials: 'include', // Include cookies for authentication
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserAvatar(data.avatarUrl);
        } else if (response.status === 401) {
          console.warn('User not authenticated for profile fetch');
        } else {
          console.error('Failed to fetch user profile:', response.status, response.statusText);
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (workDropdownTimeoutRef.current) {
        clearTimeout(workDropdownTimeoutRef.current);
      }
      if (profileDropdownTimeoutRef.current) {
        clearTimeout(profileDropdownTimeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/user/dashboard" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-lg overflow-hidden group-hover:opacity-90 transition-opacity duration-200">
                <img 
                  src="/logo/logo.png" 
                  alt="IT Services" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-semibold text-gray-900">
                  IT Services Management
                </span>
                <p className="text-xs text-gray-500 -mt-1">Professional Solutions</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive(item.href) ? 'text-white' : 'text-gray-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Work Dropdown */}
            <div 
              className="relative work-dropdown"
              onMouseEnter={handleWorkDropdownEnter}
              onMouseLeave={handleWorkDropdownLeave}
            >
              <button
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  workMenuItems.some(item => isActive(item.href))
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Briefcase className={`h-4 w-4 ${workMenuItems.some(item => isActive(item.href)) ? 'text-white' : 'text-gray-500'}`} />
                <span>Công việc</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isWorkDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Work Dropdown Menu */}
              <div 
                className={`absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 overflow-hidden transition-all duration-200 ${
                  isWorkDropdownOpen 
                    ? 'opacity-100 visible transform scale-100 translate-y-0' 
                    : 'opacity-0 invisible transform scale-95 -translate-y-2 pointer-events-none'
                }`}
                onMouseEnter={handleWorkDropdownEnter}
                onMouseLeave={handleWorkDropdownLeave}
              >
                {workMenuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-2.5 text-sm transition-all duration-150 ${
                        isActive(item.href)
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setIsWorkDropdownOpen(false)}
                      style={{
                        animationDelay: isWorkDropdownOpen ? `${index * 50}ms` : '0ms'
                      }}
                    >
                      <Icon className={`h-4 w-4 transition-colors duration-150 ${isActive(item.href) ? 'text-gray-700' : 'text-gray-500'}`} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right side - Profile */}
          <div className="flex items-center space-x-4">
            {/* Profile Dropdown */}
            <div 
              className="relative profile-dropdown"
              onMouseEnter={handleProfileDropdownEnter}
              onMouseLeave={handleProfileDropdownLeave}
            >
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden group-hover:opacity-90 transition-opacity duration-200">
                  {userAvatar ? (
                    <img 
                      src={userAvatar.startsWith('/avatars/') ? userAvatar : `/avatars/${userAvatar}`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session?.user?.email}
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              <div 
                className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 overflow-hidden transition-all duration-200 ${
                  isProfileDropdownOpen 
                    ? 'opacity-100 visible transform scale-100 translate-y-0' 
                    : 'opacity-0 invisible transform scale-95 -translate-y-2 pointer-events-none'
                }`}
                onMouseEnter={handleProfileDropdownEnter}
                onMouseLeave={handleProfileDropdownLeave}
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {session?.user?.email}
                  </p>
                </div>
                
                <Link
                  href="/user/profile"
                  className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150"
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  <User className="h-4 w-4 text-gray-500 transition-colors duration-150" />
                  <span>Hồ sơ cá nhân</span>
                </Link>
                
                <Link
                  href="/user/settings"
                  className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150"
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  <Settings className="h-4 w-4 text-gray-500 transition-colors duration-150" />
                  <span>Cài đặt</span>
                </Link>
                
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left transition-all duration-150"
                  >
                    <LogOut className="h-4 w-4 transition-colors duration-150" />
                    <span>Đăng xuất</span>
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
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 bg-white">
            <div className="space-y-1 px-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 ${
                      isActive(item.href)
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className={`h-4 w-4 ${isActive(item.href) ? 'text-white' : 'text-gray-500'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Work Menu */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Công việc
                </div>
                {workMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 ${
                        isActive(item.href)
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className={`h-4 w-4 ${isActive(item.href) ? 'text-white' : 'text-gray-500'}`} />
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
