import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // trailingSlash must be false to prevent redirect loops through the proxy.
  // With true, Next.js redirects /login → /login/ (308), and the proxy/browser
  // may strip the trailing slash back, creating an infinite redirect loop.
  trailingSlash: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Trust all forwarded Host headers in production.
  // Without this, Next.js rejects requests from unrecognized proxy domains
  // and may redirect, creating an infinite redirect loop through the gateway.
  // This also covers allowedDevOrigins functionality for dev mode.
  experimental: {
    trustHost: true,
  },
  allowedDevOrigins: [
    "https://preview-chat-f748a7ef-cfd3-4cea-bfdc-f4ce00609005.space.z.ai",
    "http://preview-chat-f748a7ef-cfd3-4cea-bfdc-f4ce00609005.space.z.ai",
  ],
  serverExternalPackages: ["bcryptjs"],
  // Aggressive no-cache headers to prevent browser from caching old redirect responses
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // ─── Shared pages migrated to permission-based routes ─────────────
      // Notices
      { source: "/teacher/notices", destination: "/notices", permanent: false },
      { source: "/admin/notices", destination: "/notices", permanent: false },
      { source: "/student/notices", destination: "/notices", permanent: false },
      { source: "/parent/notices", destination: "/notices", permanent: false },

      // Messages
      { source: "/teacher/messages", destination: "/messages", permanent: false },
      { source: "/admin/messages", destination: "/messages", permanent: false },
      { source: "/student/messages", destination: "/messages", permanent: false },
      { source: "/parent/messages", destination: "/messages", permanent: false },

      // Profile
      { source: "/teacher/profile", destination: "/profile", permanent: false },
      { source: "/student/profile", destination: "/profile", permanent: false },

      // Attendance
      { source: "/teacher/attendance", destination: "/attendance", permanent: false },
      { source: "/admin/attendance", destination: "/attendance", permanent: false },
      { source: "/student/attendance", destination: "/attendance", permanent: false },
      { source: "/parent/attendance", destination: "/attendance", permanent: false },

      // Routine/Timetable
      { source: "/teacher/routine", destination: "/routine", permanent: false },
      { source: "/admin/routine", destination: "/routine", permanent: false },
      { source: "/student/routine", destination: "/routine", permanent: false },
      { source: "/parent/routine", destination: "/routine", permanent: false },

      // Transport
      { source: "/teacher/transport", destination: "/transport", permanent: false },
      { source: "/admin/transport", destination: "/transport", permanent: false },
      { source: "/student/transport", destination: "/transport", permanent: false },
      { source: "/parent/transport", destination: "/transport", permanent: false },

      // Library
      { source: "/teacher/library", destination: "/library", permanent: false },
      { source: "/admin/library", destination: "/library", permanent: false },
      { source: "/student/library", destination: "/library", permanent: false },
      { source: "/parent/library", destination: "/library", permanent: false },

      // Invoices
      { source: "/student/invoices", destination: "/invoices", permanent: false },
      { source: "/accountant/invoices", destination: "/invoices", permanent: false },

      // Payments
      { source: "/parent/payments", destination: "/payments", permanent: false },
      { source: "/accountant/payments", destination: "/payments", permanent: false },

      // Results
      { source: "/student/results", destination: "/results", permanent: false },
      { source: "/parent/results", destination: "/results", permanent: false },

      // Online Exams
      { source: "/teacher/online-exams", destination: "/online-exams", permanent: false },
      { source: "/student/online-exams", destination: "/online-exams", permanent: false },
      { source: "/admin/exams/online", destination: "/online-exams", permanent: false },
    ];
  },
};

export default nextConfig;
