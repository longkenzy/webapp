import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Topbar from "@/components/shared/layout/Topbar";
import Providers from "@/components/shared/layout/Providers";
import { Toaster } from "react-hot-toast";
import GlobalErrorHandler from "@/components/shared/common/GlobalErrorHandler";
import { ensureTimezone } from "@/lib/date-utils";

// Ensure timezone is set correctly on server startup
ensureTimezone();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IT Services Management",
  description: "Hệ thống quản lý dịch vụ IT toàn diện",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <GlobalErrorHandler />
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
