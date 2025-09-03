"use client";
import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";

export default function RoleGuard({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const { data } = useSession();
  if (!data?.user?.role) return null;
  if (!allow.includes(data.user.role)) return null;
  return <>{children}</>;
}
