'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ChevronLeft, 
  Download, 
  Eye, 
  MessageSquare, 
  Clock, 
  User, 
  AlertCircle, 
  Calendar,
  FileDown
} from 'lucide-react'
import { Button } from '../../../../../components/ui/Button'

interface HomeworkAnalytics {
  totalViews: number
  feedbackCount: number
  viewDetails: Array<{
    guardianName: string
    viewedAt: string
  }>
  feedbackDetails: Array<{
    guardianName: string
    feedback: string
    feedbackDate: string
  }>
}

export default function HomeworkAnalyticsPage() {
  const [analytics, setAnalytics] = useState<HomeworkAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
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
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Please login to view analytics')
          return
        }

        const response = await fetch(`/api/homework/${homeworkId}/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setAnalytics(data.data.analytics)
        } else {
          setError('Failed to fetch analytics. Make sure you are the creator or homeroom teacher.')
        }
      } catch (err) {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [homeworkId])

  const handleExport = async () => {
    setExporting(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please login to export data')
        setExporting(false)
        return
      }

      const response = await fetch(`/api/homework/export?homeworkId=${homeworkId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data.data.homework, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `homework-${homeworkId}-analytics.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        setToast({ message: 'Analytics export completed successfully!', type: 'success' })
      } else {
        setToast({ message: 'Failed to export analytics data.', type: 'error' })
      }
    } catch (err) {
      setToast({ message: 'Network error during export.', type: 'error' })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-primary"></div>
        <p className="text-brand-text font-bold text-sm">Loading engagement reports...</p>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-brand-white rounded-[2.5rem] border border-brand-100 shadow-xl p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-black text-brand-heading mb-2">Access Denied / Error</h3>
        <p className="text-brand-text font-bold text-sm mb-6">{error || 'Analytics not available'}</p>
        <button
          onClick={() => router.push('/dashboard/homework')}
          className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold text-xs uppercase"
        >
          Back to Homework
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Toast popup */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100] max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-brand-success p-5 flex items-start gap-4 text-brand-heading">
            <div className="p-2.5 rounded-xl shadow-inner bg-brand-success/10 text-brand-success">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-tight">Export Complete</h4>
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
          <h1 className="text-3xl font-black text-brand-heading leading-tight">
            Engagement Analytics
          </h1>
          <p className="text-brand-text font-semibold text-sm max-w-xl">
            Monitor which parent guardians have opened the assignment and review verification notes.
          </p>
        </div>

        <div className="flex gap-3 relative z-10">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-3.5 bg-brand-white text-brand-primary hover:bg-brand-50 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md border border-brand-100 transition-all active:scale-95 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export JSON'}
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Total Views Card */}
        <div className="bg-brand-white rounded-[2.5rem] p-8 border border-brand-100 shadow-xl shadow-brand-primary/5 flex items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-primary shadow-inner">
            <Eye className="w-8 h-8" />
          </div>
          <div>
            <div className="text-4xl font-black text-brand-heading leading-none">
              {analytics.totalViews}
            </div>
            <div className="text-xs font-black text-brand-text uppercase tracking-widest mt-1.5">
              Total Guardian Views
            </div>
          </div>
        </div>

        {/* Total Feedback Card */}
        <div className="bg-brand-white rounded-[2.5rem] p-8 border border-brand-100 shadow-xl shadow-brand-primary/5 flex items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-primary shadow-inner">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <div className="text-4xl font-black text-brand-heading leading-none">
              {analytics.feedbackCount}
            </div>
            <div className="text-xs font-black text-brand-text uppercase tracking-widest mt-1.5">
              Feedback Responses
            </div>
          </div>
        </div>

      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: View Logs */}
        <div className="bg-brand-white rounded-[2.5rem] border border-brand-100 shadow-xl shadow-brand-primary/5 p-8 flex flex-col h-full">
          <h3 className="text-xl font-black text-brand-heading mb-6 pb-4 border-b border-brand-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-primary" />
            Guardian Open History
          </h3>

          {analytics.viewDetails.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-brand-text/60">
              <Eye className="w-12 h-12 text-brand-text/30 mb-4" />
              <p className="font-bold text-sm">No views recorded yet.</p>
              <p className="text-xs max-w-[240px] mt-1 leading-relaxed">
                Parents will appear in this timeline as soon as they view this assignment.
              </p>
            </div>
          ) : (
            <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {analytics.viewDetails.map((view, index) => {
                const initials = view.guardianName ? view.guardianName.split(' ').map(n => n[0]).slice(0, 2).join('') : 'U'
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4.5 bg-brand-bg rounded-2xl border border-brand-100 hover:border-brand-primary/10 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold text-xs shadow-md">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-brand-heading text-sm truncate">{view.guardianName}</p>
                        <p className="text-[10px] font-bold text-brand-text/50 uppercase mt-0.5">Guardian</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-brand-text/70 text-xs font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                      <span>{new Date(view.viewedAt).toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Side: Feedbacks Log */}
        <div className="bg-brand-white rounded-[2.5rem] border border-brand-100 shadow-xl shadow-brand-primary/5 p-8 flex flex-col h-full">
          <h3 className="text-xl font-black text-brand-heading mb-6 pb-4 border-b border-brand-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-primary" />
            Verification Comments
          </h3>

          {analytics.feedbackDetails.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-brand-text/60">
              <MessageSquare className="w-12 h-12 text-brand-text/30 mb-4" />
              <p className="font-bold text-sm">No comments submitted.</p>
              <p className="text-xs max-w-[240px] mt-1 leading-relaxed">
                Feedback notes and signature alerts from guardians will be displayed here.
              </p>
            </div>
          ) : (
            <div className="flex-1 space-y-5 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {analytics.feedbackDetails.map((fb, index) => {
                const initials = fb.guardianName ? fb.guardianName.split(' ').map(n => n[0]).slice(0, 2).join('') : 'U'
                return (
                  <div key={index} className="space-y-2 border-b border-brand-100/60 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-brand-accent/20 text-brand-primary flex items-center justify-center font-black text-[10px] shadow-sm">
                          {initials}
                        </div>
                        <span className="font-bold text-brand-heading text-sm truncate">
                          {fb.guardianName}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-brand-text/50 uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(fb.feedbackDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="bg-brand-bg p-4 rounded-2xl border border-brand-100 text-brand-text font-semibold text-xs leading-relaxed">
                      {fb.feedback}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
