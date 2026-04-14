import "next-auth";
import type { UserRole } from "@/lib/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      roleSlug: string;
      email: string;
      name: string;
      permissions: string[];
    };
  }

  interface User {
    id: string;
    role: UserRole;
    roleSlug: string;
    email: string;
    name: string;
    permissions: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: UserRole;
    roleSlug: string;
    email: string;
    name: string;
    permissions: string[];
  }
}
