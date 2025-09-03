"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Role } from "@prisma/client";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: Role;
  redirectTo?: string;
}

export default function AuthGuard({ children, requiredRole, redirectTo }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const userRole = (session.user as any).role;
      
      // Check if user is trying to access admin routes
      if (pathname.startsWith("/admin")) {
        if (userRole !== "ADMIN" && userRole !== "IT_LEAD" && userRole !== "IT_STAFF") {
          router.push("/user/dashboard");
          return;
        }
      }
      
      // Check if user is trying to access user routes
      if (pathname.startsWith("/user")) {
        if (userRole === "ADMIN" || userRole === "IT_LEAD" || userRole === "IT_STAFF") {
          router.push("/admin/dashboard");
          return;
        }
      }

      // Check specific role requirements
      if (requiredRole) {
        const roleHierarchy = {
          [Role.USER]: 0,
          [Role.IT_STAFF]: 1,
          [Role.IT_LEAD]: 2,
          [Role.ADMIN]: 3,
        };

        const userRoleLevel = roleHierarchy[userRole as Role] || 0;
        const requiredRoleLevel = roleHierarchy[requiredRole];

        if (userRoleLevel < requiredRoleLevel) {
          router.push(redirectTo || "/user/dashboard");
          return;
        }
      }
    }
  }, [session, status, router, pathname, requiredRole, redirectTo]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
