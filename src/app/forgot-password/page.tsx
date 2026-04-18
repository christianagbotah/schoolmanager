"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Mail, ArrowLeft, CheckCircle, Loader2, CircleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type PageState = "idle" | "loading" | "success" | "error";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setState("loading");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setState("success");
      } else {
        setState("error");
        setErrorMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setState("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: gradientBg }}>
      <div className="w-full max-w-[460px]">
        {/* ═══ SUCCESS STATE ═══ */}
        {state === "success" ? (
          <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.15)] border-0">
            <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: themePrimary + "18" }}
              >
                <CheckCircle className="w-8 h-8" style={{ color: themePrimary }} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h2>
              <p className="text-sm text-gray-500 mb-2 leading-relaxed max-w-[320px]">
                If an account exists with <span className="font-semibold text-gray-700">{email}</span>, we&apos;ve sent a password reset link to your email.
              </p>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed max-w-[320px]">
                (In this demo, the reset token is logged to the server console. Check the dev logs for the reset URL.)
              </p>
              <Button
                variant="outline"
                className="w-full max-w-[220px] cursor-pointer"
                onClick={() => router.push("/login")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* ═══ FORM STATE ═══ */
          <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.15)] border-0">
            <CardHeader className="text-center pb-2 px-8 pt-10">
              {/* Logo */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg"
                style={{ backgroundColor: themePrimary + "15" }}
              >
                <GraduationCap className="w-8 h-8" style={{ color: themePrimary }} />
              </div>

              <CardTitle className="text-[26px] text-gray-900 leading-tight">
                Forgot Password?
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-2 leading-relaxed">
                Enter your email address and we&apos;ll send you a link to reset your password.
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

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (state === "error") {
                          setState("idle");
                          setErrorMessage("");
                        }
                      }}
                      disabled={state === "loading"}
                      className="pl-10 h-11 text-[15px] border-gray-200 focus-visible:ring-offset-0"
                      required
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!email.trim() || state === "loading"}
                  className="w-full h-11 text-[15px] font-semibold text-white cursor-pointer hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
                  style={{ background: gradientBg }}
                >
                  {state === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="justify-center pb-8 px-8 pt-0">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </CardFooter>
          </Card>
        )}

        {/* ═══ FOOTER ═══ */}
        <div className="text-center mt-6 text-[11px] text-white/60 leading-relaxed">
          &copy; {new Date().getFullYear()} {systemName}. All rights reserved.
        </div>
      </div>
    </div>
  );
}
