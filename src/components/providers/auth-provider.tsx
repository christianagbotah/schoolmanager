"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

// Also export as default for dynamic import compatibility
export default AuthProvider;
