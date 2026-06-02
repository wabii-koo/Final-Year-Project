"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  Users,
  Clock,
  FileText,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Upload,
  Download,
} from "lucide-react";
import { studentImportAPI } from "@/lib/api";

interface UserData {
  userId: number;
  email: string;
  role: string;
  fullName: string;
}

interface Stats {
  pendingRegistrations: number;
  approvedRegistrations: number;
  rejectedRegistrations: number;
  totalGuardians: number;
  recentActivity: Array<{
    id: number;
    action: string;
    user: string;
    timestamp: string;
    status: "pending" | "approved" | "rejected";
  }>;
}

export default function RegistrarDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    pendingRegistrations: 0,
    approvedRegistrations: 0,
    rejectedRegistrations: 0,
    totalGuardians: 0,
    recentActivity: [],
  });
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/auth/login");
      return;
    }

    const parsed = JSON.parse(userData);
    setUser(parsed);

    if (parsed.role !== "registrar") {
      router.push("/dashboard");
      return;
    }

    fetchRegistrarStats(token);
  }, [router]);

  const fetchRegistrarStats = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const response = await fetch(
        `${apiUrl}/api/registration/registrar/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const statsData = await response.json();
        const s = statsData.data;

        setStats({
          pendingRegistrations: s.totalPending || 0,
          approvedRegistrations: s.totalApproved || 0,
          rejectedRegistrations: s.totalRejected || 0,
          totalGuardians:
            (s.totalApproved || 0) +
            (s.totalPending || 0) +
            (s.totalRejected || 0) +
            (s.totalCorrectionRequired || 0) +
            (s.totalLocked || 0),
          recentActivity: [],
        });
      } else {
        console.error("Failed to fetch stats:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching registrar stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setUploadResult(null);

    try {
      const response = await studentImportAPI.importStudents(file);
      setUploadResult(response.data);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "Failed to upload CSV file";
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const downloadCSVTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(
        `${apiUrl}/api/registration/registrar/students/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "students_export.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback to static template if API call fails
        console.error("Failed to export students, using fallback template");
        const csvContent = `fullName,dob,emergencyContact,classLevel\nJohn Doe,2015-05-15,+251911000000,Grade 1-A\nJane Smith,2016-08-20,+251922000000,Grade 2-B`;
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "students_template.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting students:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      icon: Clock,
      label: "Pending Apps",
      value: stats.pendingRegistrations,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderGrad: "bg-gradient-to-r from-amber-400 to-amber-500",
      description: "Awaiting registration review",
    },
    {
      icon: CheckCircle,
      label: "Verified Guardians",
      value: stats.approvedRegistrations,
      color: "text-brand-success",
      bgColor: "bg-brand-bg",
      borderGrad: "bg-gradient-to-r from-brand-primary to-brand-success",
      description: "Activated guardian accounts",
    },
    {
      icon: XCircle,
      label: "Rejected Files",
      value: stats.rejectedRegistrations,
      color: "text-red-500",
      bgColor: "bg-red-50",
      borderGrad: "bg-gradient-to-r from-red-400 to-red-500",
      description: "Declined/invalid applications",
    },
    {
      icon: Users,
      label: "Total Database",
      value: stats.totalGuardians,
      color: "text-brand-primary",
      bgColor: "bg-brand-bg",
      borderGrad: "bg-gradient-to-r from-brand-secondary to-brand-accent",
      description: "Total logs in record system",
    },
  ];

  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden font-sans">
      {/* Premium Glassmorphic Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-brand-accent/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-brand-secondary/5 blur-[100px] pointer-events-none" />

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none rotate-45 transition-transform duration-1000 hover:rotate-90">
        <ShieldCheck size={240} className="text-brand-accent" />
      </div>

      <div className="relative mx-auto max-w-7xl p-6 lg:p-8 space-y-10">
        {/* Welcome Banner */}
        <header className="bg-brand-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl shadow-brand-primary/5 border border-brand-100/60 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative hover:border-brand-primary/20 transition-all duration-500">
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-brand-heading tracking-tight">
              Registrar Portal
            </h1>
            <p className="text-brand-text mt-2 text-lg font-semibold">
              You have{" "}
              <span className="text-brand-primary font-black">
                {stats.pendingRegistrations}
              </span>{" "}
              applications awaiting verification.
            </p>
            <div className="inline-flex items-center gap-1.5 mt-4 px-4.5 py-2 bg-gradient-to-r from-brand-accent/20 to-brand-accent/10 border border-brand-accent/30 text-brand-primary rounded-full text-xs font-black uppercase tracking-widest shadow-inner">
              Officer: {user?.fullName}
            </div>
          </div>
          <div className="flex gap-3 relative z-10">
            <button
              onClick={() => router.push("/dashboard/registrations")}
              className="group flex items-center gap-2.5 px-7 py-4 bg-linear-to-r from-brand-primary to-brand-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-brand-primary/30 transition-all duration-300"
            >
              <ShieldCheck
                size={20}
                className="group-hover:rotate-12 transition-transform duration-300"
              />
              REVIEW APPLICATIONS
            </button>
          </div>
          <ShieldCheck
            className="absolute -bottom-8 -left-8 text-brand-accent/5 -rotate-12"
            size={160}
          />
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <div
              key={i}
              className="relative bg-brand-white/80 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-brand-100/60 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(34,197,94,0.08)] hover:border-brand-primary/30 transition-all duration-300 group overflow-hidden"
            >
              {/* Card Accent Top Bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${stat.borderGrad}`}
              />

              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-2xl ${stat.bgColor} ${stat.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
                >
                  <stat.icon size={24} />
                </div>
              </div>
              <div className="mt-5">
                <p className="text-brand-text font-bold text-[10px] uppercase tracking-widest leading-none">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-black text-brand-heading mt-2 leading-none">
                  {stat.value}
                </h3>
                <p className="text-brand-text/60 text-xs font-semibold mt-3 leading-none">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Main Content Sections - Reorganized Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CSV Import */}
          <div className="bg-brand-white/80 backdrop-blur-md rounded-[2.5rem] shadow-xl shadow-brand-primary/5 border border-brand-100/60 p-8 hover:shadow-[0_20px_50px_rgba(34,197,94,0.02)] transition-all duration-500 flex flex-col h-full">
            <h3 className="text-2xl font-black text-brand-heading mb-6 flex items-center gap-3">
              <Upload className="text-brand-primary" />
              Import Students
            </h3>

            <div className="space-y-5 flex-1 flex flex-col justify-center">
              <button
                onClick={downloadCSVTemplate}
                className="group w-full flex items-center gap-4.5 p-4.5 bg-gradient-to-b from-white to-brand-bg/40 rounded-2.5xl border border-brand-100/60 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md hover:border-brand-secondary/20 transition-all duration-300"
              >
                <div className="p-3.5 rounded-xl bg-brand-secondary text-white shadow-md group-hover:-translate-y-0.5 transition-transform duration-300">
                  <Download size={20} />
                </div>
                <div className="text-left">
                  <span className="block font-black text-brand-heading text-sm group-hover:text-brand-primary transition-colors">
                    Download Student Database (CSV)
                  </span>
                  <span className="block text-[10px] text-brand-text/50 font-bold uppercase tracking-wider mt-0.5">
                    Export active records from database
                  </span>
                </div>
              </button>

              <div className="relative group">
                <div className="absolute inset-0 bg-brand-primary/5 rounded-2.5xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <input
                  aria-label="upload"
                  type="file"
                  id="csv-file-input"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 disabled:cursor-not-allowed"
                />
                <div className="w-full p-6.5 rounded-2.5xl border-2 border-dashed border-brand-200/80 group-hover:border-brand-primary group-hover:bg-brand-primary/[0.01] transition-all duration-300 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-2xl bg-brand-bg text-brand-primary flex items-center justify-center mb-2 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                    <Upload size={20} />
                  </div>
                  <span className="block font-black text-brand-heading text-sm group-hover:text-brand-primary transition-colors">
                    Drag & drop CSV files
                  </span>
                  <span className="block text-[10px] text-brand-text/50 font-bold uppercase tracking-wider mt-1">
                    or click to browse from device
                  </span>
                </div>
              </div>

              {uploading && (
                <div className="flex items-center gap-3 p-4 bg-brand-bg rounded-2.5xl border border-brand-100/50">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary"></div>
                  <span className="text-xs font-black text-brand-heading uppercase tracking-wider">
                    Uploading student catalog...
                  </span>
                </div>
              )}

              {uploadResult && (
                <div className="p-5 bg-emerald-50/80 backdrop-blur-xs rounded-2.5xl border border-emerald-100 space-y-4 shadow-sm animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-emerald-500 rounded-full text-white">
                      <CheckCircle size={14} />
                    </div>
                    <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">
                      Catalog Upload Completed
                    </p>
                  </div>
                  <div className="text-xs text-emerald-700 font-bold space-y-1.5 leading-relaxed">
                    <p>
                      Successfully imported{" "}
                      <span className="font-extrabold text-emerald-900">
                        {uploadResult.data.successful}
                      </span>{" "}
                      new student profiles.
                    </p>
                    {uploadResult.data.duplicates > 0 && (
                      <p className="text-amber-700">
                        Skipped{" "}
                        <span className="font-extrabold text-amber-900">
                          {uploadResult.data.duplicates}
                        </span>{" "}
                        duplicate records (already exist in database).
                      </p>
                    )}
                    {uploadResult.data.failed > 0 && (
                      <p className="text-red-700">
                        Failed to import{" "}
                        <span className="font-extrabold text-red-900">
                          {uploadResult.data.failed}
                        </span>{" "}
                        records due to formatting or database errors.
                      </p>
                    )}
                  </div>
                  {uploadResult.data.created?.length > 0 && (
                    <div className="text-[11px] text-emerald-700 bg-white/55 p-3 rounded-xl border border-emerald-100/50">
                      <p className="font-black uppercase tracking-wider text-emerald-800">
                        Added Students:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 font-semibold max-h-24 overflow-y-auto">
                        {uploadResult.data.created.map((student: any) => (
                          <li key={student.studentId} className="truncate">
                            {student.fullName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {uploadResult.data.errors?.length > 0 && (
                    <div className="text-[11px] text-amber-700 bg-amber-50/55 p-3 rounded-xl border border-amber-100/50">
                      <p className="font-black uppercase tracking-wider text-amber-800">
                        Warnings/Errors details:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 font-semibold max-h-24 overflow-y-auto">
                        {uploadResult.data.errors.map(
                          (error: string, index: number) => (
                            <li key={index} className="truncate">
                              {error}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {uploadError && (
                <div className="p-4 bg-red-50/85 backdrop-blur-xs rounded-2.5xl border border-red-100 animate-fadeIn">
                  <p className="text-xs font-black text-red-800 uppercase tracking-wider">
                    Catalog Import Failed
                  </p>
                  <p className="text-xs text-red-700 font-semibold mt-1 leading-relaxed">
                    {uploadError}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* System Alert Card */}
          <div className="flex flex-col h-full justify-between gap-6">
            {stats.pendingRegistrations > 0 ? (
              <div
                className="bg-brand-primary rounded-[2.5rem] p-8 text-white shadow-xl shadow-brand-primary/20 relative overflow-hidden group cursor-pointer hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex-1 flex flex-col justify-center"
                onClick={() => router.push("/dashboard/registrations")}
              >
                <div className="relative z-10">
                  <h4 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <AlertCircle size={20} className="animate-pulse" />
                    Action Required
                  </h4>
                  <p className="text-white/80 text-sm mt-3 font-semibold leading-relaxed">
                    You have {stats.pendingRegistrations} applications awaiting
                    review that require immediate verification attention.
                  </p>
                </div>
                <ShieldCheck
                  className="absolute -bottom-6 -right-6 text-white/10 group-hover:rotate-45 group-hover:scale-110 transition-all duration-500"
                  size={120}
                />
              </div>
            ) : (
              <div className="bg-brand-white/85 border border-brand-100/60 rounded-[2.5rem] p-8 shadow-sm flex-1 flex flex-col justify-center items-center text-center">
                <div className="w-14 h-14 rounded-full bg-brand-bg text-brand-success flex items-center justify-center mb-4">
                  <CheckCircle size={28} />
                </div>
                <h4 className="text-lg font-black text-brand-heading">
                  All Caught Up!
                </h4>
                <p className="text-xs text-brand-text/70 mt-2 font-medium max-w-[200px]">
                  There are no pending guardian registrations to review.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
