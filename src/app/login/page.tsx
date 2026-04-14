"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  Presentation,
  BookUser,
  Pencil,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  LogIn,
  Loader2,
  CheckCircle,
  XCircle,
  Ban,
  CircleAlert,
} from "lucide-react";

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: "/admin",
  "super-admin": "/admin",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
  accountant: "/accountant",
  librarian: "/librarian",
};

type AuthStep = "auth-key" | "credentials";
type VerifyStatus = "idle" | "loading" | "success" | "error" | "blocked";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const formRef = useRef<HTMLDivElement>(null);

  const [themePrimary, setThemePrimary] = useState("#667eea");
  const [themeSecondary, setThemeSecondary] = useState("#764ba2");
  const [systemName, setSystemName] = useState("School Manager");

  const [step, setStep] = useState<AuthStep>("auth-key");
  const [authKey, setAuthKey] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [verifiedType, setVerifiedType] = useState<string>("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [failCounter, setFailCounter] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const settings = await res.json();
          setSystemName(
            settings.find(
              (s: { type: string; description: string }) =>
                s.type === "system_name"
            )?.description || "School Manager"
          );
          setThemePrimary(
            settings.find(
              (s: { type: string; description: string }) =>
                s.type === "theme_primary"
            )?.description || "#667eea"
          );
          setThemeSecondary(
            settings.find(
              (s: { type: string; description: string }) =>
                s.type === "theme_secondary"
            )?.description || "#764ba2"
          );
        }
      } catch {
        // Use defaults
      }
    }
    fetchSettings();
  }, []);

  // Scroll form into view on mobile when step changes
  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  const triggerShake = () => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 600);
  };

  const handleAuthKeyChange = useCallback(
    (value: string) => {
      const trimmed = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5);
      setAuthKey(trimmed);
      setVerifyStatus("idle");
      setLoginError("");

      if (trimmed.length === 5) {
        verifyAuthKey(trimmed);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [failCounter]
  );

  const verifyAuthKey = async (key: string) => {
    setVerifyStatus("loading");

    try {
      const res = await fetch("/api/auth/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();
      await new Promise((r) => setTimeout(r, 2000));

      if (data.blocked) {
        setVerifyStatus("blocked");
        triggerShake();
      } else if (data.valid) {
        setVerifyStatus("success");
        setVerifiedType(data.type);
        setAuthKey(key);

        setTimeout(() => {
          setIsTransitioning(true);
          setTimeout(() => {
            setStep("credentials");
            setVerifyStatus("idle");
            setIsTransitioning(false);
          }, 300);
        }, 1500);
      } else {
        setVerifyStatus("error");
        triggerShake();

        if (failCounter >= 3) {
          setVerifyStatus("blocked");
          setLoginError(
            "Too many failed attempts. Your account has been blocked."
          );
        } else if (failCounter === 2) {
          setLoginError(
            "2 failed attempts. Your account will be blocked after the 3rd failure."
          );
        }

        setFailCounter((prev) => prev + 1);

        setTimeout(() => {
          setVerifyStatus("idle");
          setLoginError("");
        }, 5000);
      }
    } catch {
      setVerifyStatus("error");
      setLoginError("Network error. Please check your connection.");
      triggerShake();
      setTimeout(() => {
        setVerifyStatus("idle");
      }, 3000);
    }
  };

  const handleAuthKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authKey.length === 5 && verifyStatus === "idle") {
      verifyAuthKey(authKey);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setShowLoadingOverlay(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        authKey: authKey,
        redirect: false,
      });

      if (result?.error) {
        setLoginError(result.error);
        setShowLoadingOverlay(false);
        triggerShake();
        return;
      }

      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push(ROLE_DASHBOARDS[verifiedType] || "/login");
      }
      router.refresh();
    } catch {
      setLoginError("An unexpected error occurred.");
      setShowLoadingOverlay(false);
      triggerShake();
    }
  };

  const handleBackToAuthKey = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep("auth-key");
      setAuthKey("");
      setVerifyStatus("idle");
      setVerifiedType("");
      setEmail("");
      setPassword("");
      setLoginError("");
      setFailCounter(1);
      setIsTransitioning(false);
    }, 300);
  };

  const educationIcons = [
    { icon: GraduationCap, className: "top-[12%] left-[8%] text-[80px]" },
    { icon: BookOpen, className: "top-[55%] right-[12%] text-[60px]" },
    { icon: Presentation, className: "bottom-[15%] left-[18%] text-[50px]" },
    { icon: BookUser, className: "top-[30%] right-[8%] text-[70px]" },
    { icon: Pencil, className: "bottom-[30%] right-[22%] text-[45px]" },
  ];

  const inputStyle = {
    "--theme-primary": themePrimary,
  } as React.CSSProperties;

  const gradientBg = `linear-gradient(135deg, ${themePrimary} 0%, ${themeSecondary} 100%)`;
  const gradientBtn = { background: gradientBg };

  return (
    <div
      className="min-h-[100dvh] flex flex-col lg:flex-row lg:items-center lg:justify-center"
      style={{ background: gradientBg }}
    >
      {/* ============ MOBILE: Top Branding ============ */}
      <div className="lg:hidden flex-shrink-0 flex flex-col items-center pt-safe pt-8 pb-4 px-5 text-white">
        <div className="relative z-10 bg-white rounded-full p-3.5 mb-4 shadow-lg">
          <GraduationCap className="w-14 h-14 text-gray-700" />
        </div>
        <h1 className="relative z-10 text-xl font-bold text-center leading-tight">
          {systemName}
        </h1>
        <p className="relative z-10 text-xs text-white/80 mt-1 text-center max-w-[260px]">
          Secure access to your school management system
        </p>
      </div>

      {/* ============ MOBILE: Form Card ============ */}
      <div className="lg:hidden flex-1 bg-white rounded-t-3xl px-5 pt-6 pb-8 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]">
        <div ref={formRef} className="max-w-md mx-auto">
          {/* Step header with back button */}
          <div className="flex items-center gap-3 mb-5">
            {step === "credentials" && (
              <button
                type="button"
                onClick={handleBackToAuthKey}
                className="flex items-center justify-center w-9 h-9 -ml-1 rounded-full bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4.5 h-4.5 text-gray-600" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {step === "auth-key" ? "Welcome Back" : "Sign In"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {step === "auth-key"
                  ? "Enter your authentication key"
                  : "Enter your credentials"}
              </p>
            </div>
          </div>

          {/* Content with transition */}
          <div
            className={`transition-all duration-300 ease-out ${
              isTransitioning
                ? "opacity-0 translate-y-3"
                : "opacity-100 translate-y-0"
            } ${
              shakeError ? "animate-[shake_0.6s_ease-in-out]" : ""
            }`}
          >
            {/* Verified badge */}
            {step === "credentials" && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-xs text-emerald-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Verified as{" "}
                  <span className="font-semibold capitalize">{verifiedType}</span>
                </span>
              </div>
            )}

            {/* Error */}
            {loginError && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-xs text-red-700">
                <CircleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{loginError}</span>
                <button
                  type="button"
                  onClick={() => setLoginError("")}
                  className="text-red-400 hover:text-red-600 text-base leading-none -mt-0.5"
                >
                  ×
                </button>
              </div>
            )}

            {/* Verify status messages */}
            {verifyStatus === "loading" && (
              <div className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-50 rounded-xl mb-4 text-sm font-medium text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </div>
            )}
            {verifyStatus === "success" && (
              <div className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-500 rounded-xl mb-4 text-sm font-medium text-white">
                <CheckCircle className="w-4 h-4" />
                Authentication successful!
              </div>
            )}
            {verifyStatus === "error" && (
              <div className="relative flex items-center justify-center gap-2 py-2.5 px-3 bg-red-500 rounded-xl mb-4 text-sm font-medium text-white">
                <XCircle className="w-4 h-4" />
                Authentication failed
                <button
                  type="button"
                  onClick={() => setVerifyStatus("idle")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100 text-base"
                >
                  ×
                </button>
              </div>
            )}
            {verifyStatus === "blocked" && (
              <div className="flex items-center justify-center gap-2 py-2.5 px-3 bg-red-500 rounded-xl mb-4 text-sm font-medium text-white">
                <Ban className="w-4 h-4" />
                Account blocked. Contact your administrator.
              </div>
            )}

            {/* ===== AUTH KEY STEP ===== */}
            {step === "auth-key" && (
              <form onSubmit={handleAuthKeySubmit}>
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Authentication Key
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      maxLength={5}
                      value={authKey}
                      onChange={(e) => handleAuthKeyChange(e.target.value)}
                      placeholder="XXXXX"
                      disabled={verifyStatus === "loading"}
                      className="w-full h-12 pl-11 pr-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-lg font-bold text-center tracking-[6px] transition-all duration-200 focus:outline-none focus:border-[var(--theme-primary,#667eea)] focus:bg-white focus:ring-4 focus:ring-[var(--theme-primary,#667eea)]/10"
                      style={inputStyle}
                      autoComplete="off"
                      autoFocus
                      inputMode="text"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={
                    authKey.length !== 5 ||
                    verifyStatus === "loading" ||
                    verifyStatus === "success"
                  }
                  className="w-full h-12 text-white rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10"
                  style={gradientBtn}
                >
                  {verifyStatus === "loading" ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    "Continue"
                  )}
                </button>
              </form>
            )}

            {/* ===== CREDENTIALS STEP ===== */}
            {step === "credentials" && (
              <form onSubmit={handleLoginSubmit}>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    {verifiedType === "student" ? "Username" : "Email / Username"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        verifiedType === "student"
                          ? "Enter your username"
                          : "Enter your email or username"
                      }
                      disabled={isLoginLoading}
                      className="w-full h-12 pl-11 pr-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-[15px] transition-all duration-200 focus:outline-none focus:border-[var(--theme-primary,#667eea)] focus:bg-white focus:ring-4 focus:ring-[var(--theme-primary,#667eea)]/10"
                      style={inputStyle}
                      autoComplete="off"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={isLoginLoading}
                      className="w-full h-12 pl-11 pr-12 border-2 border-gray-200 rounded-xl bg-gray-50 text-[15px] transition-all duration-200 focus:outline-none focus:border-[var(--theme-primary,#667eea)] focus:bg-white focus:ring-4 focus:ring-[var(--theme-primary,#667eea)]/10"
                      style={inputStyle}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-lg transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <input type="hidden" value={authKey} readOnly />

                <button
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full h-12 text-white rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                  style={gradientBtn}
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Forgot password */}
            <div className="text-center mt-5">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-1.5 text-xs font-medium"
                style={{ color: themePrimary }}
              >
                <CircleAlert className="w-3.5 h-3.5" />
                Forgot Your Password?
              </a>
            </div>

            {/* Footer */}
            <div className="text-center mt-6 text-[10px] text-gray-400 leading-relaxed">
              &copy; {new Date().getFullYear()} {systemName}. All rights
              reserved.
              <br />
              Powered by{" "}
              <span style={{ color: themePrimary }} className="font-medium">
                Lightworldtech
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ DESKTOP: Two-Panel Layout ============ */}
      <div className="hidden lg:flex w-full max-w-[1000px] mx-auto bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden m-4 max-h-[95vh]">
        {/* Left branding panel */}
        <div
          className="flex-1 relative overflow-hidden flex flex-col items-center justify-center text-white px-10 py-16"
          style={{ background: gradientBg }}
        >
          <div className="absolute w-[300px] h-[300px] bg-white/10 rounded-full -top-[100px] -right-[100px] pointer-events-none" />
          <div className="absolute w-[200px] h-[200px] bg-white/10 rounded-full -bottom-[50px] -left-[50px] pointer-events-none" />

          <div className="absolute inset-0 opacity-[0.15] pointer-events-none">
            {educationIcons.map((item, idx) => (
              <item.icon
                key={idx}
                className={`absolute text-white ${item.className}`}
              />
            ))}
          </div>

          <div className="relative z-10 bg-white rounded-full p-5 mb-8 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
            <GraduationCap className="w-[100px] h-[100px] text-gray-700" />
          </div>

          <div className="relative z-10 text-center">
            <h1 className="text-[32px] font-bold mb-4 leading-tight">
              {systemName}
            </h1>
            <p className="text-base opacity-90 leading-relaxed max-w-[300px]">
              Secure access to your school management system. Please
              authenticate to continue.
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 p-[60px_50px] flex flex-col justify-center overflow-y-auto">
          <div
            className={`transition-all duration-300 ease-out ${
              isTransitioning
                ? "opacity-0 translate-y-3"
                : "opacity-100 translate-y-0"
            } ${shakeError ? "animate-[shake_0.6s_ease-in-out]" : ""}`}
          >
            {/* Header */}
            <div className="mb-8">
              {step === "credentials" && (
                <button
                  type="button"
                  onClick={handleBackToAuthKey}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to authentication key
                </button>
              )}
              <h2 className="text-[28px] font-bold text-gray-900 mb-2">
                {step === "auth-key" ? "Welcome Back" : "Sign In"}
              </h2>
              <p className="text-sm text-gray-500">
                {step === "auth-key"
                  ? "Enter your authentication key to continue"
                  : "Enter your credentials to access your account"}
              </p>
            </div>

            {/* Verified badge */}
            {step === "credentials" && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-5 text-sm text-emerald-700">
                <CheckCircle className="w-4 h-4" />
                <span>
                  Verified as{" "}
                  <span className="font-semibold capitalize">
                    {verifiedType}
                  </span>
                </span>
              </div>
            )}

            {/* Error */}
            {loginError && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-700">
                <CircleAlert className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{loginError}</span>
                <button
                  type="button"
                  onClick={() => setLoginError("")}
                  className="text-red-400 hover:text-red-600 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            )}

            {/* Verify status messages */}
            {verifyStatus === "loading" && (
              <div className="flex items-center justify-center gap-2 p-3 bg-gray-100 rounded-xl mb-5 text-sm font-medium text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </div>
            )}
            {verifyStatus === "success" && (
              <div className="flex items-center justify-center gap-2 p-3 bg-emerald-500 text-white rounded-xl mb-5 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Authentication successful!
              </div>
            )}
            {verifyStatus === "error" && (
              <div className="relative flex items-center justify-center gap-2 p-3 bg-red-500 text-white rounded-xl mb-5 text-sm font-medium">
                <XCircle className="w-4 h-4" />
                Authentication failed
                <button
                  type="button"
                  onClick={() => setVerifyStatus("idle")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100 text-lg"
                >
                  ×
                </button>
              </div>
            )}
            {verifyStatus === "blocked" && (
              <div className="flex items-center justify-center gap-2 p-3 bg-red-500 text-white rounded-xl mb-5 text-sm font-medium">
                <Ban className="w-4 h-4" />
                Account blocked. Contact your administrator.
              </div>
            )}

            {/* ===== AUTH KEY STEP ===== */}
            {step === "auth-key" && (
              <form onSubmit={handleAuthKeySubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Authentication Key
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      maxLength={5}
                      value={authKey}
                      onChange={(e) => handleAuthKeyChange(e.target.value)}
                      placeholder="XXXXX"
                      disabled={verifyStatus === "loading"}
                      className="w-full py-3.5 pl-12 pr-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-xl font-bold text-center tracking-[4px] transition-all duration-300 focus:outline-none focus:border-[var(--theme-primary,#667eea)] focus:bg-white focus:ring-4 focus:ring-[var(--theme-primary,#667eea)]/10"
                      style={inputStyle}
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={
                    authKey.length !== 5 ||
                    verifyStatus === "loading" ||
                    verifyStatus === "success"
                  }
                  className="w-full py-3.5 text-white rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={gradientBtn}
                >
                  Continue
                </button>
              </form>
            )}

            {/* ===== CREDENTIALS STEP ===== */}
            {step === "credentials" && (
              <form onSubmit={handleLoginSubmit}>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {verifiedType === "student"
                      ? "Username"
                      : "Email / Username"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        verifiedType === "student"
                          ? "Enter your username"
                          : "Enter your email or username"
                      }
                      disabled={isLoginLoading}
                      className="w-full py-3.5 pl-12 pr-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-[15px] transition-all duration-300 focus:outline-none focus:border-[var(--theme-primary,#667eea)] focus:bg-white focus:ring-4 focus:ring-[var(--theme-primary,#667eea)]/10"
                      style={inputStyle}
                      autoComplete="off"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={isLoginLoading}
                      className="w-full py-3.5 pl-12 pr-12 border-2 border-gray-200 rounded-xl bg-gray-50 text-[15px] transition-all duration-300 focus:outline-none focus:border-[var(--theme-primary,#667eea)] focus:bg-white focus:ring-4 focus:ring-[var(--theme-primary,#667eea)]/10"
                      style={inputStyle}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-lg transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <input type="hidden" value={authKey} readOnly />

                <button
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full py-3.5 text-white rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                  style={gradientBtn}
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Forgot password */}
            <div className="text-center mt-6">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: themePrimary }}
              >
                <CircleAlert className="w-3.5 h-3.5" />
                Forgot Your Password?
              </a>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-[10px] text-gray-400 leading-relaxed">
              &copy; {new Date().getFullYear()} {systemName}. All rights
              reserved.
              <br />
              Powered by{" "}
              <span style={{ color: themePrimary }} className="font-medium">
                Lightworldtech
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ LOADING OVERLAY (Blurred) ============ */}
      {showLoadingOverlay && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 md:p-10 flex flex-col items-center shadow-2xl mx-4">
            <div
              className="w-12 h-12 border-[3px] border-gray-200 rounded-full animate-spin"
              style={{ borderTopColor: themePrimary }}
            />
            <p className="mt-5 text-base font-semibold text-gray-900">
              Authenticating...
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Please wait while we verify your credentials
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
          <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
