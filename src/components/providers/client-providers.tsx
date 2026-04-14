"use client";

import { useEffect, useState, ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";

export function ClientProviders({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SessionProvider>
      {children}
      {mounted && <Toaster />}
    </SessionProvider>
  );
}

export default ClientProviders;
