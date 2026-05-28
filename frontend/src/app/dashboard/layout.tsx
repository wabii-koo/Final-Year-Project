'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  MessageSquare,
  Bell,
  Calendar,
  BookOpen,
  Users,
  User,
  Menu,
  X,
  LogOut,
  FileText,
  Settings,
  ClipboardList,
  Car,
  Leaf
} from 'lucide-react'

interface UserData {
  userId: number
  email: string
  role: string
  fullName: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<UserData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [unreadEventCount, setUnreadEventCount] = useState(0)
  const [unreadMsgCount, setUnreadMsgCount] = useState(0)
  const [liveAlert, setLiveAlert] = useState<{title: string, message: string} | null>(null)

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    setUser(JSON.parse(userData))
  }, [])

  useEffect(() => {
    if (!user) return
    let active = true

    const checkUnread = async () => {
      try {
        const token = localStorage.getItem('token')
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        const uid = user.userId || (user as any).user_id || (user as any).id || 'default'

        // Check Notifications
        const res = await fetch(`${apiUrl}/api/notifications?limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (!active) return

        if (data.success && data.data?.notifications) {
          const notifs = data.data.notifications
          if (notifs.length > 0) {
            const maxId = Math.max(...notifs.map((n: any) => n.notificationId || n.notification_id || n.id || 0))
            const prevKnownStr = localStorage.getItem(`knownNotifId_${uid}`)
            const prevKnown = prevKnownStr ? parseInt(prevKnownStr) : maxId
            
            if (maxId > prevKnown && prevKnownStr) {
               const latestNotif = notifs.find((n: any) => (n.notificationId || n.notification_id || n.id) === maxId)
               setLiveAlert({
                  title: 'New Notification',
                  message: latestNotif?.title || 'You have a new announcement!'
               })
            }
            localStorage.setItem(`knownNotifId_${uid}`, maxId.toString())
            
            const isViewingNotifications = pathname.startsWith('/dashboard/notifications')
            
            if (isViewingNotifications) {
              localStorage.setItem(`lastReadNotifId_${uid}`, maxId.toString())
              setUnreadNotifCount(0)
            } else {
              const lastIdStr = localStorage.getItem(`lastReadNotifId_${uid}`)
              const lastId = lastIdStr ? parseInt(lastIdStr) : 0
              const count = notifs.filter((n: any) => (n.notificationId || n.notification_id || n.id || 0) > lastId).length
              setUnreadNotifCount(count)
            }
          } else {
            setUnreadNotifCount(0)
          }
        } else {
          setUnreadNotifCount(0)
        }

        // Check Events
        const resEvents = await fetch(`${apiUrl}/api/events?limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const dataEvents = await resEvents.json()
        if (!active) return

        const eventsList = dataEvents.data?.events || dataEvents.data || dataEvents
        if (Array.isArray(eventsList) && eventsList.length > 0) {
            const maxId = Math.max(...eventsList.map((e: any) => e.eventId || e.event_id || e.id || 0))
            const prevKnownStr = localStorage.getItem(`knownEventId_${uid}`)
            const prevKnown = prevKnownStr ? parseInt(prevKnownStr) : maxId

            if (maxId > prevKnown && prevKnownStr) {
               const latestEvent = eventsList.find((e: any) => (e.eventId || e.event_id || e.id) === maxId)
               setLiveAlert({
                  title: 'New Event Scheduled',
                  message: latestEvent?.title || 'A new event was just added to the calendar!'
               })
            }
            localStorage.setItem(`knownEventId_${uid}`, maxId.toString())

            const isViewingEvents = pathname.startsWith('/dashboard/events')
            if (isViewingEvents) {
              localStorage.setItem(`lastReadEventId_${uid}`, maxId.toString())
              setUnreadEventCount(0)
            } else {
              const lastIdStr = localStorage.getItem(`lastReadEventId_${uid}`)
              const lastId = lastIdStr ? parseInt(lastIdStr) : 0
              const count = eventsList.filter((e: any) => (e.eventId || e.event_id || e.id || 0) > lastId).length
              setUnreadEventCount(count)
            }
        } else {
          setUnreadEventCount(0)
        }
      } catch (err) {
        console.error('Failed to check unread tab', err)
      }
    }

    checkUnread()
    const interval = setInterval(checkUnread, 60000)
    window.addEventListener('focus', checkUnread)
    
    return () => {
      active = false
      clearInterval(interval)
      window.removeEventListener('focus', checkUnread)
    }
  }, [user, pathname])

  // Fetch unread message count for homeroom_teacher and guardian
  useEffect(() => {
    if (!user || (user.role !== 'homeroom_teacher' && user.role !== 'guardian')) return

    const checkUnreadMessages = async () => {
      try {
        const token = localStorage.getItem('token')
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        const isViewingMessages = pathname.startsWith('/dashboard/messages')

        if (isViewingMessages) {
          setUnreadMsgCount(0)
          return
        }

        const res = await fetch(`${apiUrl}/api/messages/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.success && data.data?.conversations) {
          const total = data.data.conversations.reduce((sum: number, c: any) => sum + (parseInt(c.unreadCount) || 0), 0)
          setUnreadMsgCount(total)
        }
      } catch (err) {
        console.error('Failed to check unread messages', err)
      }
    }

    checkUnreadMessages()
    const msgInterval = setInterval(checkUnreadMessages, 30000)
    window.addEventListener('focus', checkUnreadMessages)
    return () => {
      clearInterval(msgInterval)
      window.removeEventListener('focus', checkUnreadMessages)
    }
  }, [user, pathname])

  const handleLogout = () => {
    localStorage.clear()
    router.push('/auth/login')
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/director', roles: ['director'] },
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/registrar', roles: ['registrar'] },
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/teacher', roles: ['teacher', 'homeroom_teacher'] },
    { icon: Bell, label: 'Notifications', href: '/dashboard/notifications', roles: ['director', 'registrar', 'teacher', 'homeroom_teacher', 'guardian'] },
    { icon: Calendar, label: 'Events', href: '/dashboard/events', roles: ['director', 'teacher', 'homeroom_teacher', 'guardian'] },
    { icon: BookOpen, label: 'Homework', href: '/dashboard/homework', roles: ['teacher', 'homeroom_teacher', 'guardian'] },
    { icon: Users, label: 'Students', href: '/dashboard/students', roles: ['homeroom_teacher'] },
    { icon: Car, label: 'Pickup', href: '/dashboard/pickup', roles: ['guardian', 'teacher', 'homeroom_teacher'] },
    { icon: Settings, label: 'User Management', href: '/dashboard/users', roles: ['registrar'] },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages', roles: ['guardian', 'homeroom_teacher'] },
    { icon: FileText, label: 'Report Cards', href: '/dashboard/report-cards', roles: ['director', 'homeroom_teacher', 'guardian'] },
    { icon: ClipboardList, label: 'Audit Logs', href: '/dashboard/audit-logs', roles: ['registrar'] },
    { icon: User, label: 'Registrations', href: '/dashboard/registrations', roles: ['registrar'] },
  ]

  const filteredMenuItems = user 
    ? menuItems.filter(item => item.roles.includes(user.role))
    : []

  return (
    <div className="flex h-screen bg-brand-bg font-sans">
      {/* Fixed Mini Sidebar / Trigger - Match Green Header */}
      <div className="w-20 bg-brand-primary flex flex-col items-center py-6 shadow-2xl z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all border border-white/20 shadow-lg"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="mt-8 flex flex-col items-center gap-6">
           <Leaf className="text-white animate-pulse" size={32} />
        </div>
      </div>

      {/* Main Collapsible Sidebar Overlay */}
      {sidebarOpen && (
        <>
          {/* Backdrop to close sidebar when clicking outside */}
          <div 
            className="fixed inset-0 z-30 bg-black/5 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-20 z-40 w-72 bg-brand-white shadow-[20px_0_60px_-15px_rgba(0,0,0,0.1)] border-r border-brand-100 transition-transform duration-300 ease-in-out">
            <div className="h-full flex flex-col p-6">
            {/* User Profile Summary */}
            <div className="flex items-center gap-4 mb-10 p-4 bg-brand-bg rounded-3xl border border-brand-100 shadow-inner">
              <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg text-white">
                <User size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-brand-heading truncate text-lg">{user?.fullName}</p>
                <p className="text-sm text-brand-primary/80 font-semibold uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href)
                      setSidebarOpen(false)
                    }}
                    className={`group w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200
                      ${isActive 
                        ? 'bg-brand-primary text-white shadow-xl scale-105' 
                        : 'text-brand-text hover:bg-brand-bg hover:text-brand-primary'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <Icon size={22} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                      <span className="font-bold text-base">{item.label}</span>
                    </div>
                    {(() => {
                      const count = item.label === 'Notifications' ? unreadNotifCount
                        : item.label === 'Events' ? unreadEventCount
                        : item.label === 'Messages' ? unreadMsgCount
                        : 0
                      return count > 0 ? (
                        <span className={`${isActive ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white'} text-[10px] font-black px-2 py-0.5 rounded-full ring-2 ring-brand-white`}>
                          {count}
                        </span>
                      ) : null
                    })()}
                  </button>
                )
              })}
            </nav>

            {/* Logout Section */}
            <div className="mt-6 pt-6 border-t border-brand-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 py-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </div>
        </aside>
        </>
      )}

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Subtle Brand Background Pattern */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Global Alert Overlay */}
        {liveAlert && (
          <div className="fixed top-8 right-8 z-[60] max-w-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-brand-primary p-6 flex items-start gap-5">
              <div className="bg-brand-bg p-3 rounded-2xl shadow-inner">
                <Bell className="text-brand-primary" size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-brand-heading text-base leading-tight">{liveAlert.title}</h4>
                <p className="text-brand-text text-sm mt-1 leading-relaxed">{liveAlert.message}</p>
                <button 
                  onClick={() => router.push('/dashboard/notifications')}
                  className="mt-3 text-xs font-bold text-brand-primary hover:underline uppercase tracking-tighter"
                >
                  View details
                </button>
              </div>
              <button onClick={() => setLiveAlert(null)} className="text-brand-text/40 hover:text-brand-heading">
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto no-scrollbar relative z-10">
          {children}
        </main>
      </div>
    </div>
  )
}
