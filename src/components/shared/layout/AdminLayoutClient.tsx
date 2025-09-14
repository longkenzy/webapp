'use client';

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar 
        userName={userName} 
        userEmail={userEmail} 
      />

      {/* Topbar */}
      <AdminTopbar />

      {/* Main Content */}
      <div className="ml-64 pt-16">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
