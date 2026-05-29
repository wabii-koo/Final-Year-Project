"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  Check,
  X,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  FileImage,
  Shield,
  Clock,
  UserX,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

interface RegistrationRequest {
  registrationId: number;
  fullName: string;
  email: string;
  phoneNo: string;
  nationalId: string;
  studentName: string;
  studentId?: number | null;
  relationshipType: "parent" | "legal_guardian";
  certificateDocumentPath: string;
  idFrontPath: string;
  idBackPath: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "correction_required"
    | "locked";
  rejectionReason?: string;
  correctionAttempts: number;
  reviewedBy?: number | null;
  reviewedAt?: string | null;
  createdAt: string;
}

interface Student {
  studentId: number;
  fullName: string;
  classLevel?: string;
}

interface RegistrationStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalCorrectionRequired: number;
  totalLocked: number;
  recentRegistrations: number;
}

export default function RegistrationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] =
    useState<RegistrationRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestCorrection, setRequestCorrection] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchRegistrations();
    fetchStats();
  }, [statusFilter]);

  const fetchRegistrations = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(
        `${apiUrl}/api/registration/registrar/pending?status=${statusFilter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (data.success) {
        setRequests(data.data.registrations || []);
      } else {
        setError(
          data.error?.message || "Failed to fetch registration requests",
        );
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/registration/registrar/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats");
    }
  };

  const handleApprove = async (registrationId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!selectedStudent || !selectedStudent.studentId) {
        setError(
          "Please search and select a student to link with this guardian",
        );
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(
        `${apiUrl}/api/registration/registrar/${registrationId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentId: selectedStudent.studentId }),
        },
      );

      const data = await response.json();
      if (data.success) {
        setSuccess("Registration approved successfully!");
        fetchRegistrations();
        fetchStats();
        setShowDetailModal(false);
        setSelectedStudent(null);
      } else {
        setError(data.error?.message || "Failed to approve registration");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  const handleStudentSearch = async (query: string) => {
    setStudentSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(
        `${apiUrl}/api/registration/registrar/students/search?query=${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (err) {
      console.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReject = async (registrationId: number) => {
    if (!rejectionReason) {
      setError("Please provide a rejection reason");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(
        `${apiUrl}/api/registration/registrar/${registrationId}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: rejectionReason, requestCorrection }),
        },
      );

      if (response.ok) {
        setSuccess(
          requestCorrection ? "Correction requested" : "Registration rejected",
        );
        fetchRegistrations();
        fetchStats();
        setShowDetailModal(false);
        setShowRejectModal(false);
        setRejectionReason("");
      }
    } catch (error) {
      setError("Failed to reject registration");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-brand-bg text-brand-secondary border-brand-secondary/20",
      approved:
        "bg-brand-success/10 text-brand-success border-brand-success/20",
      rejected: "bg-red-50 text-red-600 border-red-100",
      correction_required:
        "bg-brand-accent/10 text-brand-primary border-brand-accent/20",
      locked: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status as keyof typeof styles]}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const filteredRequests = requests.filter(
    (req) =>
      req.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.nationalId?.includes(searchQuery),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="animate-pulse text-brand-primary font-black text-xl uppercase tracking-tighter">
          Validating Records...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden font-sans">
      {/* Decorative Leaves */}
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none rotate-45">
        <ShieldCheck size={240} className="text-brand-accent" />
      </div>

      <div className="relative mx-auto max-w-7xl p-6 lg:p-8 space-y-10">
        {/* Header */}
        <header className="bg-brand-white rounded-[3rem] p-8 shadow-xl shadow-brand-primary/5 border border-brand-100 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-brand-heading tracking-tight flex items-center gap-3">
              Registration Review
            </h1>
            <p className="text-brand-text mt-2 text-lg font-medium">
              Verifying credentials for the GuardianGate ecosystem.
            </p>
          </div>
          <div className="flex gap-3 relative z-10">
            <button
              aria-label="Refresh registrations"
              onClick={() => {
                fetchRegistrations();
                fetchStats();
              }}
              className="p-4 bg-brand-bg text-brand-primary rounded-2xl border border-brand-100 hover:bg-white transition-all shadow-sm"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <ShieldCheck
            className="absolute -bottom-8 -right-8 text-brand-accent/10 rotate-12"
            size={160}
          />
        </header>

        {/* Stats Grid */}
        {stats && (
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                label: "Pending",
                value: stats.totalPending,
                color: "text-brand-secondary",
              },
              {
                label: "Approved",
                value: stats.totalApproved,
                color: "text-brand-success",
              },
              {
                label: "Rejected",
                value: stats.totalRejected,
                color: "text-red-500",
              },
              {
                label: "Correction",
                value: stats.totalCorrectionRequired,
                color: "text-brand-primary",
              },
              {
                label: "Locked",
                value: stats.totalLocked,
                color: "text-slate-400",
              },
              {
                label: "Recent",
                value: stats.recentRegistrations,
                color: "text-brand-accent",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-brand-white p-5 rounded-3xl border border-brand-100 shadow-sm"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-text">
                  {stat.label}
                </p>
                <h3 className={`text-2xl font-black mt-1 ${stat.color}`}>
                  {stat.value}
                </h3>
              </div>
            ))}
          </section>
        )}

        {/* Search and Filters */}
        <div className="bg-brand-white p-4 rounded-[2rem] border border-brand-100 shadow-xl shadow-brand-primary/5 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent"
              size={18}
            />
            <input
              type="text"
              placeholder="Search database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-3 pl-12 pr-4 text-brand-heading font-bold placeholder-brand-text/50 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
            />
          </div>
          <select
            aria-label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 bg-brand-bg border border-brand-100 rounded-2xl py-3 px-4 text-brand-heading font-bold outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
          >
            <option value="pending">Review Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="correction_required">Corrections</option>
            <option value="all">All Records</option>
          </select>
        </div>

        {/* Requests Table */}
        <div className="bg-brand-white rounded-[3rem] shadow-xl shadow-brand-primary/5 border border-brand-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-bg border-b border-brand-100">
                <tr>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">
                    Identity
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">
                    Student Link
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">
                    Status
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">
                    Submitted
                  </th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-brand-text">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {filteredRequests.map((req) => (
                  <tr
                    key={req.registrationId}
                    className="hover:bg-brand-bg transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-brand-100 flex items-center justify-center text-brand-primary font-black">
                          {req.fullName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-brand-heading">
                            {req.fullName}
                          </p>
                          <p className="text-[10px] text-brand-text font-bold uppercase">
                            {req.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-brand-heading">
                        {req.studentName}
                      </p>
                      <p className="text-[10px] text-brand-secondary font-black uppercase italic">
                        {req.relationshipType}
                      </p>
                    </td>
                    <td className="px-8 py-6">{getStatusBadge(req.status)}</td>
                    <td className="px-8 py-6 text-xs font-bold text-brand-text">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        aria-label="View details"
                        onClick={() => {
                          setSelectedRequest(req);
                          setSelectedStudent(null);
                          setError("");
                          setSuccess("");
                          setShowDetailModal(true);
                        }}
                        className="p-2 bg-brand-bg text-brand-primary rounded-xl border border-brand-100 hover:bg-brand-primary hover:text-white transition-all group-hover:scale-105 shadow-sm"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRequests.length === 0 && (
            <div className="py-20 text-center">
              <UserX className="mx-auto text-brand-accent/20" size={64} />
              <p className="mt-4 text-brand-text font-bold uppercase tracking-widest">
                No matching records found
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-4 bg-brand-heading/40 backdrop-blur-sm">
          <div className="bg-brand-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl border border-brand-100 flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="px-10 py-6 border-b border-brand-100 flex justify-between items-center bg-brand-bg/50">
              <h3 className="text-2xl font-black text-brand-heading tracking-tight flex items-center gap-3">
                <ShieldCheck className="text-brand-primary" />
                Case Review #{selectedRequest.registrationId}
              </h3>
              <button
                aria-label="Close modal"
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-brand-bg rounded-xl transition-colors"
              >
                <X size={24} className="text-brand-heading" />
              </button>
            </div>

            {error && (
              <div className="px-10 py-4 bg-red-50 text-red-600 font-bold text-sm border-b border-red-100 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="px-10 py-4 bg-brand-success/10 text-brand-success font-bold text-sm border-b border-brand-success/20 flex items-center gap-2">
                <CheckCircle size={16} />
                {success}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-text mb-4">
                      Guardian Profile
                    </h4>
                    <div className="bg-brand-bg rounded-[2rem] p-6 border border-brand-100 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-brand-text">
                          Full Name
                        </span>
                        <span className="text-sm font-black text-brand-heading">
                          {selectedRequest.fullName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-brand-text">
                          National ID
                        </span>
                        <span className="text-sm font-black text-brand-heading">
                          {selectedRequest.nationalId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-brand-text">
                          Contact
                        </span>
                        <span className="text-sm font-black text-brand-heading">
                          {selectedRequest.phoneNo}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-text mb-4">
                      Database Linking
                    </h4>
                    <div className="bg-brand-primary/5 rounded-[2rem] p-6 border border-brand-primary/10">
                      <p className="text-sm font-bold text-brand-heading mb-4">
                        Alleged Dependent: "{selectedRequest.studentName}"
                      </p>

                      {selectedRequest.status === "pending" ? (
                        <div className="space-y-4">
                          <div className="relative">
                            <Search
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary"
                              size={16}
                            />
                            <input
                              type="text"
                              placeholder="Search student directory..."
                              value={studentSearch}
                              onChange={(e) =>
                                handleStudentSearch(e.target.value)
                              }
                              className="w-full bg-white border border-brand-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/10"
                            />
                          </div>

                          {searchResults.length > 0 && !selectedStudent && (
                            <div className="bg-white border border-brand-100 rounded-2xl shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                              {searchResults.map((s) => (
                                <button
                                  key={s.studentId}
                                  onClick={() => setSelectedStudent(s)}
                                  className="w-full text-left px-5 py-3 text-sm text-brand-text hover:bg-brand-bg hover:text-brand-primary transition-colors flex justify-between font-bold"
                                >
                                  <span>{s.fullName}</span>
                                  <span className="text-brand-accent italic">
                                    #{s.studentId}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          {selectedStudent && (
                            <div className="flex items-center justify-between bg-brand-success/10 border border-brand-success/20 p-4 rounded-2xl animate-fadeIn">
                              <div className="flex items-center gap-3">
                                <CheckCircle
                                  className="text-brand-success"
                                  size={18}
                                />
                                <span className="text-sm font-black text-brand-heading">
                                  Link: {selectedStudent.fullName}
                                </span>
                              </div>
                              <button
                                onClick={() => setSelectedStudent(null)}
                                className="text-xs font-black text-brand-primary hover:underline"
                              >
                                RESET
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-brand-success font-black text-sm">
                          <ShieldCheck size={18} />
                          Verified Link ID #{selectedRequest.studentId}
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-text mb-4">
                    Credentials & Documents
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      "certificateDocumentPath",
                      "idFrontPath",
                      "idBackPath",
                    ].map((field) => {
                      const path = selectedRequest[
                        field as keyof RegistrationRequest
                      ] as string;
                      if (!path) return null;
                      const apiUrl =
                        process.env.NEXT_PUBLIC_API_URL ||
                        "http://localhost:3000";
                      const fullPath = `${apiUrl}/${path.replace(/\\/g, "/")}`;
                      const label = field.includes("certificate")
                        ? "Birth Certificate"
                        : field.includes("Front")
                          ? "ID Front"
                          : "ID Back";

                      return (
                        <div
                          key={field}
                          className="bg-brand-bg rounded-[2rem] p-4 border border-brand-100 group"
                        >
                          <p className="text-[10px] font-black text-brand-text uppercase mb-3 px-2">
                            {label}
                          </p>
                          <div className="relative h-48 rounded-2xl overflow-hidden bg-white border border-brand-100">
                            <img
                              src={fullPath}
                              alt={label}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-brand-heading/0 group-hover:bg-brand-heading/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <button
                                onClick={() => window.open(fullPath, "_blank")}
                                className="bg-white text-brand-primary px-6 py-2 rounded-xl font-black text-xs shadow-xl"
                              >
                                OPEN ORIGINAL
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-10 py-8 bg-brand-bg border-t border-brand-100 flex justify-end gap-4">
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-8 py-4 border-2 border-red-200 text-red-500 rounded-2xl font-black text-xs uppercase hover:bg-red-50 transition-all"
              >
                Reject / Request Correction
              </button>
              <button
                onClick={() => handleApprove(selectedRequest.registrationId)}
                disabled={
                  !selectedStudent && selectedRequest.status === "pending"
                }
                className="px-10 py-4 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                Approve & Activate Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-brand-heading/40 backdrop-blur-sm">
          <div className="bg-brand-white rounded-[3rem] w-full max-w-md p-8 border border-brand-100 shadow-2xl animate-fadeIn">
            <h3 className="text-2xl font-black text-brand-heading mb-6 tracking-tight">
              Case Disposition
            </h3>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-brand-text block mb-2">
                  Internal Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-100 rounded-2xl p-4 text-brand-heading font-bold h-32 outline-none focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Describe the discrepancy..."
                />
              </div>

              <div className="flex items-start gap-4 p-4 bg-brand-accent/10 rounded-2xl border border-brand-accent/20">
                <input
                  type="checkbox"
                  id="requestCorrection"
                  checked={requestCorrection}
                  onChange={(e) => setRequestCorrection(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-brand-primary"
                />
                <label
                  htmlFor="requestCorrection"
                  className="text-xs font-bold text-brand-heading leading-relaxed"
                >
                  Allow Resubmission: Check this if you want the guardian to fix
                  the issue and try again.
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-4 text-brand-text font-black text-xs uppercase hover:underline"
                >
                  Go Back
                </button>
                <button
                  onClick={() => handleReject(selectedRequest!.registrationId)}
                  className="flex-1 py-4 bg-red-600 text-white font-black text-xs uppercase rounded-2xl shadow-lg"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
