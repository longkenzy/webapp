import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";

export default async function Home() {
  const session = await getSession();
  
  console.log('🔍 Home page - Session check:', {
    hasSession: !!session,
    user: session?.user ? {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role
    } : null
  });
  
  // Always redirect to login if no session
  if (!session) {
    console.log('🔄 Redirecting to login - no session');
    redirect("/login");
  }

  // If session exists, redirect based on user role
  if (atLeast(session.user.role, Role.IT_STAFF)) {
    console.log('🔄 Redirecting to admin dashboard - user role:', session.user.role);
    redirect("/admin/dashboard");
  } else {
    console.log('🔄 Redirecting to user dashboard - user role:', session.user.role);
    redirect("/user/dashboard");
  }
}
