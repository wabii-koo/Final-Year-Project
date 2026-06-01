'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Bell, 
  Calendar, 
  Car, 
  FileText, 
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Home,
  LogOut,
  Menu,
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
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([])
  const [stats, setStats] = useState({
    totalNotifications: 0,
    unreadNotifications: 0,
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

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      if (user) {
        loadGuardianData(user.userId)
      }
    }
    window.addEventListener('school-notifications-updated', handleNotificationsUpdated)
    return () => {
      window.removeEventListener('school-notifications-updated', handleNotificationsUpdated)
    }
  }, [user])

  const loadGuardianData = async (guardianId: number) => {
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const [studentsRes, notificationsRes, pickupRes] = await Promise.all([
        fetch(`${apiUrl}/api/students/my-children`, { headers }),
        fetch(`${apiUrl}/api/notifications`, { headers }),
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
      unreadNotifications: (() => {
        const uid = user?.userId || (user as any)?.user_id || (user as any)?.id || 'default'
        const lastIdStr = localStorage.getItem(`lastReadNotifId_${uid}`)
        const lastId = lastIdStr ? parseInt(lastIdStr) : 0
        return notifications.filter(n => ((n as any).notificationId || (n as any).id || 0) > lastId).length
      })(),
      pendingPickups: pickupRequests.filter(p => p.status === 'pending').length
    })
  }, [notifications, pickupRequests, user])

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
            <div className="w-20 h-20 bg-brand-bg rounded-3xl overflow-hidden flex items-center justify-center shadow-inner border border-brand-100 group">
              <img src="/ethiopian-woman.png" alt="User Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
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
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 py-12">
          {[
            { label: 'Unread Alerts', value: stats.unreadNotifications, icon: Bell, color: 'text-brand-primary' },
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
              </div>
          ))}
        </section>

      </div>
    </div>
  )
}
