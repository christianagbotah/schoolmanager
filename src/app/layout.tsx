import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/client-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "School Manager - School Management System",
  description:
    "Comprehensive school management system for administrators, teachers, students, parents, accountants, and librarians.",
  keywords: [
    "school management",
    "education",
    "attendance",
    "grades",
    "fees",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

// Force all routes to be dynamic - skip static prerendering
// This is required because next-auth v4 + React 19 have prerendering compatibility issues
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
