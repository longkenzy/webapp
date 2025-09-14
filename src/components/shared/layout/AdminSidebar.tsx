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
  Building2
} from "lucide-react";

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
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
}

function NavLink({ href, label, icon: Icon, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}

function NavLinkWithDropdown({ href, label, icon: Icon, isActive, hasSubItems, isOpen, onToggle }: NavLinkWithDropdownProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </div>
      {hasSubItems && (
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      )}
    </button>
  );
}

function SubNavLink({ href, label, icon: Icon, isActive }: SubNavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-6 py-2 text-sm rounded-lg transition-colors ${
        isActive 
          ? 'bg-blue-50 text-blue-700 font-medium' 
          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 font-normal'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
}

export default function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (href: string) => {
    setOpenMenus(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const menuItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { 
      href: "/admin/work", 
      label: "Công việc", 
      icon: Briefcase,
      subItems: [
        { href: "/admin/work/internal", label: "Case nội bộ", icon: FileText },
        { href: "/admin/receiving-cases", label: "Case nhận hàng", icon: Truck },
        { href: "/admin/delivery-cases", label: "Case giao hàng", icon: Truck },
        { href: "/admin/work/incident", label: "Case xử lý sự cố", icon: AlertTriangle },
        { href: "/admin/work/maintenance", label: "Case bảo trì", icon: Wrench },
        { href: "/admin/work/warranty", label: "Case bảo hành", icon: Shield },
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
    <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-sm border-r border-gray-200 z-50 overflow-y-auto">
      {/* Logo */}
      <div className="p-2 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Image
            src="/logo/logo.png"
            alt="IT Services Management Logo"
            width={40}
            height={40}
            style={{ width: "auto", height: "auto" }}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">IT Services</h1>
            <p className="text-sm text-gray-500">Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        {/* Menu Section */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Menu
          </h3>
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
                    />
                  ) : (
                    <NavLink
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={pathname === item.href}
                    />
                  )}
                  
                  {/* Submenu */}
                  {hasSubItems && (
                    <ul className={`mt-1 ml-4 space-y-1 overflow-hidden transition-all duration-200 ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      {item.subItems.map((subItem) => (
                        <li key={subItem.href}>
                          <SubNavLink
                            href={subItem.href}
                            label={subItem.label}
                            icon={subItem.icon}
                            isActive={pathname === subItem.href}
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
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Others
          </h3>
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
                    />
                  ) : (
                    <NavLink
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={pathname === item.href}
                    />
                  )}
                  
                  {/* Submenu */}
                  {hasSubItems && (
                    <ul className={`mt-1 ml-4 space-y-1 overflow-hidden transition-all duration-200 ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      {item.subItems.map((subItem) => (
                        <li key={subItem.href}>
                          <SubNavLink
                            href={subItem.href}
                            label={subItem.label}
                            icon={subItem.icon}
                            isActive={pathname === subItem.href}
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
      </nav>
    </aside>
  );
}
