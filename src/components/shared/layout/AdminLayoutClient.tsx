'use client';

import { useState } from 'react';
import AdminSidebar from "@/components/shared/layout/AdminSidebar";
import AdminTopbar from "@/components/shared/layout/AdminTopbar";
import { useCaseCreation } from "@/hooks/useCaseCreation";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}

export default function AdminLayoutClient({ children, userName, userEmail }: AdminLayoutClientProps) {
  // Initialize case creation listener
  useCaseCreation();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop: always visible, Mobile: overlay */}
      <AdminSidebar 
        userName={userName} 
        userEmail={userEmail}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Topbar */}
      <AdminTopbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content - Responsive margin */}
      <div className="md:ml-64 pt-16">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
