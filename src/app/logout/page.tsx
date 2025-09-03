"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Clear session via API
        await fetch("/api/auth/logout", { method: "POST" });
        
        // Sign out from NextAuth
        await signOut({ redirect: false });
        
        // Redirect to login
        router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
        router.push("/login");
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Đang đăng xuất...</h1>
        <p>Vui lòng chờ trong giây lát.</p>
      </div>
    </div>
  );
}
