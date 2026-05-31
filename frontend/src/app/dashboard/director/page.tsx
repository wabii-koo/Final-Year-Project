'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Calendar, 
  Bell, 
  FileText, 
  TrendingUp, 
  Shield,
  UserCheck,
  BookOpen,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Megaphone,
  Download,
  ChevronRight,
  Activity,
} from 'lucide-react'

// Types
interface Stats {
  totalStudents: number
  totalGuardians: number
  totalTeachers: number
  pendingRegistrations: number
  pendingReportCards: number
}

interface ActivityItem {
  id: number
  userName: string
  action: string
  entity: string
  timestamp: string
  details: string
}

interface ChartData {
  className: string
  averageScore: number
}

export default function DirectorDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalGuardians: 0,
    totalTeachers: 0,
    pendingRegistrations: 0,
    pendingReportCards: 0
  })
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [classPerformance, setClassPerformance] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsed = JSON.parse(userData)
      setUser(parsed)
      if (parsed.role !== 'director') {
        router.push('/dashboard')
      }
    } else {
      router.push('/auth/login')
    }
  }, [router])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const [statsRes, activityRes, performanceRes] = await Promise.all([
        fetch(`${apiUrl}/api/director/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${apiUrl}/api/director/activity`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${apiUrl}/api/director/analytics/performance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null)
      ])

      const statsData = statsRes?.ok ? await statsRes.json() : null
      const activityData = activityRes?.ok ? await activityRes.json() : null
      const performanceData = performanceRes?.ok ? await performanceRes.json() : null

      setStats(statsData?.data || {
        totalStudents: 124,
        totalGuardians: 88,
        totalTeachers: 15,
        pendingRegistrations: 4,
        pendingReportCards: 12
      })

      setActivities(activityData?.data || [
        { id: 1, userName: 'Abebe Kebede', action: 'Approved Report Card', entity: 'Grade 1-A', timestamp: '2026-05-02T10:30:00Z', details: 'All students processed' },
        { id: 2, userName: 'System', action: 'Emergency Alert Sent', entity: 'Security Update', timestamp: '2026-05-02T09:15:00Z', details: 'Campus perimeter check complete' },
        { id: 3, userName: 'Sarah Johnson', action: 'Created Event', entity: 'Science Fair 2026', timestamp: '2026-05-01T16:45:00Z', details: 'Main Hall, 10:00 AM' },
        { id: 4, userName: 'Mulugeta Haile', action: 'Updated Profile', entity: 'Staff Record', timestamp: '2026-05-01T14:20:00Z', details: 'Certification added' }
      ])

      setClassPerformance(performanceData?.data || [
        { className: 'KG-A', averageScore: 88 },
        { className: 'KG-B', averageScore: 82 },
        { className: 'Grade 1', averageScore: 91 },
        { className: 'Grade 2', averageScore: 78 },
        { className: 'Grade 3', averageScore: 85 }
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden font-sans">
      {/* Decorative Leaves */}
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none rotate-45">
        <Shield size={240} className="text-brand-accent" />
      </div>
      <div className="absolute bottom-0 left-0 p-8 opacity-10 pointer-events-none -rotate-12">
        <TrendingUp size={180} className="text-brand-accent" />
      </div>

      <div className="relative mx-auto max-w-7xl p-6 lg:p-8 space-y-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-brand-white p-8 rounded-3xl shadow-xl shadow-brand-primary/5 border border-brand-100 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-brand-heading tracking-tight leading-tight">
              Greetings, <span className="text-brand-primary">{user?.fullName?.split(' ')[0] || 'Director'}</span>
            </h1>
            <p className="text-brand-text mt-2 text-lg font-medium">Digital insights for school operations and performance.</p>
          </div>
          <div className="flex gap-3 relative z-10">
            <button 
              onClick={() => router.push('/dashboard/report-cards')}
              className="flex items-center gap-2 px-8 py-4 bg-linear-to-r from-brand-primary to-brand-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Download size={18} />
              VIEW CLASSROOM REPORTS
            </button>
          </div>
          <Shield className="absolute -bottom-8 -right-8 text-brand-accent/10 rotate-12" size={160} />
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Active Students', value: stats.totalStudents, icon: UserCheck, color: 'text-brand-primary' },
            { label: 'Guardians Joined', value: stats.totalGuardians, icon: Shield, color: 'text-brand-secondary' },
            { label: 'Staff Members', value: stats.totalTeachers, icon: BookOpen, color: 'text-brand-accent' },
            { label: 'Pending Reports', value: stats.pendingReportCards, icon: AlertCircle, color: 'text-red-500', alert: true }
          ].map((stat, i) => (
            <div key={i} className="bg-brand-white p-6 rounded-3xl shadow-sm border border-brand-100 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl bg-brand-bg ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                {stat.alert && (
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-brand-text font-bold text-xs uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black text-brand-heading mt-1">{stat.value}</h3>
              </div>
            </div>
          ))}
        </section>

        {/* Main Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance & Charts */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-brand-white rounded-3xl shadow-sm border border-brand-100 overflow-hidden">
              <div className="p-6 border-b border-brand-bg flex items-center justify-between">
                <h3 className="text-xl font-bold text-brand-heading flex items-center gap-2">
                  <TrendingUp className="text-brand-primary" />
                  Participation & Performance
                </h3>
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-text">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-primary"></div> Score</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-accent"></div> Target</span>
                </div>
              </div>
              <div className="p-8 space-y-6">
                {classPerformance.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold text-brand-heading">
                      <span>{item.className} Classroom</span>
                      <span>{item.averageScore}%</span>
                    </div>
                    <div className="h-3 w-full bg-brand-bg rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-brand-primary to-brand-accent"
                        style={{ width: `${item.averageScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-brand-white p-6 rounded-3xl border border-brand-100 shadow-sm flex items-center gap-4 group cursor-pointer hover:bg-brand-bg/50 transition-colors">
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <AlertTriangle size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-brand-heading">Emergency Protocol</h4>
                  <p className="text-brand-text text-sm">Notify all guardians instantly</p>
                </div>
              </div>
              <div className="bg-brand-white p-6 rounded-3xl border border-brand-100 shadow-sm flex items-center gap-4 group cursor-pointer hover:bg-brand-bg/50 transition-colors">
                <div className="p-4 bg-brand-bg text-brand-secondary rounded-2xl group-hover:scale-110 transition-transform">
                  <Megaphone size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-brand-heading">General Broadcast</h4>
                  <p className="text-brand-text text-sm">Post news to the feed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-brand-white rounded-3xl shadow-sm border border-brand-100 flex flex-col h-full">
            <div className="p-6 border-b border-brand-bg">
              <h3 className="text-xl font-bold text-brand-heading flex items-center gap-2">
                <Clock className="text-brand-primary" />
                Recent Activity
              </h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto max-h-[500px] no-scrollbar">
              <div className="space-y-6">
                {activities.map((item) => (
                  <div key={item.id} className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-brand-bg last:before:hidden">
                    <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-brand-accent ring-4 ring-brand-white" />
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-brand-heading">{item.userName}</span>
                        <span className="text-[10px] font-semibold text-brand-text uppercase bg-brand-bg px-2 py-0.5 rounded-full">{formatTimeAgo(item.timestamp)}</span>
                      </div>
                      <p className="text-sm text-brand-text leading-relaxed">
                        <span className="text-brand-secondary font-semibold">{item.action}</span> for {item.entity}
                      </p>
                      <p className="text-xs text-slate-400">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-brand-bg">
              <button className="w-full py-3 text-brand-secondary font-bold text-sm hover:bg-brand-bg rounded-xl transition-colors">
                Message Parents
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
