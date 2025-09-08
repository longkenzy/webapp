import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";
import UserNavbar from "@/components/shared/layout/UserNavbar";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  
  // Redirect admin users to admin dashboard
  if (atLeast(session.user.role, Role.IT_STAFF)) {
    redirect("/admin/dashboard");
  }

  return (
    <>
      <UserNavbar />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </>
  );
}


