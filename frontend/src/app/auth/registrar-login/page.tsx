"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";

export default function RegistrarLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHints, setShowHints] = useState(false);
  const router = useRouter();

  const hints: { label: string; email: string; password: string; badge?: string }[] = [
    { label: "School Registrar", email: "registrar@school.com", password: "registrar456" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role: "registrar" }),
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

  const fillCredentials = (hint: { email: string; password: string }) => {
    setEmail(hint.email);
    setPassword(hint.password);
    setShowHints(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      {/* Header */}
      <header className="w-full bg-brand-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1 rounded-full border border-white/20 w-10 h-10 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="School Logo" className="object-contain w-full h-full" />
            </div>
            <span className="text-white font-black text-xl tracking-tighter uppercase">GuardianGate</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex justify-center p-4 py-12 md:p-8 overflow-y-auto">
        <div className="w-full max-w-[520px] my-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push("/auth/login?role=registrar")}
            className="flex items-center gap-2 text-brand-primary hover:text-brand-secondary font-bold mb-6 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>

          <div className="bg-brand-white rounded-[3rem] shadow-2xl shadow-brand-primary/5 p-8 md:p-12 relative overflow-hidden border border-brand-100">
            {/* Header/Title block */}
            <div className="text-center mb-8">
              <span className="inline-block px-4 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full text-sm font-bold uppercase tracking-wider mb-3">
                Registrar Access
              </span>
              <h1 className="text-4xl font-bold text-brand-heading mb-2 tracking-tight">
                Registrar Portal
              </h1>
              <p className="text-brand-text font-semibold text-sm">
                Sign in to access your dashboard
              </p>
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
                    placeholder="registrar@school.com"
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
                    placeholder="Enter your password"
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

              {/* Forgot password */}
              <div className="flex justify-end px-1">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-semibold text-brand-primary hover:text-brand-primaryHover transition-colors"
                >
                  Forgot password?
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
                  "Sign In"
                )}
              </Button>

              {/* Hints */}
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

              {/* Disclaimer */}
              <p className="text-center text-xs font-semibold text-brand-text/75 mt-6 pt-4 border-t border-brand-100">
                Registrar access only. Contact admin for account issues.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
