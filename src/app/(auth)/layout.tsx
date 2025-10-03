import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IT Services Management - Login",
  description: "Hệ thống quản lý dịch vụ IT toàn diện",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


