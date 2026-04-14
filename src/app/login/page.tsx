"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  BookOpen,
  Users,
  Calculator,
  Library,
  Mail,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginRole, setLoginRole] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      // Redirect to the callback URL or role-specific dashboard
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - School Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-300 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-emerald-300 rounded-full blur-2xl" />
        </div>

        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                School Manager
              </h1>
              <p className="text-emerald-200 text-sm font-medium">
                Excellence in Education
              </p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="space-y-6 max-w-lg">
            <h2 className="text-4xl font-bold leading-tight">
              Welcome to Your{" "}
              <span className="text-emerald-300">
                School Management Portal
              </span>
            </h2>
            <p className="text-emerald-100/80 text-lg leading-relaxed">
              Access your dashboard, manage academic records, track attendance,
              handle finances, and stay connected with your school community.
            </p>
          </div>

          {/* Role Cards */}
          <div className="mt-12 grid grid-cols-2 gap-3">
            {[
              {
                icon: Shield,
                label: "Admin",
                desc: "Full control",
              },
              {
                icon: BookOpen,
                label: "Teacher",
                desc: "Academic tools",
              },
              {
                icon: Users,
                label: "Students & Parents",
                desc: "Track progress",
              },
              {
                icon: Calculator,
                label: "Finance",
                desc: "Billing & fees",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:bg-white/15 transition-colors"
              >
                <item.icon className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-emerald-200/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-emerald-200/60 text-sm">
              &copy; {new Date().getFullYear()} School Manager. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-gradient-to-b from-slate-50 to-white sm:px-12 lg:px-16">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-emerald-700 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">School Manager</h1>
            <p className="text-xs text-slate-500">Excellence in Education</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              Sign in to your account
            </h2>
            <p className="text-slate-500 mt-2">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-600 text-xs font-bold">!</span>
              </div>
              <p>{error}</p>
            </div>
          )}

          {/* Login Form */}
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email/Username Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email or Username
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                    <Input
                      id="email"
                      type="text"
                      placeholder="Enter your email or username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl text-slate-900 placeholder:text-slate-400 transition-colors"
                      disabled={isLoading}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-slate-700"
                    >
                      Password
                    </Label>
                    <button
                      type="button"
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-11 h-12 bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl text-slate-900 placeholder:text-slate-400 transition-colors"
                      disabled={isLoading}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-700/25 hover:shadow-emerald-800/30 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-center text-xs text-slate-400 mb-4">
                  Quick access with demo accounts
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: "Admin", email: "admin@school.com", icon: Shield },
                    {
                      role: "Teacher",
                      email: "teacher@school.com",
                      icon: BookOpen,
                    },
                    {
                      role: "Student",
                      email: "student@school.com",
                      icon: Users,
                    },
                    {
                      role: "Parent",
                      email: "parent@school.com",
                      icon: Users,
                    },
                    {
                      role: "Accountant",
                      email: "accountant@school.com",
                      icon: Calculator,
                    },
                    {
                      role: "Librarian",
                      email: "librarian@school.com",
                      icon: Library,
                    },
                  ].map((account) => (
                    <button
                      key={account.role}
                      type="button"
                      onClick={() => {
                        setEmail(account.email);
                        setPassword("password123");
                        setLoginRole(account.role);
                      }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all duration-200 ${
                        loginRole === account.role
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-600"
                      }`}
                    >
                      <account.icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{account.role}</span>
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-slate-400 mt-3">
                  Password: password123
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Footer */}
        <div className="lg:hidden mt-12 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} School Manager. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
