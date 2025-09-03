import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";
import AdminSidebar from "@/components/shared/layout/AdminSidebar";
import AdminTopbar from "@/components/shared/layout/AdminTopbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!atLeast(session.user.role, Role.IT_STAFF)) redirect("/user/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar 
        userName={session.user.name || 'Admin'} 
        userEmail={session.user.email} 
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


