import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export type UserRole =
  | "admin"
  | "teacher"
  | "student"
  | "parent"
  | "accountant"
  | "librarian";

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
  name: string;
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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide email and password");
        }

        const { email, password } = credentials;
        const identifier = email.trim().toLowerCase();

        // Determine which user table to query
        // Students can login with email OR username
        let user: {
          id: number | string;
          email: string;
          name: string;
          password: string;
          active_status: number;
        } | null = null;
        let role: UserRole = "admin";
        let updateFn: (id: number | string, data: Record<string, unknown>) => Promise<unknown>;

        // Try admin
        const admin = await db.admin.findUnique({
          where: identifier.includes("@") ? { email: identifier } : { email: identifier },
        });
        if (admin) {
          user = admin;
          role = "admin";
          updateFn = (id, data) => db.admin.update({ where: { admin_id: id as number }, data });
        }

        // Try teacher
        if (!user) {
          const teacher = await db.teacher.findUnique({
            where: identifier.includes("@") ? { email: identifier } : { email: identifier },
          });
          if (teacher) {
            user = teacher;
            role = "teacher";
            updateFn = (id, data) => db.teacher.update({ where: { teacher_id: id as number }, data });
          }
        }

        // Try student (email OR username)
        if (!user) {
          const student = await db.student.findFirst({
            where: identifier.includes("@")
              ? { email: identifier }
              : { username: identifier },
          });
          if (student) {
            user = student;
            role = "student";
            updateFn = (id, data) => db.student.update({ where: { student_id: id as number }, data });
          }
        }

        // Try parent
        if (!user) {
          const parent = await db.parent.findUnique({
            where: identifier.includes("@") ? { email: identifier } : { email: identifier },
          });
          if (parent) {
            user = parent;
            role = "parent";
            updateFn = (id, data) => db.parent.update({ where: { parent_id: id as number }, data });
          }
        }

        // Try accountant
        if (!user) {
          const accountant = await db.accountant.findUnique({
            where: identifier.includes("@") ? { email: identifier } : { email: identifier },
          });
          if (accountant) {
            user = accountant;
            role = "accountant";
            updateFn = (id, data) => db.accountant.update({ where: { accountant_id: id as number }, data });
          }
        }

        // Try librarian
        if (!user) {
          const librarian = await db.librarian.findUnique({
            where: identifier.includes("@") ? { email: identifier } : { email: identifier },
          });
          if (librarian) {
            user = librarian;
            role = "librarian";
            updateFn = (id, data) => db.librarian.update({ where: { librarian_id: id as number }, data });
          }
        }

        if (!user) {
          throw new Error("Invalid credentials. No account found.");
        }

        // Check if account is inactive
        if (user.active_status !== 1) {
          throw new Error("Your account has been deactivated. Please contact the administrator.");
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid email or password.");
        }

        return {
          id: String(user.id),
          role,
          email: user.email || "",
          name: user.name,
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as AuthUser).role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as UserRole;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
