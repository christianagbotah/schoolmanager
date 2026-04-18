import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getLegacyUserPermissionNames } from "@/lib/permissions";

export type UserRole =
  | "admin"
  | "teacher"
  | "student"
  | "parent"
  | "accountant"
  | "librarian"
  | "super-admin"
  | "cashier"
  | "conductor"
  | "receptionist";

export interface AuthUser {
  id: string;
  role: UserRole;
  roleSlug: string;
  email: string;
  name: string;
  permissions: string[];
}

const MAX_LOGIN_ATTEMPTS = 3;
const BLOCK_DURATION_MINUTES = 30;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
        authKey: { label: "Authentication Key", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide email and password");
        }

        const { email, password, authKey } = credentials as {
          email: string;
          password: string;
          authKey?: string;
        };
        const identifier = email.trim().toLowerCase();

        // Determine which user table to query
        // Students can login with email OR username
        let userId: number | string | null = null;
        let userEmail = "";
        let userName = "";
        let userPassword = "";
        let userActiveStatus = 0;
        let userAuthKey = "";
        let role: UserRole = "admin";

        // Try admin
        const admin = await db.admin.findUnique({
          where: identifier.includes("@") ? { email: identifier } : { email: identifier },
        });
        if (admin) {
          userId = admin.admin_id;
          userEmail = admin.email;
          userName = admin.name;
          userPassword = admin.password;
          userActiveStatus = admin.active_status;
          userAuthKey = admin.authentication_key;
          // Admin level 1 = super-admin, level 2+ = admin
          const adminLevel = parseInt(admin.level || "2", 10);
          role = adminLevel === 1 ? "super-admin" : "admin";
        }

        // Try teacher
        if (!userId) {
          const teacher = await db.teacher.findUnique({
            where: identifier.includes("@") ? { email: identifier } : { email: identifier },
          });
          if (teacher) {
            userId = teacher.teacher_id;
            userEmail = teacher.email;
            userName = teacher.name;
            userPassword = teacher.password;
            userActiveStatus = teacher.active_status;
            userAuthKey = teacher.authentication_key;
            role = "teacher";
          }
        }

        // Try student (email OR username)
        if (!userId) {
          const student = await db.student.findFirst({
            where: identifier.includes("@")
              ? { email: identifier }
              : { username: identifier },
          });
          if (student) {
            userId = student.student_id;
            userEmail = student.email;
            userName = student.name;
            userPassword = student.password;
            userActiveStatus = student.active_status;
            userAuthKey = student.authentication_key;
            role = "student";
          }
        }

        // Try parent
        if (!userId) {
          const parent = await db.parent.findUnique({
            where: identifier.includes("@") ? { email: identifier } : { email: identifier },
          });
          if (parent) {
            userId = parent.parent_id;
            userEmail = parent.email;
            userName = parent.name;
            userPassword = parent.password;
            userActiveStatus = parent.active_status;
            userAuthKey = parent.authentication_key;
            role = "parent";
          }
        }

        // Try accountant
        if (!userId) {
          const accountant = await db.accountant.findUnique({
            where: identifier.includes("@") ? { email: identifier } : { email: identifier },
          });
          if (accountant) {
            userId = accountant.accountant_id;
            userEmail = accountant.email;
            userName = accountant.name;
            userPassword = accountant.password;
            userActiveStatus = accountant.active_status;
            userAuthKey = accountant.authentication_key;
            role = "accountant";
          }
        }

        // Try librarian
        if (!userId) {
          const librarian = await db.librarian.findUnique({
            where: identifier.includes("@") ? { email: identifier } : { email: identifier },
          });
          if (librarian) {
            userId = librarian.librarian_id;
            userEmail = librarian.email;
            userName = librarian.name;
            userPassword = librarian.password;
            userActiveStatus = librarian.active_status;
            userAuthKey = librarian.authentication_key;
            role = "librarian";
          }
        }

        if (!userId) {
          throw new Error("Invalid credentials. No account found.");
        }

        // Check if account is inactive
        if (userActiveStatus !== 1) {
          throw new Error("Your account has been deactivated. Please contact the administrator.");
        }

        // If auth key is provided, verify it matches the user
        if (authKey && authKey.trim().length > 0) {
          if (userAuthKey !== authKey.trim()) {
            throw new Error("Authentication key does not match. Please verify your key.");
          }
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, userPassword);

        if (!isPasswordValid) {
          throw new Error("Invalid email or password.");
        }

        // Determine admin level for permission lookup
        let adminLevel: number | undefined;
        if (role === "super-admin") {
          adminLevel = 1;
        } else if (role === "admin") {
          adminLevel = 2;
        }

        // Fetch user permissions from RBAC system
        const permissionNames = await getLegacyUserPermissionNames(role === "super-admin" ? "admin" : role, adminLevel);

        // Determine the role slug for RBAC mapping
        const roleSlug = role === "super-admin" ? "super-admin" : role;

        return {
          id: String(userId),
          role,
          roleSlug,
          email: userEmail || "",
          name: userName,
          permissions: permissionNames,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
  },
  // Trust proxy headers so NextAuth uses the forwarded host/protocol
  // This is critical when accessed through a reverse proxy (e.g. space.z.ai → localhost:3000)
 useSecureCookies: false,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as AuthUser).role;
        token.roleSlug = (user as AuthUser).roleSlug;
        token.email = user.email;
        token.name = user.name;
        token.permissions = (user as AuthUser).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as UserRole;
        session.user.roleSlug = (token.roleSlug as string) || (token.role as string);
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.permissions = (token.permissions as string[]) || [];
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Trust the X-Forwarded-Host and X-Forwarded-Proto headers from Caddy
  trustHost: true,
};
