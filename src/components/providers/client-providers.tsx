"use client";

import { useEffect, useState, useSyncExternalStore, ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function ClientProviders({ children }: { children: ReactNode }) {
  const mounted = useIsMounted();

  return (
    <SessionProvider>
      {children}
      {mounted && <Toaster />}
    </SessionProvider>
  );
}

export default ClientProviders;
