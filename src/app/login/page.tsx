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
  LogIn,
  Loader2,
  CheckCircle,
  XCircle,
  Ban,
  CircleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AuthStep = "auth-key" | "credentials" | "blocked";
type VerifyStatus = "idle" | "loading" | "success" | "error" | "blocked";

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: "/dashboard",
  "super-admin": "/dashboard",
  teacher: "/dashboard",
  student: "/dashboard",
  parent: "/dashboard",
  accountant: "/dashboard",
  librarian: "/dashboard",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  // Theme settings fetched from API
  const [themePrimary, setThemePrimary] = useState("#667eea");
  const [themeSecondary, setThemeSecondary] = useState("#764ba2");
  const [systemName, setSystemName] = useState("School Manager");
  const [adminEmail, setAdminEmail] = useState("");

  // 2-step flow matching original CI3: auth key → credentials
  const [step, setStep] = useState<AuthStep>("auth-key");
  const [authKey, setAuthKey] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [verifiedType, setVerifiedType] = useState<string>("");
  const [isStudent, setIsStudent] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  // Failure tracking for self-blocking (matches original: 3 fails → block form)
  const failCounterRef = useRef(1);
  const [failCount, setFailCount] = useState(1);

  // Self-blocking form
  const [blockEmail, setBlockEmail] = useState("");
  const [blockSubmitted, setBlockSubmitted] = useState(false);
  const [blockResult, setBlockResult] = useState<"success" | "not_found" | null>(null);

  // Animations
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  // Fetch school settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetchWithRetry("/api/settings");
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
  const gradientBtn = { background: gradientBg };

  const triggerShake = () => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 600);
  };

  // ─── fetchWithRetry helper: 3 retries with 2s delay ───
  const fetchWithRetry = useCallback(async (url: string, options?: RequestInit): Promise<Response> => {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, options);
        return res;
      } catch (err) {
        lastError = err as Error;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }
    throw lastError;
  }, []);

  // ─── Step 1: Verify Auth Key (matches original auth_verification AJAX) ───
  const verifyAuthKey = useCallback(async (key: string) => {
    setVerifyStatus("loading");
    try {
      const res = await fetchWithRetry("/api/auth/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();

      // Simulate the original's 2-second loading spinner
      await new Promise((r) => setTimeout(r, 2000));

      if (data.blocked) {
        // Account is blocked
        setVerifyStatus("blocked");
        triggerShake();
      } else if (data.valid) {
        // Auth key found in a user table
        setVerifyStatus("success");
        setVerifiedType(data.type);
        setIsStudent(data.type === "student");

        // Match original: show "Authentication successful!" for 3.5s, then transition
        setTimeout(() => {
          setIsTransitioning(true);
          setTimeout(() => {
            setStep("credentials");
            setVerifyStatus("idle");
            setIsTransitioning(false);
          }, 300);
        }, 1500);
      } else {
        // Auth key not found
        setVerifyStatus("error");
        triggerShake();

        const fc = failCounterRef.current;
        if (fc >= 3) {
          // After 3 failures: show self-blocking form (matches original behavior)
          setTimeout(() => {
            setStep("blocked");
            setVerifyStatus("idle");
            setLoginError("");
          }, 2000);
        } else if (fc === 2) {
          setLoginError("2 failed attempts. Your account will be blocked after 3rd failure.");
        }

        failCounterRef.current = fc + 1;
        setFailCount(fc + 1);

        setTimeout(() => {
          setVerifyStatus("idle");
          setLoginError("");
        }, 5000);
      }
    } catch {
      setVerifyStatus("error");
      setLoginError("Network error. Please check your connection.");
      triggerShake();
      setTimeout(() => setVerifyStatus("idle"), 3000);
    }
  }, []);

  const handleAuthKeyChange = useCallback(
    (value: string) => {
      const trimmed = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5);
      setAuthKey(trimmed);
      setVerifyStatus("idle");
      setLoginError("");

      // Auto-verify on 5th character (matches original onkeyup behavior)
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

  // ─── Step 2: Login with credentials (matches original validate_login) ───
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

      // Refresh the session first, then navigate to dashboard
      // This ensures NextAuth has the session ready before DashboardLayout checks it
      await router.refresh();
      const dest = callbackUrl || (ROLE_DASHBOARDS[verifiedType] || "/dashboard");
      router.push(dest);
    } catch {
      setLoginError("An unexpected error occurred.");
      setShowLoadingOverlay(false);
      triggerShake();
    }
  };

  // ─── Back button: return to auth key step ───
  const handleBack = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep("auth-key");
      setVerifyStatus("idle");
      setLoginError("");
      setPassword("");
      setEmail("");
      setIsTransitioning(false);
    }, 300);
  };

  // ─── Self-blocking: user blocks their own account after 3 fails (matches original block_account) ───
  const handleBlockAccount = async () => {
    if (!blockEmail.trim()) return;
    try {
      const res = await fetchWithRetry("/api/auth/block-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: blockEmail.trim() }),
      });
      const data = await res.json();
      setBlockSubmitted(true);
      setBlockResult(data.found ? "success" : "not_found");
    } catch {
      setBlockSubmitted(true);
      setBlockResult("not_found");
    }
  };

  // ─── Decorative icons for left panel (matches original school-icons) ───
  const educationIcons = [
    { icon: GraduationCap, className: "top-[15%] left-[10%] text-[80px]" },
    { icon: BookOpen, className: "top-[60%] right-[15%] text-[60px]" },
    { icon: Presentation, className: "bottom-[20%] left-[20%] text-[50px]" },
    { icon: BookUser, className: "top-[35%] right-[10%] text-[70px]" },
    { icon: Pencil, className: "bottom-[35%] right-[25%] text-[45px]" },
  ];

  // ─── Status Messages (matches original auth-status div) ───
  const StatusMessages = () => (
    <>
      {verifyStatus === "loading" && (
        <div className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-100 rounded-xl mb-4 text-sm font-medium text-gray-600">
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
            &times;
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

  // ─── Main render ───
  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: gradientBg }}>
      <div className="flex max-w-[1000px] w-full bg-white rounded-[20px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-h-[95vh]">
        {/* ═══ LEFT PANEL: Branding (matches original login-left) ═══ */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col items-center justify-center text-white px-10 py-[60px]" style={{ background: gradientBg }}>
          {/* Decorative circles */}
          <div className="absolute w-[300px] h-[300px] bg-white/10 rounded-full -top-[100px] -right-[100px] pointer-events-none" />
          <div className="absolute w-[200px] h-[200px] bg-white/10 rounded-full -bottom-[50px] -left-[50px] pointer-events-none" />

          {/* School icons (matches original school-icons div) */}
          <div className="absolute w-full h-full top-0 left-0 opacity-15">
            {educationIcons.map(({ icon: Icon, className }, i) => (
              <Icon key={i} className={`absolute text-white ${className}`} />
            ))}
          </div>

          {/* Logo */}
          <div className="relative z-10 bg-white rounded-full p-5 mb-8 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
            <GraduationCap className="w-[100px] h-[100px] text-gray-700" />
          </div>

          {/* School name */}
          <div className="relative z-10 text-center">
            <h1 className="text-[32px] font-bold mb-4 leading-tight">{systemName}</h1>
            <p className="text-[16px] opacity-90 leading-relaxed max-w-[320px]">
              Secure access to your school management system. Please authenticate to continue.
            </p>
          </div>
        </div>

        {/* ═══ RIGHT PANEL: Login Form (matches original login-right) ═══ */}
        <div className="flex-1 p-[60px] 50px overflow-y-auto lg:p-[60px_50px] md:p-10 sm:p-6">
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-[28px] font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-sm text-gray-500">
              {step === "auth-key"
                ? "Enter your authentication key to proceed"
                : step === "credentials"
                ? "Enter your credentials to access your account"
                : "Account Security"}
            </p>
          </div>

          {/* ═══ AUTH KEY STEP ═══ */}
          {step === "auth-key" && (
            <div className={`transition-all duration-300 ease-out ${isTransitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"} ${shakeError ? "animate-[shake_0.6s_ease-in-out]" : ""}`}>
              {/* Error alert */}
              {loginError && (
                <div className="flex items-start gap-2.5 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-700">
                  <CircleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="flex-1">{loginError}</span>
                  <button type="button" onClick={() => setLoginError("")} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                </div>
              )}

              <StatusMessages />

              <form onSubmit={handleAuthKeySubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Authentication Key
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      maxLength={5}
                      value={authKey}
                      onChange={(e) => handleAuthKeyChange(e.target.value)}
                      placeholder="XXXXX"
                      disabled={verifyStatus === "loading" || verifyStatus === "success"}
                      className="w-full py-4 px-4 pl-12 border-2 border-gray-200 rounded-xl bg-gray-50 text-xl font-bold text-center tracking-[4px] transition-all duration-300 focus:outline-none focus:border-[color:var(--tw-ring-color)] focus:bg-white focus:ring-4"
                      style={{ '--tw-ring-color': themePrimary + '1A' } as React.CSSProperties}
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authKey.length !== 5 || verifyStatus === "loading" || verifyStatus === "success"}
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

              <div className="text-center mt-5">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push("/forgot-password");
                  }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: themePrimary }}
                >
                  Forgot Your Password?
                </a>
              </div>
            </div>
          )}

          {/* ═══ CREDENTIALS STEP ═══ */}
          {step === "credentials" && (
            <div className={`transition-all duration-300 ease-out ${isTransitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"} ${shakeError ? "animate-[shake_0.6s_ease-in-out]" : ""}`}>
              {/* Back button */}
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-5 active:scale-95"
              >
                <span className="text-lg">&larr;</span> Back
              </button>

              {/* Verified badge */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-5 text-sm text-emerald-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Verified as{" "}
                  <span className="font-semibold capitalize">{verifiedType}</span>
                </span>
              </div>

              {/* Error */}
              {loginError && (
                <div className="flex items-start gap-2.5 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-700">
                  <CircleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="flex-1">{loginError}</span>
                  <button type="button" onClick={() => setLoginError("")} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                {/* Email / Username field */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {isStudent ? "Username" : "Email / Username"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isStudent ? "Enter your username" : "Enter your email or username"}
                      disabled={isLoginLoading}
                      className="w-full py-3.5 px-4 pl-11 border-2 border-gray-200 rounded-xl bg-gray-50 text-[15px] transition-all duration-300 focus:outline-none focus:bg-white focus:ring-4"
                      style={{ '--tw-ring-color': themePrimary + '1A' } as React.CSSProperties}
                      autoComplete="off"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password field */}
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
                      className="w-full py-3.5 px-4 pl-11 pr-12 border-2 border-gray-200 rounded-xl bg-gray-50 text-[15px] transition-all duration-300 focus:outline-none focus:bg-white focus:ring-4"
                      style={{ '--tw-ring-color': themePrimary + '1A' } as React.CSSProperties}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-lg transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full py-3.5 text-white rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

              <div className="text-center mt-5">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push("/forgot-password");
                  }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: themePrimary }}
                >
                  Forgot Your Password?
                </a>
              </div>
            </div>
          )}

          {/* ═══ BLOCKED / SELF-BLOCK STEP (matches original form_block) ═══ */}
          {step === "blocked" && (
            <div className={`transition-all duration-300 ease-out ${isTransitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}`}>
              {blockSubmitted && blockResult === "success" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <Ban className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Account Blocked</h3>
                  <p className="text-sm text-gray-500 mb-4">Your account has been blocked. Please contact your administrator.</p>
                  {adminEmail && (
                    <a href={`mailto:${adminEmail}`} className="text-sm font-medium" style={{ color: themePrimary }}>
                      <Mail className="w-4 h-4 inline mr-1" />{adminEmail}
                    </a>
                  )}
                </div>
              ) : blockSubmitted && blockResult === "not_found" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                    <CircleAlert className="w-8 h-8 text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Match Found</h3>
                  <p className="text-sm text-gray-500 mb-4">No account was found with that email. Please enter the correct email or username.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setBlockSubmitted(false);
                      setBlockResult(null);
                      setBlockEmail("");
                    }}
                    className="text-sm font-medium"
                    style={{ color: themePrimary }}
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2.5 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-700">
                    <Ban className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="flex-1">Too many failed attempts. Please enter your email to block your account for security.</span>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleBlockAccount(); }}>
                    <div className="mb-5">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email or Username
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          value={blockEmail}
                          onChange={(e) => setBlockEmail(e.target.value)}
                          placeholder="Enter your email or username"
                          className="w-full py-3.5 px-4 pl-11 border-2 border-gray-200 rounded-xl bg-gray-50 text-[15px] transition-all duration-300 focus:outline-none focus:bg-white focus:ring-4"
                          style={{ '--tw-ring-color': themePrimary + '1A' } as React.CSSProperties}
                          required
                          autoFocus
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3.5 text-white rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
                      style={gradientBtn}
                    >
                      Send Email
                    </button>
                  </form>

                  {adminEmail && (
                    <div className="text-center mt-4">
                      <a href={`mailto:${adminEmail}`} className="text-sm font-medium" style={{ color: themePrimary }}>
                        <Mail className="w-4 h-4 inline mr-1" />Contact Administrator
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ FOOTER ═══ */}
          <div className="text-center mt-8 text-[10px] text-gray-400 leading-relaxed">
            &copy; {new Date().getFullYear()} {systemName}. All rights reserved.
            <br />
            Powered by{" "}
            <span style={{ color: themePrimary }} className="font-medium">
              Lightworldtech
            </span>
          </div>
        </div>
      </div>

      {/* ═══ AUTHENTICATING MODAL OVERLAY (matches original loginModal) ═══ */}
      {showLoadingOverlay && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 text-center max-w-[250px] shadow-xl">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-[color:var(--theme-color)] rounded-full animate-spin mx-auto mb-5" style={{ '--theme-color': themePrimary } as React.CSSProperties} />
            <p className="text-base font-semibold text-gray-900 mb-2">Authenticating...</p>
            <p className="text-sm text-gray-500">Please wait while we verify your credentials</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
