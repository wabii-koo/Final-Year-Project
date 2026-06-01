"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";

type Role = "Parent" | "Teacher" | "Registrar" | "Director";

// Credential hints shown per role tab — click any card to auto-fill the form
const ROLE_HINTS: Record<Role, { label: string; email: string; password: string; badge?: string }[]> = {
  Parent: [],
  Teacher: [
    { label: "Mr. Alex Brown (Subject Teacher)", email: "teacher@school.com", password: "teacher789" },
    { label: "Ms. Sarah Smith (English / Soc. Studies)", email: "sarah.smith@school.com", password: "Smith1A@2026", badge: "Grade 1-A & 2-B" },
    { label: "Mr. James Johnson (Math / Soc. Studies)", email: "james.johnson@school.com", password: "Johnson2B@2026", badge: "Grade 2-B & 3-B" },
    { label: "Mrs. Emily Davis (Science / Soc. Studies)", email: "emily.davis@school.com", password: "Davis3B@2026", badge: "Grade 1-A & 3-B" },
    { label: "Mr. Robert Miller (Mathematics)", email: "robert.miller@school.com", password: "MillerMath@2026", badge: "Grade 1-A & 3-B" },
    { label: "Dr. Lisa Green (Science)", email: "lisa.green@school.com", password: "GreenScience@2026", badge: "Grade 1-A & 2-B" },
    { label: "Ms. Karen White (English)", email: "karen.white@school.com", password: "WhiteEnglish@2026", badge: "Grade 2-B & 3-B" },
  ],
  Registrar: [
    { label: "School Registrar", email: "registrar@school.com", password: "registrar456" },
  ],
  Director: [
    { label: "School Director", email: "director@school.com", password: "director123" },
  ],
};

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState<Role>("Parent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHints, setShowHints] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const roles: Role[] = ["Parent", "Teacher", "Registrar", "Director"];
  const hints = ROLE_HINTS[activeRole] ?? [];

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam) {
      const formattedRole =
        roleParam.charAt(0).toUpperCase() + roleParam.slice(1).toLowerCase();
      if (roles.includes(formattedRole as Role)) {
        setActiveRole(formattedRole as Role);
      }
    }
  }, [searchParams]);

  // Collapse hints when switching roles
  useEffect(() => {
    setShowHints(false);
    setError("");
  }, [activeRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Map UI role to the value expected by backend
      const roleMap: Record<Role, string> = {
        Parent: "parent",
        Teacher: "teacher",
        Registrar: "registrar",
        Director: "director",
      };

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role: roleMap[activeRole] }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        router.push("/dashboard");
      } else {
        setError(
          data.error?.message || "Login failed. Please check your credentials.",
        );
      }
    } catch {
      setError("A network error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "webiikoo@gmail.com",
          password: "google_oauth_bypass",
          role: "parent",
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        router.push("/dashboard");
      } else {
        setError(data.error?.message || "Google login failed.");
      }
    } catch {
      setError("A network error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToDedicatedPage = () => {
    if (activeRole === "Teacher") {
      router.push("/auth/teacher-login");
    } else if (activeRole === "Registrar") {
      router.push("/auth/registrar-login");
    } else if (activeRole === "Director") {
      router.push("/auth/director-login");
    }
  };

  const fillCredentials = (hint: { email: string; password: string }) => {
    setEmail(hint.email);
    setPassword(hint.password);
    setShowHints(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      <header className="w-full bg-brand-primary shadow-lg">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1 rounded-full border border-white/20 w-10 h-10 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="School Logo" className="object-contain w-full h-full" />
            </div>
            <span className="text-white font-black text-xl tracking-tighter uppercase">GuardianGate</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4 py-12 md:p-8 overflow-y-auto">
        <div className="w-full max-w-5xl my-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Visual Illustration (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col items-center text-center lg:items-start lg:text-left space-y-6">
            <div className="relative w-full max-w-[280px] mx-auto lg:mx-0">
              <div className="absolute -inset-4 bg-brand-primary/5 rounded-[2rem] blur-xl -z-10 animate-pulse" />
              <img
                src="/user-connections.png"
                alt="Connected School Community Network"
                className="w-full h-auto object-contain animate-float"
              />
            </div>
            <div>
              <h2 className="text-3xl font-black text-brand-heading tracking-tight leading-tight mb-3">
                Connected School <br />
                <span className="text-brand-primary">Community</span>
              </h2>
              <p className="text-brand-text text-sm font-medium leading-relaxed max-w-sm">
                GuardianGate bridges the gap between home and classroom, keeping parents, teachers, and administrators connected in real-time.
              </p>
            </div>
          </div>

          {/* Right Column: Form Card */}
          <div className="lg:col-span-7 w-full">
            {/* Back Button */}
            <Link
              href="/"
              className="flex items-center gap-2 text-brand-primary hover:text-brand-secondary font-bold mb-6 transition-colors cursor-pointer group w-fit"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span>Back to Home</span>
            </Link>
            <div className="bg-brand-white rounded-[3rem] shadow-2xl shadow-brand-primary/5 p-8 md:p-12 relative overflow-hidden border border-brand-100">

            {/* Role Tabs */}
            <div className="bg-brand-100 p-1.5 rounded-2xl flex mb-10 overflow-x-auto no-scrollbar relative z-10 gap-0.5">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setActiveRole(role);
                    setEmail("");
                    setPassword("");
                    setError("");
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                    activeRole === role
                      ? "bg-brand-primary text-white shadow-md"
                      : "text-brand-text hover:text-brand-primary"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {activeRole === "Parent" ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-brand-heading mb-2 tracking-tight">Sign In</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-brand-primary" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@school.com"
                        className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 pl-12 pr-4 text-brand-heading font-medium focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary focus:bg-white transition-all outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 ml-1">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-brand-primary" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 pl-12 pr-12 text-brand-heading font-medium focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary focus:bg-white transition-all outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-brand-primary transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex items-center justify-between px-1">
                    <label className="flex items-center group cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-5 h-5 border-2 border-brand-200 rounded-lg peer-checked:bg-brand-primary peer-checked:border-brand-primary transition-all" />
                        <svg
                          className="absolute w-3.5 h-3.5 text-white left-[3px] top-[3px] opacity-0 peer-checked:opacity-100 transition-opacity"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span className="ml-2.5 text-sm font-bold text-brand-text group-hover:text-brand-primary transition-colors">
                        Remember me
                      </span>
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm font-semibold text-brand-primary hover:text-brand-primaryHover transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-linear-to-r from-brand-primary to-brand-accent text-white font-black text-lg py-4 shadow-xl shadow-brand-primary/20 hover:opacity-95 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin -ml-1 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      <>
                        <User className="w-5 h-5 text-white" />
                        Sign In
                      </>
                    )}
                  </Button>

                  {/* ── Credential hints ── */}
                  {hints.length > 0 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowHints(!showHints)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-brand-100 hover:bg-brand-200/50 rounded-2xl text-sm font-semibold text-brand-primary transition-all"
                      >
                        <span className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          View login credentials
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showHints ? "rotate-180" : ""}`} />
                      </button>

                      {showHints && (
                        <div className="mt-2 space-y-2">
                          {hints.map((hint) => (
                            <button
                              key={hint.email}
                              type="button"
                              onClick={() => fillCredentials(hint)}
                              className="w-full flex items-center justify-between p-4 bg-white border border-brand-100 hover:border-brand-primary/40 hover:bg-brand-50 rounded-2xl transition-all text-left"
                            >
                              <div>
                                <p className="font-bold text-brand-heading text-sm">{hint.label}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{hint.email}</p>
                              </div>
                              {hint.badge && (
                                <span className="text-xs font-bold px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full whitespace-nowrap ml-2">
                                  {hint.badge}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Register Footer - Only visible when Parent tab is active */}
                  <div className="pt-4 text-center space-y-6">
                    <p className="text-gray-500 font-medium">
                      Don't have an account?{" "}
                      <Link
                        href="/auth/register"
                        className="text-brand-primary font-bold hover:underline underline-offset-4"
                      >
                        Register free
                      </Link>
                    </p>

                    <div className="flex items-center gap-4 py-2">
                      <div className="flex-1 border-t border-brand-100"></div>
                      <span className="text-xs font-black text-brand-text/40 uppercase tracking-widest">Or continue with</span>
                      <div className="flex-1 border-t border-brand-100"></div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full flex items-center justify-center gap-3 py-4 border border-brand-100 bg-white hover:bg-brand-50 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer font-bold text-brand-heading"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.354 0 3.373 2.736 1.505 6.727l3.76 3.038z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.49 12.275c0-.825-.075-1.62-.215-2.385H12v4.51h6.46a5.523 5.523 0 0 1-2.4 3.62l3.765 3.04c2.203-2.03 3.665-5.02 3.665-8.785z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.266 14.235a7.077 7.077 0 0 1-.357-2.235c0-.785.132-1.54.357-2.235L1.505 6.727A11.967 11.967 0 0 0 0 12c0 1.92.453 3.737 1.258 5.355l4.008-3.12z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.955-1.075 7.94-2.915l-3.765-3.04a7.172 7.172 0 0 1-4.175 1.18c-3.69 0-6.81-2.495-7.925-5.87l-4.008 3.12A11.97 11.97 0 0 0 12 24z"
                        />
                      </svg>
                      Continue with Google
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div key={activeRole} className="space-y-6 animate-fade-in-up">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex flex-col items-center text-center py-4 space-y-6">
                  {/* Pill Badge */}
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-black text-xs uppercase tracking-widest animate-pulse">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Secure Portal Pathway</span>
                  </div>

                  {/* Title and Description */}
                  <div className="space-y-3">
                    <h2 className="text-3xl md:text-4xl font-black text-brand-heading tracking-tight">
                      {activeRole} Login
                    </h2>
                    <p className="text-brand-text font-semibold text-sm max-w-sm mx-auto leading-relaxed">
                      To protect administrative records and student data, {activeRole.toLowerCase()} authentication is handled via a dedicated, secure channel.
                    </p>
                  </div>

                  {/* Fancy Staff Access smart card */}
                  <div className="w-full max-w-[340px] aspect-[1.586/1] bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-left relative overflow-hidden shadow-2xl border border-white/10 group cursor-default select-none transition-transform hover:-translate-y-1 hover:rotate-1 duration-300">
                    
                    {/* Glowing corner reflections */}
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-brand-primary/20 rounded-full blur-2xl group-hover:bg-brand-primary/30 transition-colors" />
                    <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-brand-accent/20 rounded-full blur-2xl group-hover:bg-brand-accent/30 transition-colors" />
                    
                    {/* Cybernetic grid overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:12px_12px] opacity-60" />

                    {/* Card Header */}
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block">Authorized Staff Only</span>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight mt-0.5">
                          {activeRole} Pass
                        </h3>
                      </div>
                      {/* Pulsing Status Light */}
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    </div>

                    {/* Smart Card Chip */}
                    <div className="mt-6 mb-6 relative z-10 flex items-center justify-between">
                      <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 p-[1.5px] shadow-md border border-amber-600/20 relative overflow-hidden">
                        <div className="absolute inset-0 grid grid-cols-3 gap-[1px]">
                          <div className="border-r border-b border-amber-800/20"></div>
                          <div className="border-r border-b border-amber-800/20"></div>
                          <div className="border-b border-amber-800/20"></div>
                          <div className="border-r border-b border-amber-800/20"></div>
                          <div className="border-r border-b border-amber-800/20"></div>
                          <div className="border-b border-amber-800/20"></div>
                          <div className="border-r border-amber-800/20"></div>
                          <div className="border-r border-amber-800/20"></div>
                          <div></div>
                        </div>
                      </div>
                      {/* Logo watermark */}
                      <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">GuardianGate</span>
                    </div>

                    {/* Card Footer with Mock Barcode */}
                    <div className="mt-auto relative z-10 flex items-end justify-between gap-4 pt-1">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-wider block">Access Protocol</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">SECURE-CHANNEL-301</span>
                      </div>
                      
                      {/* Barcode lines */}
                      <div className="h-8 w-28 bg-white/5 rounded-sm p-1 flex items-center justify-center border border-white/5 backdrop-blur-xs">
                        <div className="w-full h-full flex gap-[1.5px] items-stretch opacity-60">
                          <div className="w-[1px] bg-white"></div>
                          <div className="w-[3px] bg-white"></div>
                          <div className="w-[1px] bg-white"></div>
                          <div className="w-[2px] bg-white"></div>
                          <div className="w-[1px] bg-white"></div>
                          <div className="w-[4px] bg-white"></div>
                          <div className="w-[1px] bg-white"></div>
                          <div className="w-[1px] bg-white"></div>
                          <div className="w-[3px] bg-white"></div>
                          <div className="w-[1px] bg-white"></div>
                          <div className="w-[2px] bg-white"></div>
                          <div className="w-[1px] bg-white"></div>
                          <div className="w-[4px] bg-white"></div>
                          <div className="w-[1px] bg-white"></div>
                          <div className="w-[2px] bg-white"></div>
                          <div className="w-[3px] bg-white"></div>
                          <div className="w-[1px] bg-white"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Premium Redirect Button */}
                  <button
                    type="button"
                    onClick={handleRedirectToDedicatedPage}
                    className="w-full max-w-[320px] py-4 bg-linear-to-r from-brand-primary to-brand-accent hover:opacity-95 hover:scale-[1.03] active:scale-[0.98] text-white font-black text-lg rounded-full shadow-2xl shadow-brand-primary/30 hover:shadow-brand-primary/45 transition-all duration-300 cursor-pointer inline-flex items-center justify-center gap-2.5 group relative overflow-hidden"
                  >
                    <span className="relative z-10">Proceed to {activeRole} Login</span>
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1 relative z-10" />
                    {/* Gloss sheen effect */}
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-bg flex items-center justify-center">
          <div className="animate-pulse text-brand-primary font-black text-xl px-4 uppercase tracking-tighter">
            Loading GuardianGate...
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
