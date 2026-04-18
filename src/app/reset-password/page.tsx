"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  Loader2,
  CircleAlert,
  KeyRound,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type PageState = "idle" | "loading" | "success" | "error";

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  bgColor: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

function getPasswordStrength(password: string): StrengthResult {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (score === 0) return { score: 0, label: "", color: "", bgColor: "", checks };
  if (score <= 1) return { score: 1, label: "Weak", color: "text-red-500", bgColor: "bg-red-500", checks };
  if (score <= 2) return { score: 2, label: "Fair", color: "text-orange-500", bgColor: "bg-orange-500", checks };
  if (score <= 3) return { score: 3, label: "Good", color: "text-amber-500", bgColor: "bg-amber-500", checks };
  return { score: 4, label: "Strong", color: "text-emerald-500", bgColor: "bg-emerald-500", checks };
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, setState] = useState<PageState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Theme settings
  const [themePrimary, setThemePrimary] = useState("#667eea");
  const [themeSecondary, setThemeSecondary] = useState("#764ba2");
  const [systemName, setSystemName] = useState("School Manager");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const settings = await res.json();
          setSystemName(
            settings.find((s: { type: string; description: string }) => s.type === "system_name")?.description || "School Manager"
          );
          setThemePrimary(
            settings.find((s: { type: string; description: string }) => s.type === "theme_primary")?.description || "#667eea"
          );
          setThemeSecondary(
            settings.find((s: { type: string; description: string }) => s.type === "theme_secondary")?.description || "#764ba2"
          );
        }
      } catch {
        // Use defaults
      }
    }
    fetchSettings();
  }, []);

  const gradientBg = `linear-gradient(135deg, ${themePrimary} 0%, ${themeSecondary} 100%)`;
  const strength = getPasswordStrength(newPassword);

  const clearError = useCallback(() => {
    if (state === "error") {
      setState("idle");
      setErrorMessage("");
    }
  }, [state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Client-side validation
    if (!newPassword) {
      setState("error");
      setErrorMessage("Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setState("error");
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setState("error");
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!token) {
      setState("error");
      setErrorMessage("No reset token provided. Please request a new password reset link.");
      return;
    }

    setState("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setState("success");
      } else {
        setState("error");
        setErrorMessage(data.message || "Failed to reset password. Please try again.");
      }
    } catch {
      setState("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  };

  // ═══ SUCCESS STATE ═══
  if (state === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-5" style={{ background: gradientBg }}>
        <div className="w-full max-w-[460px]">
          <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.15)] border-0">
            <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: "#10b98118" }}
              >
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Password Reset Successful</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-[320px]">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
              <Button
                className="w-full max-w-[220px] text-white cursor-pointer hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
                style={{ background: gradientBg }}
                onClick={() => router.push("/login")}
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
          <div className="text-center mt-6 text-[11px] text-white/60 leading-relaxed">
            &copy; {new Date().getFullYear()} {systemName}. All rights reserved.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: gradientBg }}>
      <div className="w-full max-w-[460px]">
        <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.15)] border-0">
          <CardHeader className="text-center pb-2 px-8 pt-10">
            {/* Logo */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg"
              style={{ backgroundColor: themePrimary + "15" }}
            >
              <KeyRound className="w-8 h-8" style={{ color: themePrimary }} />
            </div>

            <CardTitle className="text-[26px] text-gray-900 leading-tight">
              Reset Password
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-2 leading-relaxed">
              Enter your new password below. Make sure it&apos;s at least 8 characters long.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-4">
            {/* Error Alert */}
            {state === "error" && errorMessage && (
              <div className="flex items-start gap-2.5 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-700">
                <CircleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => {
                    setState("idle");
                    setErrorMessage("");
                  }}
                  className="text-red-400 hover:text-red-600 text-lg leading-none"
                >
                  &times;
                </button>
              </div>
            )}

            {/* No Token Warning */}
            {!token && (
              <div className="flex items-start gap-2.5 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-sm text-amber-700">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="flex-1">
                  No reset token detected. Please go to the forgot password page to request a reset link.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div className="space-y-2.5">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      clearError();
                    }}
                    disabled={state === "loading"}
                    className="pl-10 pr-10 h-11 text-[15px] border-gray-200 focus-visible:ring-offset-0"
                    required
                    autoFocus
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Password strength</span>
                    <span className={`text-xs font-semibold ${strength.color}`}>
                      {strength.label}
                    </span>
                  </div>
                  <Progress
                    value={strength.score * 25}
                    className="h-1.5"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className={`w-1.5 h-1.5 rounded-full ${strength.checks.length ? "bg-emerald-500" : "bg-gray-300"}`} />
                      <span className={strength.checks.length ? "text-gray-700" : "text-gray-400"}>
                        8+ characters
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className={`w-1.5 h-1.5 rounded-full ${strength.checks.uppercase ? "bg-emerald-500" : "bg-gray-300"}`} />
                      <span className={strength.checks.uppercase ? "text-gray-700" : "text-gray-400"}>
                        Uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className={`w-1.5 h-1.5 rounded-full ${strength.checks.number ? "bg-emerald-500" : "bg-gray-300"}`} />
                      <span className={strength.checks.number ? "text-gray-700" : "text-gray-400"}>
                        Number
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className={`w-1.5 h-1.5 rounded-full ${strength.checks.special ? "bg-emerald-500" : "bg-gray-300"}`} />
                      <span className={strength.checks.special ? "text-gray-700" : "text-gray-400"}>
                        Special character
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div className="space-y-2.5">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearError();
                    }}
                    disabled={state === "loading"}
                    className="pl-10 pr-10 h-11 text-[15px] border-gray-200 focus-visible:ring-offset-0"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Mismatch indicator */}
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <CircleAlert className="w-3 h-3" />
                    Passwords do not match
                  </p>
                )}
                {confirmPassword.length > 0 && newPassword === confirmPassword && newPassword.length >= 8 && (
                  <p className="text-xs text-emerald-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={
                  state === "loading" ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword.length < 8 ||
                  newPassword !== confirmPassword ||
                  !token
                }
                className="w-full h-11 text-[15px] font-semibold text-white cursor-pointer hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
                style={{ background: gradientBg }}
              >
                {state === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center pb-8 px-8 pt-0 flex-col gap-3">
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Request New Link
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
              style={{ color: themePrimary }}
            >
              Back to Login
            </Link>
          </CardFooter>
        </Card>

        {/* ═══ FOOTER ═══ */}
        <div className="text-center mt-6 text-[11px] text-white/60 leading-relaxed">
          &copy; {new Date().getFullYear()} {systemName}. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
