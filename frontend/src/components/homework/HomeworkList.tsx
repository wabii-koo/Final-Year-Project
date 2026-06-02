"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import {
  BookOpen,
  Calendar,
  Clock,
  User,
  Eye,
  MessageSquare,
  Search,
  CheckCircle2,
  AlertCircle,
  Filter,
  Plus,
} from "lucide-react";

interface Homework {
  homeworkId: number;
  title: string;
  description: string;
  subject: string;
  className: string;
  dueDate: string;
  createdAt: string;
  isActive: boolean;
  teacherName: string;
  viewCount?: number;
  feedbackCount?: number;
  isSeen?: boolean;
}

interface HomeworkListProps {
  role: "teacher" | "homeroom_teacher" | "guardian";
  userId?: number;
  classId?: number;
}

export default function HomeworkList({
  role,
  userId,
  classId,
}: HomeworkListProps) {
  const router = useRouter();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All"); // 'All', 'Active', 'Overdue'

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please login to view homework");
          return;
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        let url = `${apiUrl}/api/homework`;
        if (role === "teacher" && userId) {
          url += `?teacherId=${userId}`;
        } else if (role === "homeroom_teacher" && classId) {
          url += `?classId=${classId}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHomework(data.data.homework || []);
        } else {
          setError("Failed to fetch homework");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, [role, userId, classId]);

  const handleCreateHomework = () => {
    router.push("/dashboard/homework/create");
  };

  const handleViewHomework = (homeworkId: number) => {
    router.push(`/dashboard/homework/${homeworkId}`);
  };

  const handleAnalytics = (homeworkId: number) => {
    router.push(`/dashboard/homework/${homeworkId}/analytics`);
  };

  // Derived filter categories
  const subjects = [
    "All",
    ...Array.from(new Set(homework.map((hw) => hw.subject))),
  ];

  // Filter logic
  const filteredHomework = homework.filter((hw) => {
    const matchesSearch =
      hw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hw.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hw.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject =
      selectedSubject === "All" || hw.subject === selectedSubject;

    const isOverdue = new Date(hw.dueDate) < new Date();
    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Active" && !isOverdue) ||
      (selectedStatus === "Overdue" && isOverdue);

    return matchesSearch && matchesSubject && matchesStatus;
  });

  const isCreatorRole = role === "teacher" || role === "homeroom_teacher";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-primary"></div>
        <p className="text-brand-text font-bold text-sm">
          Retrieving assignments...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title Header area */}
      <header className="bg-brand-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-brand-primary/5 border border-brand-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-brand-accent/15 text-brand-primary rounded-full text-xs font-black uppercase tracking-widest mb-3">
            {role === "teacher"
              ? "Teacher Portal"
              : role === "homeroom_teacher"
                ? "Homeroom Portal"
                : "Guardian Portal"}
          </span>
          <h1 className="text-3xl font-black text-brand-heading leading-tight">
            {role === "teacher"
              ? "My Homework"
              : role === "homeroom_teacher"
                ? "Class Homework"
                : "Homework Assignments"}
          </h1>
          <p className="mt-2 text-brand-text font-semibold text-sm max-w-xl">
            {role === "teacher"
              ? "Manage assignments, set objectives, and check live parental feedback."
              : role === "homeroom_teacher"
                ? "View and monitor homework assignments scheduled for your class."
                : "Review homework details and submit home verification for your children."}
          </p>
        </div>
        {isCreatorRole && (
          <button
            onClick={handleCreateHomework}
            className="relative z-10 self-start md:self-center flex items-center gap-2 bg-brand-primary hover:bg-brand-secondary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Homework
          </button>
        )}
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-bold text-sm">{error}</span>
        </div>
      )}

      {/* Filters & Search Controls */}
      <div className="bg-brand-white p-6 rounded-[2rem] border border-brand-100 shadow-xl shadow-brand-primary/5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brand-text/40 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, subject or description..."
              className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 pl-12 pr-6 text-brand-heading font-bold placeholder-brand-text/40 outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Select */}
          <div className="w-full lg:w-48 relative">
            <select
              aria-label="Status Filter"
              className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 px-6 text-brand-heading font-black text-xs uppercase tracking-wider outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary appearance-none cursor-pointer"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Overdue">Overdue</option>
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Filter className="w-4 h-4 text-brand-text/50" />
            </div>
          </div>
        </div>

        {/* Subject Filter Pills */}
        {subjects.length > 2 && (
          <div className="pt-2">
            <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest mb-2 ml-1">
              Filter by Subject
            </label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedSubject === subj
                      ? "bg-brand-primary text-white shadow-md shadow-brand-primary/10"
                      : "bg-brand-bg text-brand-text hover:bg-brand-50 border border-brand-100"
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Homework Grid/Cards */}
      {filteredHomework.length === 0 ? (
        <div className="bg-brand-white rounded-[2.5rem] shadow-xl shadow-brand-primary/5 border border-brand-100 p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto">
          <div className="w-20 h-20 bg-brand-bg rounded-[2rem] flex items-center justify-center text-brand-primary mb-6 shadow-inner">
            <BookOpen className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-brand-heading mb-3">
            {searchQuery ||
            selectedSubject !== "All" ||
            selectedStatus !== "All"
              ? "No Results Match Filters"
              : role === "guardian"
                ? "No Homework Available"
                : "No Assignments Scheduled"}
          </h3>
          <p className="text-brand-text font-semibold text-sm max-w-sm leading-relaxed">
            {searchQuery ||
            selectedSubject !== "All" ||
            selectedStatus !== "All"
              ? "Try widening your search terms or resetting filters."
              : role === "guardian"
                ? "Your child has no pending homework assignments from their teachers."
                : role === "teacher"
                  ? "Create your first assignment and share it with parent guardians."
                  : "No homework has been assigned to your class yet."}
          </p>
          {isCreatorRole &&
            !searchQuery &&
            selectedSubject === "All" &&
            selectedStatus === "All" && (
              <Button onClick={handleCreateHomework} className="mt-6">
                Create Assignment
              </Button>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredHomework.map((hw) => {
            const isOverdue = new Date(hw.dueDate) < new Date();

            return (
              <div
                key={hw.homeworkId}
                className="bg-brand-white rounded-[2rem] shadow-xl shadow-brand-primary/5 p-6 md:p-8 border border-brand-100 flex flex-col justify-between hover:border-brand-primary/20 hover:scale-[1.02] active:scale-[0.99] transition-all group cursor-pointer"
                onClick={() => {
                  if (role === "guardian") {
                    handleViewHomework(hw.homeworkId);
                  } else {
                    handleAnalytics(hw.homeworkId);
                  }
                }}
              >
                <div>
                  {/* Card Header badges */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-brand-accent/15 text-brand-primary font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-wider border border-brand-accent/25">
                      {hw.subject}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${
                        isOverdue
                          ? "bg-red-50 text-red-600 border border-red-100"
                          : "bg-brand-success/15 text-brand-success border border-brand-success/20"
                      }`}
                    >
                      {isOverdue ? "Overdue" : "Active"}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-black text-brand-heading group-hover:text-brand-primary transition-colors leading-snug mb-3">
                    {hw.title}
                  </h3>

                  <p className="text-brand-text font-semibold text-xs leading-relaxed line-clamp-3 mb-6">
                    {hw.description}
                  </p>
                </div>

                {/* Details Section */}
                <div className="border-t border-brand-100 pt-5 space-y-3.5">
                  <div className="flex items-center gap-2.5 text-brand-text font-bold text-xs">
                    <Clock className="w-4 h-4 text-brand-primary" />
                    <span>Due: {new Date(hw.dueDate).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-brand-text font-bold text-xs">
                    <BookOpen className="w-4 h-4 text-brand-primary" />
                    <span>Class: {hw.className}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-brand-text font-bold text-xs">
                    <User className="w-4 h-4 text-brand-primary" />
                    <span>By: {hw.teacherName}</span>
                  </div>

                  {/* Role Specific Info & Actions */}
                  <div className="pt-4 border-t border-brand-100 flex items-center justify-between gap-4 mt-2">
                    {role === "guardian" ? (
                      <div>
                        {hw.isSeen ? (
                          <span className="inline-flex items-center gap-1 bg-brand-success/15 text-brand-success px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-brand-success/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Viewed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-100 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            New Assignment
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="bg-brand-bg rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-[11px] text-brand-heading font-black">
                          <Eye className="w-3.5 h-3.5 text-brand-primary" />
                          <span>{hw.viewCount || 0}</span>
                        </div>
                        <div className="bg-brand-bg rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-[11px] text-brand-heading font-black">
                          <MessageSquare className="w-3.5 h-3.5 text-brand-primary" />
                          <span>{hw.feedbackCount || 0}</span>
                        </div>
                      </div>
                    )}

                    <button
                      className="bg-brand-primary hover:bg-brand-secondary text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-primary/10 group-hover:translate-x-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (role === "guardian") {
                          handleViewHomework(hw.homeworkId);
                        } else {
                          handleAnalytics(hw.homeworkId);
                        }
                      }}
                    >
                      {role === "guardian" ? "Open" : "Analytics"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
