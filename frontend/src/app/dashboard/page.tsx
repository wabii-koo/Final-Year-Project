'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Bell, 
  Calendar, 
  BookOpen, 
  Car, 
  FileText, 
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Home,
  LogOut,
  Menu,
  Leaf,
  ChevronRight,
  TrendingUp
} from 'lucide-react'

interface UserType {
  userId: number
  email: string
  role: string
  fullName: string
}

interface Student {
  studentId: number
  fullName: string
  grade: string
  className: string
}

interface Notification {
  id: number
  message: string
  type: string
  createdAt: string
  isRead: boolean
}

interface Homework {
  homeworkId: number
  title: string
  subject: string
  className: string
  dueDate: string
  isActive: boolean
  teacherName: string
}

interface PickupRequest {
  id: number
  studentName: string
  authorizedPerson: string
  relationship: string
  pickupTime: string
  status: string
}

export default function GuardianDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [homework, setHomework] = useState<Homework[]>([])
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([])
  const [stats, setStats] = useState({
    totalNotifications: 0,
    unreadNotifications: 0,
    pendingHomework: 0,
    pendingPickups: 0
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }

    const parsed = JSON.parse(userData)
    setUser(parsed)

    if (parsed.role === 'director') {
      router.push('/dashboard/director')
      return
    } else if (parsed.role === 'registrar') {
      router.push('/dashboard/registrar')
      return
    } else if (parsed.role === 'homeroom_teacher' || parsed.role === 'teacher') {
      router.push('/dashboard/teacher')
      return
    }

    loadGuardianData(parsed.userId)
  }, [router])

  const loadGuardianData = async (guardianId: number) => {
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const [studentsRes, notificationsRes, homeworkRes, pickupRes] = await Promise.all([
        fetch(`${apiUrl}/api/students/my-children`, { headers }),
        fetch(`${apiUrl}/api/notifications`, { headers }),
        fetch(`${apiUrl}/api/homework`, { headers }),
        fetch(`${apiUrl}/api/pickup-requests`, { headers })
      ])

      if (studentsRes.ok) {
        const d = await studentsRes.json()
        setStudents(d.data?.students || d.data || [])
      }
      if (notificationsRes.ok) {
        const d = await notificationsRes.json()
        setNotifications(d.data?.notifications || [])
      }
      if (homeworkRes.ok) {
        const d = await homeworkRes.json()
        setHomework(d.data?.homework || [])
      }
      if (pickupRes.ok) {
        const d = await pickupRes.json()
        setPickupRequests(d.data?.pickupRequests || d.data || [])
      }

    } catch (error) {
      console.error('Error loading guardian data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setStats({
      totalNotifications: notifications.length,
      unreadNotifications: notifications.filter(n => !n.isRead).length,
      pendingHomework: homework.filter(h => h.isActive).length,
      pendingPickups: pickupRequests.filter(p => p.status === 'pending').length
    })
  }, [notifications, homework, pickupRequests])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="animate-pulse text-brand-primary font-black text-xl uppercase tracking-tighter">
          Loading Digital School...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden font-sans">
      <div className="relative mx-auto max-w-7xl p-6 lg:p-8 space-y-10">
        {/* Profile Header - Simplified */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-brand-white p-8 rounded-3xl shadow-xl shadow-brand-primary/5 border border-brand-100">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-brand-bg rounded-3xl flex items-center justify-center shadow-inner border border-brand-100 group">
              <User size={40} className="text-brand-primary group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-brand-heading tracking-tight">Welcome, {user?.fullName?.split(' ')[0]}!</h1>
              <p className="text-brand-text font-medium mt-1">Guardian of {students.map(s => s.fullName).join(' & ')}</p>
            </div>
          </div>
          <div className="flex gap-3">
             <Link href="/dashboard/pickup" className="px-6 py-3 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all">
                Request Pickup
             </Link>
          </div>
        </header>

        {/* Stats Section - Standard Corners */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Unread Alerts', value: stats.unreadNotifications, icon: Bell, color: 'text-brand-primary' },
            { label: 'Homework Due', value: stats.pendingHomework, icon: BookOpen, color: 'text-brand-secondary' },
            { label: 'Active Students', value: students.length, icon: TrendingUp, color: 'text-brand-accent' },
            { label: 'Pickup Status', value: stats.pendingPickups, icon: Car, color: 'text-brand-success' }
          ].map((stat, i) => (
            <div key={i} className="bg-brand-white p-6 rounded-3xl shadow-sm border border-brand-100 hover:shadow-md transition-all group overflow-hidden relative">
              <div className="flex items-center justify-between relative z-10">
                <div className={`p-3 rounded-2xl bg-brand-bg ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                {stat.value > 0 && (
                   <span className="bg-brand-bg px-3 py-1 rounded-full text-xs font-black uppercase text-brand-primary">Active</span>
                )}
              </div>
              <div className="mt-4 relative z-10">
                <p className="text-brand-text font-bold text-xs uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black text-brand-heading mt-1">{stat.value}</h3>
              </div>
              <Leaf size={80} className="absolute -bottom-4 -right-4 text-brand-accent/5 -rotate-12" />
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-8">
             {/* Student Cards */}
             <div className="bg-brand-white rounded-3xl shadow-xl shadow-brand-primary/5 border border-brand-100 p-8">
               <h3 className="text-2xl font-black text-brand-heading mb-6 flex items-center gap-3">
                 <CheckCircle className="text-brand-success" />
                 Active Student Monitoring
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {students.map((student, idx) => (
                    <div key={idx} className="bg-brand-bg p-6 rounded-2xl border border-brand-100 hover:border-brand-primary/20 transition-colors relative overflow-hidden group">
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                           <User size={24} className="text-brand-secondary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-brand-heading">{student.fullName}</h4>
                          <p className="text-xs text-brand-text font-semibold uppercase">{student.className}</p>
                        </div>
                      </div>
                      <div className="mt-6 flex items-center justify-between relative z-10">
                        <div className="text-xs font-bold text-brand-success bg-brand-success/10 px-3 py-1 rounded-full">PRESENT TODAY</div>
                        <Link href={`/dashboard/report-cards?student=${student.studentId}`} className="text-brand-primary hover:underline text-xs font-black uppercase flex items-center gap-1">
                          Reports <ChevronRight size={14} />
                        </Link>
                      </div>
                      <Leaf className="absolute top-2 right-2 text-brand-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" size={40} />
                    </div>
                  ))}
               </div>
             </div>

             {/* Recent Homework */}
             <div className="bg-brand-white rounded-3xl shadow-xl shadow-brand-primary/5 border border-brand-100 p-8">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-2xl font-black text-brand-heading flex items-center gap-3">
                   <BookOpen className="text-brand-primary" />
                   Homework Tracking
                 </h3>
                 <Link href="/dashboard/homework" className="text-brand-primary font-black text-xs uppercase hover:underline">View All</Link>
               </div>
               <div className="space-y-4">
                  {homework.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-brand-bg rounded-2xl border border-brand-100 group hover:bg-white transition-all">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-white rounded-xl shadow-sm text-brand-primary">
                            <FileText size={20} />
                         </div>
                         <div>
                            <h4 className="font-bold text-brand-heading text-sm">{item.title}</h4>
                            <p className="text-xs text-brand-text">{item.subject} • Due {item.dueDate}</p>
                         </div>
                      </div>
                      <div className="h-2 w-24 bg-brand-100 rounded-full overflow-hidden hidden md:block">
                         <div className="h-full bg-linear-to-r from-brand-primary to-brand-accent" style={{ width: '70%' }} />
                      </div>
                    </div>
                  ))}
               </div>
             </div>
          </div>

          {/* Activity/Notification Sidebar */}
          <div className="bg-brand-white rounded-3xl shadow-xl shadow-brand-primary/5 border border-brand-100 flex flex-col p-8">
             <h3 className="text-2xl font-black text-brand-heading mb-8 flex items-center gap-3">
                <Bell className="text-brand-primary" />
                Live Feed
             </h3>
             <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
                {notifications.slice(0, 5).map((notif, idx) => (
                  <div key={idx} className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-brand-bg last:before:hidden">
                    <div className={`absolute left-[-4px] top-1.5 w-2 h-2 rounded-full ring-4 ring-brand-white ${notif.isRead ? 'bg-brand-accent' : 'bg-brand-primary animate-pulse'}`} />
                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-brand-text uppercase tracking-widest">{notif.type}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(notif.createdAt).toLocaleDateString()}</span>
                       </div>
                       <p className="text-sm font-medium text-brand-text leading-relaxed">
                          {notif.message}
                       </p>
                    </div>
                  </div>
                ))}
             </div>
             <button className="mt-8 w-full py-4 border-2 border-brand-secondary text-brand-secondary font-black text-xs uppercase rounded-2xl hover:bg-brand-secondary hover:text-white transition-all">
                VIEW ALL ANNOUNCEMENTS
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
