'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ChevronLeft, 
  Calendar, 
  BookOpen, 
  User, 
  CheckCircle2, 
  MessageSquare, 
  Eye, 
  AlertCircle, 
  ArrowRight,
  TrendingUp
} from 'lucide-react'

interface Homework {
  homeworkId: number
  title: string
  description: string
  subject: string
  className: string
  dueDate: string
  createdAt: string
  teacherName: string
}

interface FeedbackDetail {
  guardianName: string
  feedback: string
  feedbackDate: string
}

interface AnalyticsData {
  totalViews: number
  feedbackCount: number
  feedbackDetails: FeedbackDetail[]
}

export default function HomeworkDetailPage() {
  const [homework, setHomework] = useState<Homework | null>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<number | null>(null)
  const [viewedCount, setViewedCount] = useState<number>(0)
  
  // Inline Analytics for Teachers
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  
  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [hasSeen, setHasSeen] = useState(false)

  const params = useParams()
  const router = useRouter()
  const homeworkId = params.id as string

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = localStorage.getItem('token')
        const userDataStr = localStorage.getItem('user')
        
        if (!token || !userDataStr) {
          setError('Please login to view homework details')
          return
        }

        const userData = JSON.parse(userDataStr)
        setUserRole(userData.role)
        setUserId(userData.userId)

        // 1. Mark as viewed ONLY if guardian
        if (userData.role === 'guardian') {
          try {
            await fetch(`/api/homework/${homeworkId}/view`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            })
            setHasSeen(true)
          } catch (viewErr) {
            console.error('Failed to log view:', viewErr)
          }
        }

        // 2. Get homework details
        const response = await fetch(`/api/homework/${homeworkId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          setHomework(data.data.homework)
        } else {
          setError('Failed to fetch homework details')
          return
        }

        // 3. Get analytics/feedbacks if teacher/homeroom_teacher
        if (userData.role === 'teacher' || userData.role === 'homeroom_teacher') {
          const analyticsRes = await fetch(`/api/homework/${homeworkId}/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (analyticsRes.ok) {
            const analyticsData = await analyticsRes.json()
            setAnalytics(analyticsData.data.analytics)
          }
        }
      } catch (err) {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [homeworkId])

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingFeedback(true)
    setToast(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setToast({ message: 'Authentication required. Please login again.', type: 'error' })
        return
      }

      const response = await fetch(`/api/homework/${homeworkId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ feedback })
      })

      const data = await response.json()

      if (data.success) {
        setFeedback('')
        setToast({ message: 'Feedback submitted successfully to the teacher!', type: 'success' })
      } else {
        setToast({ message: data.message || 'Failed to submit feedback', type: 'error' })
      }
    } catch (err) {
      setToast({ message: 'Network error. Please check your connection.', type: 'error' })
    } finally {
      setSubmittingFeedback(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-primary"></div>
        <p className="text-brand-text font-bold text-sm">Retrieving assignment details...</p>
      </div>
    )
  }

  if (error || !homework) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-brand-white rounded-[2.5rem] border border-brand-100 shadow-xl p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-black text-brand-heading mb-2">Error Loading Assignment</h3>
        <p className="text-brand-text font-bold text-sm mb-6">{error || 'Homework not found'}</p>
        <button
          onClick={() => router.push('/dashboard/homework')}
          className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold text-xs uppercase"
        >
          Go Back
        </button>
      </div>
    )
  }

  const isOverdue = new Date(homework.dueDate) < new Date()

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100] max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`rounded-2xl shadow-2xl border-2 p-5 flex items-start gap-4 ${
            toast.type === 'success' 
              ? 'bg-white border-brand-success text-brand-heading' 
              : 'bg-white border-red-500 text-brand-heading'
          }`}>
            <div className={`p-2.5 rounded-xl shadow-inner ${
              toast.type === 'success' ? 'bg-brand-success/10 text-brand-success' : 'bg-red-50 text-red-500'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-tight">
                {toast.type === 'success' ? 'Success' : 'Error'}
              </h4>
              <p className="text-brand-text font-semibold text-xs mt-1 leading-relaxed">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header section */}
      <header className="bg-brand-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-brand-primary/5 border border-brand-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <button
            onClick={() => router.push('/dashboard/homework')}
            className="group flex items-center gap-1.5 text-brand-text hover:text-brand-primary transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to homework
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-brand-accent/15 text-brand-primary font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-wider border border-brand-accent/25">
              {homework.subject}
            </span>
            <span className="bg-brand-bg text-brand-text font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-wider border border-brand-100">
              Class: {homework.className}
            </span>
            {userRole === 'guardian' && hasSeen && (
              <span className="bg-brand-success/15 text-brand-success font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-wider border border-brand-success/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Viewed
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black text-brand-heading leading-tight pt-1">
            {homework.title}
          </h1>
        </div>
        
        {(userRole === 'teacher' || userRole === 'homeroom_teacher') && (
          <button
            onClick={() => router.push(`/dashboard/homework/${homeworkId}/analytics`)}
            className="relative z-10 self-start md:self-center flex items-center gap-2 bg-brand-primary hover:bg-brand-secondary text-white px-6 py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            View Full Analytics
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Assignment Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-brand-white rounded-[2.5rem] shadow-xl shadow-brand-primary/5 p-8 md:p-10 border border-brand-100 space-y-6">
            <h2 className="text-2xl font-black text-brand-heading border-b border-brand-100 pb-4">
              Assignment Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-brand-bg p-5 rounded-2xl border border-brand-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-white rounded-xl flex items-center justify-center text-brand-primary shadow-sm border border-brand-100">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-brand-text uppercase tracking-widest">Teacher</h4>
                  <p className="font-bold text-brand-heading mt-0.5 text-sm">{homework.teacherName}</p>
                </div>
              </div>

              <div className="bg-brand-bg p-5 rounded-2xl border border-brand-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-white rounded-xl flex items-center justify-center text-brand-primary shadow-sm border border-brand-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-brand-text uppercase tracking-widest">Due Date</h4>
                  <p className={`font-bold mt-0.5 text-sm ${isOverdue ? 'text-red-600 font-extrabold' : 'text-brand-heading'}`}>
                    {new Date(homework.dueDate).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-black text-brand-text uppercase tracking-widest ml-1">
                Homework Description
              </h4>
              <div className="bg-brand-bg p-6 rounded-3xl border border-brand-100 prose max-w-none text-brand-heading font-semibold text-sm leading-relaxed whitespace-pre-wrap">
                {homework.description}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Role Dependent Card */}
        <div className="lg:col-span-1">
          {userRole === 'guardian' ? (
            /* Guardian Feedback Card */
            <div className="bg-brand-white rounded-[2.5rem] shadow-xl shadow-brand-primary/5 p-8 border border-brand-100 space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-brand-heading">
                  Parent Verification
                </h3>
                <p className="text-brand-text font-bold text-xs leading-relaxed">
                  Provide optional feedback or verification comments to the teacher regarding this assignment.
                </p>
              </div>

              <form onSubmit={handleFeedback} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest ml-1">
                    Feedback Comment
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={5}
                    className="w-full bg-brand-bg border border-brand-100 rounded-2xl p-4 text-brand-heading font-bold placeholder-brand-text/40 outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary focus:bg-brand-white transition-all text-sm"
                    placeholder="Enter any comments, observations, or queries regarding this homework..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingFeedback || !feedback.trim()}
                  className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-black text-xs uppercase tracking-widest py-4.5 rounded-2xl transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </div>
          ) : (
            /* Teacher Inline Analytics Card */
            <div className="bg-brand-white rounded-[2.5rem] shadow-xl shadow-brand-primary/5 p-8 border border-brand-100 space-y-6">
              <div className="space-y-1 pb-2 border-b border-brand-100">
                <h3 className="text-xl font-black text-brand-heading">
                  Live Response
                </h3>
                <p className="text-brand-text font-bold text-xs">
                  Parent engagement overview for this homework.
                </p>
              </div>

              {analytics ? (
                <div className="space-y-6">
                  {/* Mini stats cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-brand-bg p-4.5 rounded-2xl border border-brand-100 text-center">
                      <div className="w-8 h-8 bg-brand-white rounded-lg flex items-center justify-center text-brand-primary mx-auto mb-2 shadow-sm border border-brand-100">
                        <Eye className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-xl font-black text-brand-heading">{analytics.totalViews}</div>
                      <div className="text-[10px] font-black text-brand-text uppercase tracking-wider mt-0.5">Views</div>
                    </div>

                    <div className="bg-brand-bg p-4.5 rounded-2xl border border-brand-100 text-center">
                      <div className="w-8 h-8 bg-brand-white rounded-lg flex items-center justify-center text-brand-primary mx-auto mb-2 shadow-sm border border-brand-100">
                        <MessageSquare className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-xl font-black text-brand-heading">{analytics.feedbackCount}</div>
                      <div className="text-[10px] font-black text-brand-text uppercase tracking-wider mt-0.5">Feedbacks</div>
                    </div>
                  </div>

                  {/* Feedback summary feed */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] font-black text-brand-text uppercase tracking-widest ml-1">
                      Recent Feedbacks
                    </h4>

                    {analytics.feedbackDetails.length === 0 ? (
                      <div className="bg-brand-bg rounded-2xl p-5 border border-brand-100 text-center text-brand-text/60 font-semibold text-xs py-8">
                        No feedback response received yet.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                        {analytics.feedbackDetails.slice(0, 3).map((fb, i) => (
                          <div key={i} className="bg-brand-bg rounded-2xl p-4 border border-brand-100 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-brand-heading text-xs truncate">
                                {fb.guardianName}
                              </span>
                              <span className="text-[10px] font-bold text-brand-text/60 flex-shrink-0">
                                {new Date(fb.feedbackDate).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-brand-text font-medium text-xs leading-relaxed line-clamp-2">
                              {fb.feedback}
                            </p>
                          </div>
                        ))}
                        {analytics.feedbackDetails.length > 3 && (
                          <button
                            onClick={() => router.push(`/dashboard/homework/${homeworkId}/analytics`)}
                            className="w-full text-center text-xs font-black text-brand-primary hover:underline"
                          >
                            View all {analytics.feedbackDetails.length} responses
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
