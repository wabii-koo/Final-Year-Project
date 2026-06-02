"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Check,
  X,
  ArrowLeft,
  User,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";

interface ReportCard {
  reportcardId: number;
  studentId: number;
  term: string;
  academicYear: string;
  filledAt: string;
  status: string;
  subjectsGrades: any;
  teacherComments: string;
  conductGrade?: string;
  overallGrade?: string;
  student: {
    fullName: string;
  };
  teacher: {
    fullName: string;
  };
}

const SUBJECTS = ["English", "Mathematics", "Science", "Amharic"];

const GRADE_DESCRIPTIONS: Record<string, string> = {
  "A+": "Outstanding / Exceptional",
  A: "Excellent",
  "A-": "Very Excellent",
  "A−": "Very Excellent",
  "B+": "Very Good",
  B: "Good",
  "B-": "Fairly Good",
  "B−": "Fairly Good",
  "C+": "Above Average Pass",
  C: "Average Pass",
  "C-": "Minimum Average Pass",
  "C−": "Minimum Average Pass",
  D: "Minimum Pass",
  F: "Fail",
};

const parseSubjectGrade = (value: string) => {
  if (!value) return { score: "", grade: "A" };
  const match = value.match(/^(\d+)\s*\(([^)]+)\)$/);
  if (match) {
    return { score: match[1], grade: match[2] };
  }
  return { score: "", grade: value };
};

export default function PendingReportCardsPage() {
  const router = useRouter();
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedReportCard, setSelectedReportCard] =
    useState<ReportCard | null>(null);
  const [formSubjectData, setFormSubjectData] = useState<
    Record<string, { score: string; grade: string }>
  >({});
  const [formConduct, setFormConduct] = useState("");
  const [formOverall, setFormOverall] = useState("");
  const [formComments, setFormComments] = useState("");

  const openReviewModal = (rc: ReportCard) => {
    setSelectedReportCard(rc);

    const parsedGrades: Record<string, { score: string; grade: string }> = {};
    SUBJECTS.forEach((subject) => {
      const val = rc.subjectsGrades?.[subject] || "";
      parsedGrades[subject] = parseSubjectGrade(val);
    });
    setFormSubjectData(parsedGrades);

    setFormConduct(rc.conductGrade || "Excellent");
    setFormComments(rc.teacherComments || "");

    // Calculate average on load if scores exist
    const scores = Object.values(parsedGrades)
      .map((d) => d.score)
      .filter((s) => s !== "")
      .map((s) => parseInt(s, 10))
      .filter((s) => !isNaN(s));

    const getLetterGradeFromScore = (scoreVal: number): string => {
      if (scoreVal >= 90) return "A+";
      if (scoreVal >= 85) return "A";
      if (scoreVal >= 80) return "A-";
      if (scoreVal >= 75) return "B+";
      if (scoreVal >= 70) return "B";
      if (scoreVal >= 65) return "B-";
      if (scoreVal >= 60) return "C+";
      if (scoreVal >= 50) return "C";
      if (scoreVal >= 45) return "C-";
      if (scoreVal >= 40) return "D";
      return "F";
    };

    if (scores.length > 0) {
      const average = Math.round(
        scores.reduce((sum, val) => sum + val, 0) / scores.length,
      );
      const calculatedOverall = getLetterGradeFromScore(average);
      setFormOverall(`${average} (${calculatedOverall})`);
    } else {
      setFormOverall(rc.overallGrade || "");
    }

    setShowModal(true);
  };

  const handleModalApprove = async () => {
    if (!selectedReportCard) return;
    const id = selectedReportCard.reportcardId;
    setShowModal(false);
    await handleApprove(id);
  };

  const handleModalReject = async () => {
    if (!selectedReportCard) return;
    const reason = prompt(
      "Please enter the reason for revision / what is incorrect:",
    );
    if (reason === null) return;
    const id = selectedReportCard.reportcardId;
    setShowModal(false);
    await handleReject(id, reason);
  };

  useEffect(() => {
    fetchPendingReportCards();
  }, []);

  const fetchPendingReportCards = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/admin/report-cards/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setReportCards(data.data);
      } else {
        setError(data.message || "Failed to fetch report cards");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm("Are you sure you want to endorse this report card?")) return;

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(
        `${apiUrl}/api/admin/report-cards/${id}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        setSuccess("Report card endorsed successfully!");
        setReportCards((prev) => prev.filter((rc) => rc.reportcardId !== id));
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to approve report card");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleReject = async (id: number, reason: string = "") => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/report-cards/${id}/reject`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess("Report card sent back for revision.");
        setReportCards((prev) => prev.filter((rc) => rc.reportcardId !== id));
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to reject report card");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Endorse Report Cards
            </h1>
            <p className="text-gray-600 mt-1">
              Review and approve academic findings submitted by homeroom
              teachers.
            </p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold">
            {reportCards.length} Pending
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <Check className="h-5 w-5 text-green-400" />
              <p className="ml-3 text-green-700">{success}</p>
            </div>
          </div>
        )}

        {reportCards.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              No Pending Report Cards
            </h3>
            <p className="text-gray-600 mt-2">
              All submitted report cards have been processed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reportCards.map((rc) => (
              <div
                key={rc.reportcardId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                        <User className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {rc.student?.fullName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {rc.term} - {rc.academicYear}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Submitted:{" "}
                            {new Date(rc.filledAt).toLocaleDateString()}
                          </span>
                          <span className="text-blue-600 font-medium">
                            By: {rc.teacher?.fullName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openReviewModal(rc)}
                        className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 duration-150"
                      >
                        Review details
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                      Teacher Comments:
                    </h4>
                    <p className="text-gray-600 italic">
                      "{rc.teacherComments || "No comments provided."}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAILED GRADE REVIEW MODAL */}
      {showModal && selectedReportCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowModal(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Review Report Card
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase mt-1">
                  Student:{" "}
                  {selectedReportCard.student?.fullName || "Unknown Student"}
                </p>
              </div>
              <button
                aria-label="button"
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <p className="text-xs font-bold">
                  Please inspect the grades below and choose to Endorse or
                  Request Revision.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Term */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Academic Term
                  </label>
                  <input
                    aria-label="Academic Term"
                    type="text"
                    value={selectedReportCard.term}
                    disabled
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-950 outline-none"
                  />
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Academic Year
                  </label>
                  <input
                    aria-label="Academic Year"
                    type="text"
                    value={selectedReportCard.academicYear}
                    disabled
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-950 outline-none"
                  />
                </div>
              </div>

              {/* Subjects & Grades */}
              <div>
                <h4 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                  Subject Performance (Score & Grade)
                </h4>
                <div className="space-y-3">
                  {SUBJECTS.map((subject) => (
                    <div
                      key={subject}
                      className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 gap-3"
                    >
                      <span className="text-xs font-bold text-gray-800">
                        {subject}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">
                            Score:
                          </span>
                          <span className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-800 min-w-[3rem] text-center">
                            {formSubjectData[subject]?.score || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">
                            Grade:
                          </span>
                          <span
                            className="bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 min-w-[3.5rem] text-center"
                            title={
                              GRADE_DESCRIPTIONS[
                                formSubjectData[subject]?.grade
                              ] || ""
                            }
                          >
                            {formSubjectData[subject]?.grade || "—"}
                          </span>
                          {GRADE_DESCRIPTIONS[
                            formSubjectData[subject]?.grade
                          ] && (
                            <span
                              className="text-[10px] text-gray-500 font-bold italic max-w-[150px] truncate"
                              title={
                                GRADE_DESCRIPTIONS[
                                  formSubjectData[subject]?.grade
                                ]
                              }
                            >
                              {
                                GRADE_DESCRIPTIONS[
                                  formSubjectData[subject]?.grade
                                ]
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Behavior & Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Conduct */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Conduct Grade
                  </label>
                  <input
                    aria-label="Conduct Grade"
                    type="text"
                    value={formConduct}
                    disabled
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-950 outline-none"
                  />
                </div>

                {/* Overall */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Overall Term Grade
                  </label>
                  <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-blue-600 flex items-center justify-between">
                    <span className="text-gray-400 font-normal">
                      Calculated Average:
                    </span>
                    <span className="bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-lg text-sm font-bold">
                      {formOverall || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-3 border border-gray-200 text-gray-500 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleModalReject}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <X className="h-4 w-4" />
                Request Revision
              </button>
              <button
                type="button"
                onClick={handleModalApprove}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Check className="h-4 w-4" />
                Endorse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
