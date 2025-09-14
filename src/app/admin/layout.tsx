import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";
import AdminSidebar from "@/components/shared/layout/AdminSidebar";
import AdminTopbar from "@/components/shared/layout/AdminTopbar";
import { NotificationProvider } from "@/contexts/NotificationContext";
import AdminLayoutClient from "@/components/shared/layout/AdminLayoutClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!atLeast(session.user.role, Role.IT_STAFF)) redirect("/user/dashboard");

  return (
    <NotificationProvider>
      <AdminLayoutClient
        userName={session.user.name || 'Admin'}
        userEmail={session.user.email || ''}
      >
        {children}
      </AdminLayoutClient>
    </NotificationProvider>
  );
}


