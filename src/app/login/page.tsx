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
  Shield,
  UserCog,
  BookOpenCheck,
  Users,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: "/dashboard",
  "super-admin": "/dashboard",
  teacher: "/dashboard",
  student: "/dashboard",
  parent: "/dashboard",
  accountant: "/dashboard",
  librarian: "/dashboard",
};

type AuthStep = "email" | "auth-key" | "credentials";
type VerifyStatus = "idle" | "loading" | "success" | "error" | "blocked";

// Role tabs configuration
const ROLE_TABS = [
  { id: "admin", label: "Admin", icon: UserCog },
  { id: "teacher", label: "Teacher", icon: BookOpen },
  { id: "student", label: "Student", icon: GraduationCap },
  { id: "parent", label: "Parent", icon: Users },
  { id: "accountant", label: "Accountant", icon: Calculator },
  { id: "librarian", label: "Librarian", icon: BookOpenCheck },
] as const;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const formRef = useRef<HTMLDivElement>(null);

  const [themePrimary, setThemePrimary] = useState("#667eea");
  const [themeSecondary, setThemeSecondary] = useState("#764ba2");
  const [systemName, setSystemName] = useState("School Manager");

  // 3-step flow: email -> auth key -> credentials
  const [step, setStep] = useState<AuthStep>("auth-key");
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [email, setEmail] = useState("");
  const [authKey, setAuthKey] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [verifiedType, setVerifiedType] = useState<string>("");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [failCounter, setFailCounter] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

  const failCounterRef = useRef(1);

  const verifyAuthKey = useCallback(async (key: string) => {
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
        setShakeError(true);
        setTimeout(() => setShakeError(false), 600);
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
        setShakeError(true);
        setTimeout(() => setShakeError(false), 600);

        const fc = failCounterRef.current;
        if (fc >= 3) {
          setVerifyStatus("blocked");
          setLoginError(
            "Too many failed attempts. Your account has been blocked."
          );
        } else if (fc === 2) {
          setLoginError(
            "2 failed attempts. Your account will be blocked after the 3rd failure."
          );
        }

        failCounterRef.current = fc + 1;
        setFailCounter(fc + 1);

        setTimeout(() => {
          setVerifyStatus("idle");
          setLoginError("");
        }, 5000);
      }
    } catch {
      setVerifyStatus("error");
      setLoginError("Network error. Please check your connection.");
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
      setTimeout(() => {
        setVerifyStatus("idle");
      }, 3000);
    }
  }, []);

  const handleEmailSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (email.trim()) {
        setIsTransitioning(true);
        setTimeout(() => {
          setStep("auth-key");
          setVerifyStatus("idle");
          setLoginError("");
          setIsTransitioning(false);
        }, 300);
      }
    },
    [email]
  );

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
    [verifyAuthKey]
  );

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

  const handleBack = () => {
    if (step === "credentials") {
      setIsTransitioning(true);
      setTimeout(() => {
        setStep("auth-key");
        setVerifyStatus("idle");
        setLoginError("");
        setPassword("");
        setIsTransitioning(false);
      }, 300);
    } else if (step === "auth-key") {
      setIsTransitioning(true);
      setTimeout(() => {
        setStep("email");
        setVerifyStatus("idle");
        setLoginError("");
        setAuthKey("");
        setFailCounter(1);
        failCounterRef.current = 1;
        setIsTransitioning(false);
      }, 300);
    }
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

  // Step indicator dots
  const stepIndex = step === "email" ? 0 : step === "auth-key" ? 1 : 2;

  // ─── Status Messages (shared across breakpoints) ───
  const StatusMessages = () => (
    <>
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
    </>
  );

  // ─── Step Indicators ───
  const StepIndicators = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex items-center justify-center gap-2 mb-5">
      {["Email", "Auth Key", "Password"].map((label, idx) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full transition-all duration-300",
              idx < stepIndex && "bg-emerald-100 text-emerald-700",
              idx === stepIndex && "text-white",
              idx > stepIndex && "bg-gray-100 text-gray-400"
            )}
            style={
              idx === stepIndex
                ? { background: gradientBg }
                : undefined
            }
          >
            <span
              className={cn(
                "flex items-center justify-center rounded-full font-semibold",
                compact ? "w-5 h-5 text-[10px]" : "w-6 h-6 text-[11px]"
              )}
            >
              {idx < stepIndex ? (
                <CheckCircle className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
              ) : (
                idx + 1
              )}
            </span>
            {!compact && (
              <span className="text-[10px] font-medium pr-2">{label}</span>
            )}
          </div>
          {idx < 2 && (
            <div
              className={cn(
                "w-4 h-0.5 rounded-full transition-colors",
                idx < stepIndex ? "bg-emerald-400" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  // ─── Mobile View ───
  const renderMobileView = () => (
    <>
      {/* Top Branding */}
      <div className="flex-shrink-0 flex flex-col items-center pt-safe pt-8 pb-4 px-5 text-white">
        <div className="relative z-10 bg-white rounded-full p-3.5 mb-3 shadow-lg">
          <GraduationCap className="w-12 h-12 text-gray-700" />
        </div>
        <h1 className="relative z-10 text-lg font-bold text-center leading-tight">
          {systemName}
        </h1>
        <p className="relative z-10 text-[11px] text-white/80 mt-1 text-center max-w-[260px]">
          Secure access to your school management system
        </p>
      </div>

      {/* Form Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-5 pt-5 pb-8 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]">
        <div ref={formRef} className="max-w-md mx-auto">
          {/* Step indicators */}
          <StepIndicators compact />

          {/* Role selector tabs */}
          <div className="flex gap-1 overflow-x-auto pb-3 mb-4 -mx-1 px-1 scrollbar-none">
            {ROLE_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedRole(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 min-h-[36px]",
                    "active:scale-95",
                    selectedRole === tab.id
                      ? "text-white shadow-md"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}
                  style={
                    selectedRole === tab.id
                      ? { background: gradientBg }
                      : undefined
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Step header with back button */}
          <div className="flex items-center gap-3 mb-4">
            {step !== "email" && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center justify-center w-9 h-9 -ml-1 rounded-full bg-gray-100 active:bg-gray-200 transition-all active:scale-90"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {step === "email"
                  ? "Welcome"
                  : step === "auth-key"
                  ? "Authentication"
                  : "Sign In"}
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {step === "email"
                  ? "Enter your email to receive an auth key"
                  : step === "auth-key"
                  ? "Enter the 5-digit key sent to your email"
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
            } ${shakeError ? "animate-[shake_0.6s_ease-in-out]" : ""}`}
          >
            {/* Verified badge */}
            {step === "credentials" && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-xs text-emerald-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
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

            <StatusMessages />

            {/* ===== EMAIL STEP ===== */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit}>
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full h-12 pl-11 pr-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-[15px] transition-all duration-200 focus:outline-none focus:border-[var(--theme-primary,#667eea)] focus:bg-white focus:ring-4 focus:ring-[var(--theme-primary,#667eea)]/10"
                      style={inputStyle}
                      autoComplete="email"
                      required
                      autoFocus
                      inputMode="email"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!email.trim()}
                  className="w-full h-12 text-white rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10"
                  style={gradientBtn}
                >
                  Send Auth Key
                </button>
              </form>
            )}

            {/* ===== AUTH KEY STEP ===== */}
            {step === "auth-key" && (
              <form onSubmit={handleAuthKeySubmit}>
                <div className="mb-4">
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
                    {verifiedType === "student"
                      ? "Username"
                      : "Email / Username"}
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

                <div className="mb-4">
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

                {/* Remember me */}
                <div className="flex items-center justify-between mb-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                        rememberMe
                          ? "border-transparent"
                          : "border-gray-300 bg-gray-50"
                      )}
                      style={
                        rememberMe
                          ? { background: gradientBg }
                          : undefined
                      }
                    >
                      {rememberMe && (
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600">Remember me</span>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                  </label>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-xs font-medium"
                    style={{ color: themePrimary }}
                  >
                    Forgot Password?
                  </a>
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

            {/* Skip to auth key link */}
            {step === "email" && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setStep("auth-key");
                    setVerifyStatus("idle");
                    setLoginError("");
                    setIsTransitioning(false);
                  }, 300);
                }}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors"
                  style={{ color: themePrimary }}
                >
                  Already have an auth key? Enter it directly →
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-6 text-[10px] text-gray-400 leading-relaxed">
              &copy; {new Date().getFullYear()} {systemName}. All rights
              reserved.
              <br />
              Powered by{" "}
              <span
                style={{ color: themePrimary }}
                className="font-medium"
              >
                Lightworldtech
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // ─── Tablet View ───
  const renderTableView = () => (
    <div className="hidden md:flex lg:hidden w-full max-w-[900px] mx-auto bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden m-4 max-h-[95vh]">
      {/* Left branding panel (40%) */}
      <div
        className="w-[40%] relative overflow-hidden flex flex-col items-center justify-center text-white px-8 py-12"
        style={{ background: gradientBg }}
      >
        <div className="absolute w-[200px] h-[200px] bg-white/10 rounded-full -top-[80px] -right-[80px] pointer-events-none" />
        <div className="absolute w-[150px] h-[150px] bg-white/10 rounded-full -bottom-[40px] -left-[40px] pointer-events-none" />

        <div className="relative z-10 bg-white rounded-full p-4 mb-6 shadow-lg">
          <GraduationCap className="w-16 h-16 text-gray-700" />
        </div>

        <div className="relative z-10 text-center">
          <h1 className="text-2xl font-bold mb-3 leading-tight">
            {systemName}
          </h1>
          <p className="text-sm opacity-90 leading-relaxed max-w-[250px]">
            Secure access to your school management system
          </p>
        </div>

        {/* Role selector at bottom of branding panel */}
        <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-2 max-w-[220px]">
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedRole(tab.id)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all duration-200",
                  "active:scale-95",
                  selectedRole === tab.id
                    ? "bg-white/25 text-white shadow"
                    : "bg-white/10 text-white/70 hover:bg-white/15"
                )}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right form panel (60%) */}
      <div className="w-[60%] p-8 flex flex-col justify-center overflow-y-auto login-right">
        <div
          className={`transition-all duration-300 ease-out ${
            isTransitioning
              ? "opacity-0 translate-y-3"
              : "opacity-100 translate-y-0"
          } ${shakeError ? "animate-[shake_0.6s_ease-in-out]" : ""}`}
        >
          <StepIndicators compact />

          {/* Back button */}
          {step !== "email" && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {step === "email"
                ? "Welcome Back"
                : step === "auth-key"
                ? "Enter Auth Key"
                : "Sign In"}
            </h2>
            <p className="text-sm text-gray-500">
              {step === "email"
                ? "Enter your email to receive a 5-digit authentication key"
                : step === "auth-key"
                ? "Enter the 5-digit key sent to your email"
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
              <CircleAlert className="w-4 h-4 flex-shrink-0" />
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

          <StatusMessages />

          {/* ===== EMAIL STEP ===== */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full h-12 pl-11 pr-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-[15px] transition-all duration-300 focus:outline-none focus:border-[var(--theme-primary,#667eea)] focus:bg-white focus:ring-4 focus:ring-[var(--theme-primary,#667eea)]/10"
                    style={inputStyle}
                    autoComplete="email"
                    required
                    autoFocus
                    inputMode="email"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!email.trim()}
                className="w-full h-12 text-white rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={gradientBtn}
              >
                Send Auth Key
              </button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setStep("auth-key");
                    setVerifyStatus("idle");
                    setLoginError("");
                    setIsTransitioning(false);
                  }, 300);
                }}
                  className="text-xs font-medium hover:underline"
                  style={{ color: themePrimary }}
                >
                  Already have an auth key? Enter it directly →
                </button>
              </div>
            </form>
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

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between mb-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                      rememberMe
                        ? "border-transparent"
                        : "border-gray-300 bg-gray-50"
                    )}
                    style={
                      rememberMe ? { background: gradientBg } : undefined
                    }
                  >
                    {rememberMe && (
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-gray-600">Remember me</span>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm font-medium hover:underline"
                  style={{ color: themePrimary }}
                >
                  Forgot Password?
                </a>
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

          {/* Footer */}
          <div className="text-center mt-6 text-[10px] text-gray-400 leading-relaxed">
            &copy; {new Date().getFullYear()} {systemName}. All rights
            reserved. | Powered by{" "}
            <span
              style={{ color: themePrimary }}
              className="font-medium"
            >
              Lightworldtech
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Desktop View (50/50 split) ───
  const renderDesktopView = () => (
    <div className="hidden lg:flex w-full max-w-[1000px] mx-auto bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden m-4 max-h-[95vh]">
      {/* Left branding panel (50%) */}
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

        {/* Role selector */}
        <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-2 max-w-[300px]">
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedRole(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200",
                  "active:scale-95",
                  selectedRole === tab.id
                    ? "bg-white/25 text-white shadow"
                    : "bg-white/10 text-white/70 hover:bg-white/15"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right form panel (50%) */}
      <div className="flex-1 p-[60px_50px] flex flex-col justify-center overflow-y-auto login-right">
        <div
          className={`transition-all duration-300 ease-out ${
            isTransitioning
              ? "opacity-0 translate-y-3"
              : "opacity-100 translate-y-0"
          } ${shakeError ? "animate-[shake_0.6s_ease-in-out]" : ""}`}
        >
          <StepIndicators />

          <div className="mb-8">
            {step !== "email" && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                {step === "auth-key"
                  ? "Back to email"
                  : "Back to authentication key"}
              </button>
            )}
            <h2 className="text-[28px] font-bold text-gray-900 mb-2">
              {step === "email"
                ? "Welcome Back"
                : step === "auth-key"
                ? "Authentication"
                : "Sign In"}
            </h2>
            <p className="text-sm text-gray-500">
              {step === "email"
                ? "Enter your email to receive a 5-digit authentication key"
                : step === "auth-key"
                ? "Enter the 5-digit key sent to your email"
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

          <StatusMessages />

          {/* ===== EMAIL STEP ===== */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full py-3.5 pl-12 pr-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-[15px] transition-all duration-300 focus:outline-none focus:border-[var(--theme-primary,#667eea)] focus:bg-white focus:ring-4 focus:ring-[var(--theme-primary,#667eea)]/10"
                    style={inputStyle}
                    autoComplete="email"
                    required
                    autoFocus
                    inputMode="email"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!email.trim()}
                className="w-full py-3.5 text-white rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={gradientBtn}
              >
                Send Auth Key
              </button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setStep("auth-key");
                    setVerifyStatus("idle");
                    setLoginError("");
                    setIsTransitioning(false);
                  }, 300);
                }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: themePrimary }}
                >
                  Already have an auth key? Enter it directly →
                </button>
              </div>
            </form>
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

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between mb-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                      rememberMe
                        ? "border-transparent"
                        : "border-gray-300 bg-gray-50"
                    )}
                    style={
                      rememberMe ? { background: gradientBg } : undefined
                    }
                  >
                    {rememberMe && (
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-gray-600">Remember me</span>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm font-medium hover:underline"
                  style={{ color: themePrimary }}
                >
                  Forgot Password?
                </a>
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

          {/* Footer */}
          <div className="text-center mt-8 text-[10px] text-gray-400 leading-relaxed">
            &copy; {new Date().getFullYear()} {systemName}. All rights
            reserved.
            <br />
            Powered by{" "}
            <span
              style={{ color: themePrimary }}
              className="font-medium"
            >
              Lightworldtech
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-[100dvh] flex flex-col lg:flex-row lg:items-center lg:justify-center"
      style={{ background: gradientBg }}
    >
      {/* Mobile */}
      <div className="md:hidden">
        {renderMobileView()}
      </div>

      {/* Tablet (40/60 split) */}
      {renderTableView()}

      {/* Desktop (50/50 split) */}
      {renderDesktopView()}

      {/* Loading Overlay */}
      {showLoadingOverlay && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 md:p-10 flex flex-col items-center shadow-2xl mx-4 animate-fade-in">
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
