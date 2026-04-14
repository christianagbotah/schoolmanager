"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
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

// Role-based redirect paths (matches middleware)
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

  // Theme state (fetched from settings)
  const [themePrimary, setThemePrimary] = useState("#667eea");
  const [themeSecondary, setThemeSecondary] = useState("#764ba2");
  const [systemName, setSystemName] = useState("School Manager");

  // Auth flow state
  const [step, setStep] = useState<AuthStep>("auth-key");
  const [authKey, setAuthKey] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [verifiedType, setVerifiedType] = useState<string>("");

  // Credentials form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Loading overlay state
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  // Fail counter for auth key attempts
  const [failCounter, setFailCounter] = useState(1);

  // Fetch settings (theme colors, system name)
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const settings = await res.json();
          const sysName =
            settings.find(
              (s: { type: string; description: string }) =>
                s.type === "system_name"
            )?.description || "School Manager";
          const primary =
            settings.find(
              (s: { type: string; description: string }) =>
                s.type === "theme_primary"
            )?.description || "#667eea";
          const secondary =
            settings.find(
              (s: { type: string; description: string }) =>
                s.type === "theme_secondary"
            )?.description || "#764ba2";

          setSystemName(sysName);
          setThemePrimary(primary);
          setThemeSecondary(secondary);
        }
      } catch {
        // Use defaults
      }
    }
    fetchSettings();
  }, []);

  // Auto-verify when auth key reaches 5 characters
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

      // Simulate the CI3 loading delay for UX
      await new Promise((r) => setTimeout(r, 2000));

      if (data.blocked) {
        setVerifyStatus("blocked");
      } else if (data.valid) {
        setVerifyStatus("success");
        setVerifiedType(data.type);
        setAuthKey(key);

        // Transition to login form after showing success
        setTimeout(() => {
          setStep("credentials");
          setVerifyStatus("idle");
        }, 1500);
      } else {
        setVerifyStatus("error");

        if (failCounter >= 3) {
          setVerifyStatus("blocked");
          setLoginError(
            "Too many failed attempts. Your account has been blocked. Please contact your administrator."
          );
        } else if (failCounter === 2) {
          setLoginError(
            "2 failed attempts. Your account will be blocked after the 3rd failure."
          );
        }

        setFailCounter((prev) => prev + 1);

        // Auto-clear error after 5 seconds
        setTimeout(() => {
          setVerifyStatus("idle");
          setLoginError("");
        }, 5000);
      }
    } catch {
      setVerifyStatus("error");
      setLoginError("Network error. Please check your connection and try again.");
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
        return;
      }

      // Redirect to callback URL or role-specific dashboard
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        const dashboardPath = ROLE_DASHBOARDS[verifiedType] || "/login";
        router.push(dashboardPath);
      }
      router.refresh();
    } catch {
      setLoginError("An unexpected error occurred. Please try again.");
      setShowLoadingOverlay(false);
    }
  };

  const handleBackToAuthKey = () => {
    setStep("auth-key");
    setAuthKey("");
    setVerifyStatus("idle");
    setVerifiedType("");
    setEmail("");
    setPassword("");
    setLoginError("");
    setFailCounter(1);
  };

  // Education icons for the left panel (matching CI3 FA icons)
  const educationIcons = [
    { icon: GraduationCap, className: "top-[12%] left-[8%] text-[80px]" },
    { icon: BookOpen, className: "top-[55%] right-[12%] text-[60px]" },
    { icon: Presentation, className: "bottom-[15%] left-[18%] text-[50px]" },
    { icon: BookUser, className: "top-[30%] right-[8%] text-[70px]" },
    { icon: Pencil, className: "bottom-[30%] right-[22%] text-[45px]" },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8"
      style={{
        background: `linear-gradient(135deg, ${themePrimary} 0%, ${themeSecondary} 100%)`,
      }}
    >
      {/* Login Container */}
      <div className="login-container flex flex-col md:flex-row w-full max-w-[1000px] bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden max-h-[95vh]">
        {/* =================== LEFT PANEL =================== */}
        <div
          className="login-left flex-shrink-0 md:flex-1 relative overflow-hidden flex flex-col items-center justify-center text-white px-5 py-8 md:px-10 md:py-[60px]"
          style={{
            background: `linear-gradient(135deg, ${themePrimary} 0%, ${themeSecondary} 100%)`,
          }}
        >
          {/* Floating decorative circles */}
          <div className="absolute w-[300px] h-[300px] bg-white/10 rounded-full -top-[100px] -right-[100px] pointer-events-none" />
          <div className="absolute w-[200px] h-[200px] bg-white/10 rounded-full -bottom-[50px] -left-[50px] pointer-events-none" />

          {/* Education icons at 0.15 opacity */}
          <div className="school-icons absolute inset-0 opacity-[0.15] z-0 pointer-events-none">
            {educationIcons.map((item, idx) => (
              <item.icon
                key={idx}
                className={`absolute text-white ${item.className}`}
              />
            ))}
          </div>

          {/* Logo */}
          <div className="logo-container relative z-10 bg-white rounded-full p-5 mb-6 md:mb-8 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
            <GraduationCap className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] text-gray-700" />
          </div>

          {/* School Name & Welcome */}
          <div className="welcome-text relative z-10 text-center">
            <h1 className="text-2xl md:text-[32px] font-bold mb-3 md:mb-4 leading-tight">
              {systemName}
            </h1>
            <p className="text-sm md:text-base opacity-90 leading-relaxed max-w-[300px]">
              Secure access to your school management system. Please authenticate
              to continue.
            </p>
          </div>
        </div>

        {/* =================== RIGHT PANEL =================== */}
        <div className="login-right flex-1 p-6 md:p-10 lg:p-[60px_50px] flex flex-col justify-center overflow-y-auto">
          {/* Header */}
          <div className="login-header mb-6 md:mb-8">
            <h2 className="text-2xl md:text-[28px] font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-500">
              {step === "auth-key"
                ? "Enter your authentication key to continue"
                : "Enter your credentials to access your account"}
            </p>
          </div>

          {/* Error Messages */}
          {loginError && (
            <div className="alert-box alert-danger flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-700">
              <CircleAlert className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{loginError}</span>
              <button
                type="button"
                onClick={() => setLoginError("")}
                className="text-red-400 hover:text-red-600 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          )}

          {/* ======== STEP 1: AUTH KEY FORM ======== */}
          {step === "auth-key" && (
            <div>
              {/* Verification status messages */}
              {verifyStatus === "loading" && (
                <div className="auth-status flex items-center justify-center gap-2 p-3 bg-gray-100 text-gray-600 rounded-xl mb-5 text-sm font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </div>
              )}
              {verifyStatus === "success" && (
                <div className="auth-status auth-status-success flex items-center justify-center gap-2 p-3 bg-emerald-500 text-white rounded-xl mb-5 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Authentication successful!
                </div>
              )}
              {verifyStatus === "error" && (
                <div className="auth-status auth-status-error flex items-center justify-center gap-2 p-3 bg-red-500 text-white rounded-xl mb-5 text-sm font-medium relative">
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
                <div className="auth-status flex items-center justify-center gap-2 p-3 bg-red-500 text-white rounded-xl mb-5 text-sm font-medium">
                  <Ban className="w-4 h-4" />
                  Your account has been blocked. Please contact your
                  administrator.
                </div>
              )}

              <form onSubmit={handleAuthKeySubmit}>
                <div className="form-group mb-5">
                  <label className="form-label block text-sm font-semibold text-gray-700 mb-2">
                    Authentication Key
                  </label>
                  <div className="input-wrapper relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      maxLength={5}
                      value={authKey}
                      onChange={(e) => handleAuthKeyChange(e.target.value)}
                      placeholder="XXXXX"
                      disabled={verifyStatus === "loading"}
                      className="form-input auth-key-input w-full py-[14px] pl-[45px] pr-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-[20px] font-bold text-center tracking-[4px] transition-all duration-300 focus:outline-none focus:border-[var(--theme-primary,#667eea)] focus:bg-white"
                      style={
                        {
                          "--theme-primary": themePrimary,
                        } as React.CSSProperties
                      }
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
                  className="btn-login w-full py-[14px] text-white rounded-xl text-base font-semibold transition-all duration-300 mt-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(135deg, ${themePrimary} 0%, ${themeSecondary} 100%)`,
                  }}
                >
                  Continue
                </button>
              </form>
            </div>
          )}

          {/* ======== STEP 2: LOGIN CREDENTIALS FORM ======== */}
          {step === "credentials" && (
            <div>
              {/* Show verified type badge */}
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-5 text-sm text-emerald-700">
                <CheckCircle className="w-4 h-4" />
                <span>
                  Verified as{" "}
                  <span className="font-semibold capitalize">
                    {verifiedType}
                  </span>
                </span>
              </div>

              <form onSubmit={handleLoginSubmit}>
                {/* Email / Username */}
                <div className="form-group mb-5">
                  <label className="form-label block text-sm font-semibold text-gray-700 mb-2">
                    {verifiedType === "student"
                      ? "Username"
                      : "Email / Username"}
                  </label>
                  <div className="input-wrapper relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type={verifiedType === "student" ? "text" : "text"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        verifiedType === "student"
                          ? "Enter your username"
                          : "Enter your email or username"
                      }
                      disabled={isLoginLoading}
                      className="form-input w-full py-[14px] pl-[45px] pr-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-[15px] transition-all duration-300 focus:outline-none focus:border-[var(--theme-primary,#667eea)] focus:bg-white"
                      style={
                        {
                          "--theme-primary": themePrimary,
                        } as React.CSSProperties
                      }
                      autoComplete="off"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-group mb-5">
                  <label className="form-label block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="input-wrapper relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={isLoginLoading}
                      className="form-input w-full py-[14px] pl-[45px] pr-12 border-2 border-gray-200 rounded-xl bg-gray-50 text-[15px] transition-all duration-300 focus:outline-none focus:border-[var(--theme-primary,#667eea)] focus:bg-white"
                      style={
                        {
                          "--theme-primary": themePrimary,
                        } as React.CSSProperties
                      }
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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

                {/* Hidden auth_key field */}
                <input type="hidden" value={authKey} readOnly />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoginLoading}
                  className="btn-login w-full py-[14px] text-white rounded-xl text-base font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${themePrimary} 0%, ${themeSecondary} 100%)`,
                  }}
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

              {/* Back button */}
              <button
                type="button"
                onClick={handleBackToAuthKey}
                className="mt-4 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          )}

          {/* Forgot Password */}
          <div className="forgot-password text-center mt-5">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: themePrimary }}
            >
              <CircleAlert className="w-3.5 h-3.5" />
              Forgot Your Password?
            </a>
          </div>

          {/* Footer */}
          <div className="footer text-center mt-6 md:mt-8 text-[10px] text-gray-400 leading-relaxed">
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

      {/* =================== LOADING OVERLAY =================== */}
      {showLoadingOverlay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 md:p-10 flex flex-col items-center shadow-2xl">
            <div
              className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin"
              style={{ borderTopColor: themePrimary }}
            />
            <p className="mt-4 text-base font-semibold text-gray-900">
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
          <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
