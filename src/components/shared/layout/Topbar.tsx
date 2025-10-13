"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Topbar() {
  const { data } = useSession();
  const router = useRouter();
  return (
    <header className="fixed top-0 left-0 right-0 h-12 border-b bg-white flex items-center justify-between px-4 z-40">
      <Link href="/" className="flex items-center space-x-3">
        <Image
          src="/logo/logo.png"
          alt="IT Services Management Logo"
          width={28}
          height={28}
          className="rounded-lg"
        />
        <span className="font-semibold">IT Services Management</span>
      </Link>
      <div className="flex items-center gap-3 text-sm">
        <span>{data?.user?.email}</span>
        {data?.user ? (
          <button onClick={async () => {
            await signOut({ redirect: false });
            router.push("/login");
          }} className="px-2 py-1 rounded border">Logout</button>
        ) : (
          <Link href="/login" className="px-2 py-1 rounded border">Login</Link>
        )}
      </div>
    </header>
  );
}


