"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Truck,
  AlertTriangle,
  Wrench,
  Shield,
  Users,
  UserCheck,
  Settings,
  ChevronDown,
  BarChart3,
  Building2,
  Rocket,
  X,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isCollapsed?: boolean;
}

interface SubNavLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}

interface NavLinkWithDropdownProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  hasSubItems?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  isCollapsed?: boolean;
  subItems?: SubNavLinkProps[];
}

function NavLink({ href, label, icon: Icon, isActive, onClick, isCollapsed }: NavLinkProps & { onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-3'} py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative ${isActive
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      title={isCollapsed ? label : undefined}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
      {!isCollapsed && <span className="truncate">{label}</span>}

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </Link>
  );
}

function NavLinkWithDropdown({ href, label, icon: Icon, isActive, hasSubItems, isOpen, onToggle, isCollapsed, subItems }: NavLinkWithDropdownProps) {
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => isCollapsed && setShowFloatingMenu(true)}
      onMouseLeave={() => isCollapsed && setShowFloatingMenu(false)}
    >
      <button
        onClick={onToggle}
        className={`w-full group flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full`}>
          <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
          {!isCollapsed && <span className="truncate">{label}</span>}
        </div>
        {!isCollapsed && hasSubItems && (
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Floating Menu for Collapsed State */}
      {isCollapsed && showFloatingMenu && subItems && (
        <div className="absolute left-full top-0 ml-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100 mb-1">
            <span className="font-semibold text-gray-900 text-sm">{label}</span>
          </div>
          {subItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SubNavLink({ href, label, icon: Icon, isActive, onClick }: SubNavLinkProps & { onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center space-x-3 px-10 py-2 text-sm rounded-lg transition-colors ${isActive
        ? 'text-blue-600 font-medium bg-blue-50/50'
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
        }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
      <span>{label}</span>
    </Link>
  );
}

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
}

export default function AdminSidebar({ userName, userEmail, isOpen = false, onClose, isCollapsed = false, toggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (href: string) => {
    setOpenMenus(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const handleLinkClick = () => {
    // Auto-close sidebar on mobile when clicking a link
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  const menuItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/admin/work",
      label: "Công việc",
      icon: Briefcase,
      subItems: [
        { href: "/admin/receiving-cases", label: "Case nhận hàng", icon: Truck },
        { href: "/admin/delivery-cases", label: "Case giao hàng", icon: Truck },
        { href: "/admin/work/deployment", label: "Case triển khai", icon: Rocket },
        { href: "/admin/work/warranty", label: "Case bảo hành", icon: Shield },
        { href: "/admin/work/maintenance", label: "Case bảo trì", icon: Wrench },
        { href: "/admin/work/incident", label: "Case xử lý sự cố", icon: AlertTriangle },
        { href: "/admin/work/internal", label: "Case nội bộ", icon: FileText },
      ]
    },
    {
      href: "/admin/personnel",
      label: "Nhân sự",
      icon: Users,
      subItems: [
        { href: "/admin/personnel/list", label: "Danh sách nhân sự", icon: Users },
        { href: "/admin/personnel/permissions", label: "Phân quyền", icon: UserCheck },
      ]
    },
  ];

  const otherItems = [
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
      subItems: [
        { href: "/admin/settings/kpi", label: "Điểm KPI", icon: BarChart3 },
        { href: "/admin/partners", label: "Nhà cung cấp", icon: Building2 },
      ]
    },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-full bg-white shadow-xl border-r border-gray-200 z-50 transition-all duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo & Toggle - Fixed Height */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} h-16 border-b border-gray-100 flex-shrink-0`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image
                src="/logo/logo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 leading-none">IT Services</span>
              <span className="text-[10px] items-center text-gray-500 font-medium uppercase tracking-wider mt-0.5">Management</span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image
              src="/logo/logo.png"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
        )}

        {/* Desktop: Toggle Button */}
        <button
          onClick={toggleCollapse}
          className={`hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all absolute -right-3 top-5 z-50 ${isCollapsed ? 'rotate-180' : ''}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Mobile: Close Button */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation - Scrollable Area */}
      <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-none hover:scrollbar-thin scrollbar-thumb-gray-200">
        {/* Menu Section */}
        <div className="mb-6">
          {!isCollapsed && (
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Menu
            </h3>
          )}
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isOpen = openMenus.includes(item.href);
              const hasSubItems = item.subItems && item.subItems.length > 0;

              return (
                <li key={item.href}>
                  {hasSubItems ? (
                    <NavLinkWithDropdown
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                      hasSubItems={hasSubItems}
                      isOpen={isOpen}
                      onToggle={() => toggleMenu(item.href)}
                      isCollapsed={isCollapsed}
                      subItems={item.subItems as any}
                    />
                  ) : (
                    <NavLink
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={pathname === item.href}
                      onClick={handleLinkClick}
                      isCollapsed={isCollapsed}
                    />
                  )}

                  {/* Submenu for Expanded State */}
                  {!isCollapsed && hasSubItems && (
                    <ul className={`mt-1 space-y-0.5 overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                      {item.subItems.map((subItem) => (
                        <li key={subItem.href}>
                          <SubNavLink
                            href={subItem.href}
                            label={subItem.label}
                            icon={subItem.icon}
                            isActive={pathname === subItem.href}
                            onClick={handleLinkClick}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Others Section */}
        <div className="mb-6">
          {!isCollapsed && (
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Others
            </h3>
          )}
          <ul className="space-y-1">
            {otherItems.map((item) => {
              const isOpen = openMenus.includes(item.href);
              const hasSubItems = item.subItems && item.subItems.length > 0;

              return (
                <li key={item.href}>
                  {hasSubItems ? (
                    <NavLinkWithDropdown
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                      hasSubItems={hasSubItems}
                      isOpen={isOpen}
                      onToggle={() => toggleMenu(item.href)}
                      isCollapsed={isCollapsed}
                      subItems={item.subItems as any}
                    />
                  ) : (
                    <NavLink
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={pathname === item.href}
                      onClick={handleLinkClick}
                      isCollapsed={isCollapsed}
                    />
                  )}

                  {/* Submenu */}
                  {!isCollapsed && hasSubItems && (
                    <ul className={`mt-1 space-y-0.5 overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                      {item.subItems.map((subItem) => (
                        <li key={subItem.href}>
                          <SubNavLink
                            href={subItem.href}
                            label={subItem.label}
                            icon={subItem.icon}
                            isActive={pathname === subItem.href}
                            onClick={handleLinkClick}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* User Info (Optional Footer) */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              {userName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
