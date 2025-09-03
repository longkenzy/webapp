import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Topbar from "@/components/shared/layout/Topbar";
import Providers from "@/components/shared/layout/Providers";
import OptimizedSessionHandler from "@/components/shared/common/OptimizedSessionHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IT Work Manager",
  description: "Internal IT ticketing and work management",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <OptimizedSessionHandler />
          {children}
        </Providers>
      </body>
    </html>
  );
}
