'use client'

import { useState, useEffect, useRef } from 'react'
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
  Car
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
  const sidebarRef = useRef<HTMLElement>(null)
  const prevNotifsRef = useRef<any[] | null>(null)
  const prevEventsRef = useRef<any[] | null>(null)
  const skipNextNotifDiff = useRef(false)
  const skipNextEventDiff = useRef(false)
  const currentNotifsRef = useRef<any[]>([])

  useEffect(() => {
    if (!sidebarOpen) return

    const handleOutsideClick = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [sidebarOpen])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    setUser(JSON.parse(userData))
  }, [])

  // BroadcastChannel: receive real-time changes from other tabs in the same browser
  useEffect(() => {
    if (typeof window === 'undefined') return
    const bc = new BroadcastChannel('school-updates')
    bc.onmessage = (e) => {
      const { type, action, title } = e.data || {}
      if (type === 'notification') {
        const msg =
          action === 'created' ? `New announcement: "${title}"` :
          action === 'updated' ? `"${title}" has been updated.` :
          action === 'deleted' ? `"${title}" has been removed.` : title
        const alertTitle =
          action === 'created' ? 'New Announcement' :
          action === 'updated' ? 'Announcement Updated' : 'Announcement Deleted'
        setLiveAlert({ title: alertTitle, message: msg })
        skipNextNotifDiff.current = true
        window.dispatchEvent(new CustomEvent('school-notifications-updated'))
      } else if (type === 'event') {
        const msg =
          action === 'created' ? `New event scheduled: "${title}"` :
          action === 'updated' ? `"${title}" has been rescheduled or updated.` :
          action === 'deleted' ? `"${title}" has been cancelled.` : title
        const alertTitle =
          action === 'created' ? 'New Event Scheduled' :
          action === 'updated' ? 'Event Updated' : 'Event Cancelled'
        setLiveAlert({ title: alertTitle, message: msg })
        skipNextEventDiff.current = true
        window.dispatchEvent(new CustomEvent('school-events-updated'))
      }
    }
    return () => bc.close()
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
          const currentNotifs = notifs || []
          const prevNotifs = prevNotifsRef.current

          if (prevNotifs === null) {
            prevNotifsRef.current = currentNotifs
            // On first load: show popup for any notifications not yet acknowledged by this user
            const lastAckId = parseInt(localStorage.getItem(`lastAcknowledgedNotifId_${uid}`) || '0')
            let lastAckTs = parseInt(localStorage.getItem(`lastAcknowledgedNotifTs_${uid}`) || '0')
            
            if (lastAckTs === 0 && lastAckId > 0) {
              // Migration fallback: initialize lastAckTs to the creation time of the last acknowledged ID
              const lastAckNotif = currentNotifs.find((n: any) => (n.notificationId || n.notification_id || n.id || 0) === lastAckId)
              if (lastAckNotif) {
                lastAckTs = new Date(lastAckNotif.createdAt || lastAckNotif.sentAt || 0).getTime()
                if (lastAckTs > 0) {
                  localStorage.setItem(`lastAcknowledgedNotifTs_${uid}`, lastAckTs.toString())
                }
              }
            }

            const unacked = currentNotifs.filter((n: any) => {
              const nid = n.notificationId || n.notification_id || n.id || 0
              const ts = new Date(n.sentAt || n.createdAt || 0).getTime()
              if (lastAckTs > 0) {
                return ts > lastAckTs
              }
              return nid > lastAckId
            })
            if (unacked.length > 0) {
              const newest = unacked[0] // API returns DESC order
              setLiveAlert({
                title: unacked.length > 1 ? `${unacked.length} Unread Alerts` : 'Unread Announcement',
                message: unacked.length > 1
                  ? `You have ${unacked.length} unread announcements. Latest: "${newest.title}"`
                  : `"${newest.title}"`
              })
            }
          } else if (skipNextNotifDiff.current) {
            // BroadcastChannel already handled this change — just update the ref silently
            skipNextNotifDiff.current = false
            prevNotifsRef.current = currentNotifs
          } else {
            // 1. Detect new
            const newNotif = currentNotifs.find((n: any) => {
              const nid = n.notificationId || n.notification_id || n.id || 0
              return !prevNotifs.some((pn: any) => (pn.notificationId || pn.notification_id || pn.id || 0) === nid)
            })

            // 2. Detect updated
            const updatedNotif = currentNotifs.find((n: any) => {
              const nid = n.notificationId || n.notification_id || n.id || 0
              const match = prevNotifs.find((pn: any) => (pn.notificationId || pn.notification_id || pn.id || 0) === nid)
              return match && (
                match.title !== n.title || 
                (match.content || match.message) !== (n.content || n.message) || 
                match.priority !== n.priority ||
                (match.sentAt || match.createdAt) !== (n.sentAt || n.createdAt)
              )
            })

            // 3. Detect deleted
            const deletedNotif = prevNotifs.find((pn: any) => {
              const nid = pn.notificationId || pn.notification_id || pn.id || 0
              return !currentNotifs.some((n: any) => (n.notificationId || n.notification_id || n.id || 0) === nid)
            })

            let notifChanged = false
            if (newNotif) {
              setLiveAlert({
                title: 'New Announcement',
                message: newNotif.title || 'You have a new announcement!'
              })
              notifChanged = true
            } else if (updatedNotif) {
              setLiveAlert({
                title: 'Announcement Updated',
                message: `"${updatedNotif.title}" has been updated.`
              })
              notifChanged = true
            } else if (deletedNotif) {
              setLiveAlert({
                title: 'Announcement Deleted',
                message: `"${deletedNotif.title}" has been removed.`
              })
              notifChanged = true
            }

            if (notifChanged) {
              window.dispatchEvent(new CustomEvent('school-notifications-updated'))
            }
            prevNotifsRef.current = currentNotifs
          }

          currentNotifsRef.current = currentNotifs

          if (notifs.length > 0) {
            const maxId = Math.max(...notifs.map((n: any) => n.notificationId || n.notification_id || n.id || 0))
            const isViewingNotifications = pathname.startsWith('/dashboard/notifications')
            if (isViewingNotifications) {
              localStorage.setItem(`lastReadNotifId_${uid}`, maxId.toString())
              localStorage.setItem(`lastAcknowledgedNotifId_${uid}`, maxId.toString())
              const maxTs = Math.max(...notifs.map((n: any) => new Date(n.sentAt || n.createdAt || 0).getTime()))
              if (maxTs > 0) {
                localStorage.setItem(`lastAcknowledgedNotifTs_${uid}`, maxTs.toString())
              }
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
        if (Array.isArray(eventsList)) {
          const currentEvents = eventsList || []
          const prevEvents = prevEventsRef.current

          if (prevEvents === null) {
            prevEventsRef.current = currentEvents
          } else if (skipNextEventDiff.current) {
            // BroadcastChannel already handled this change — just update the ref silently
            skipNextEventDiff.current = false
            prevEventsRef.current = currentEvents
          } else {
            // 1. Detect new
            const newEvent = currentEvents.find((e: any) => {
              const eid = e.eventId || e.event_id || e.id || 0
              return !prevEvents.some((pe: any) => (pe.eventId || pe.event_id || pe.id || 0) === eid)
            })

            // 2. Detect updated
            const updatedEvent = currentEvents.find((e: any) => {
              const eid = e.eventId || e.event_id || e.id || 0
              const match = prevEvents.find((pe: any) => (pe.eventId || pe.event_id || pe.id || 0) === eid)
              return match && (match.title !== e.title || match.description !== e.description || match.eventDate !== e.eventDate || match.location !== e.location)
            })

            // 3. Detect deleted
            const deletedEvent = prevEvents.find((pe: any) => {
              const eid = pe.eventId || pe.event_id || pe.id || 0
              return !currentEvents.some((e: any) => (e.eventId || e.event_id || e.id || 0) === eid)
            })

            let eventChanged = false
            if (newEvent) {
              setLiveAlert({
                title: 'New Event Scheduled',
                message: newEvent.title || 'A new event was just added to the calendar!'
              })
              eventChanged = true
            } else if (updatedEvent) {
              setLiveAlert({
                title: 'Event Updated',
                message: `"${updatedEvent.title}" has been rescheduled or updated.`
              })
              eventChanged = true
            } else if (deletedEvent) {
              setLiveAlert({
                title: 'Event Cancelled',
                message: `"${deletedEvent.title}" has been cancelled.`
              })
              eventChanged = true
            }

            if (eventChanged) {
              window.dispatchEvent(new CustomEvent('school-events-updated'))
            }
            prevEventsRef.current = currentEvents
          }

          if (eventsList.length > 0) {
            const maxId = Math.max(...eventsList.map((e: any) => e.eventId || e.event_id || e.id || 0))
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
        } else {
          setUnreadEventCount(0)
        }
      } catch (err) {
        console.error('Failed to check unread tab', err)
      }
    }

    checkUnread()
    const interval = setInterval(checkUnread, 5000)
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
    localStorage.removeItem('token')
    localStorage.removeItem('user')
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
      {/* Unified Brand Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } bg-brand-primary text-white flex flex-col justify-between transition-all duration-300 ease-in-out shadow-2xl z-50 shrink-0`}
      >
        {/* Top Header: Hamburger & Logo */}
        <div className="w-full flex flex-col py-6 px-4 shrink-0">
          <div className={`flex items-center justify-between w-full ${sidebarOpen ? 'px-1' : 'justify-center'}`}>
            {sidebarOpen && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300 min-w-0">
                <div className="bg-white p-1 rounded-full w-9 h-9 flex items-center justify-center overflow-hidden shadow-inner border border-white/10 shrink-0">
                  <img src="/logo.png" alt="School Logo" className="object-contain w-full h-full" />
                </div>
                <span className="font-black text-sm tracking-tighter uppercase text-white truncate">GuardianGate</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`${
                sidebarOpen ? 'p-2 rounded-xl' : 'p-3 rounded-2xl'
              } bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 shadow-lg cursor-pointer shrink-0`}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={24} />}
            </button>
          </div>

          {!sidebarOpen && (
            <div className="bg-white p-1 rounded-full w-10 h-10 flex items-center justify-center overflow-hidden shadow-inner border border-white/10 mt-6 transition-all duration-200">
              <img src="/logo.png" alt="School Logo" className="object-contain w-full h-full" />
            </div>
          )}
        </div>

        {/* User Profile Summary */}
        {sidebarOpen && user && (
          <div className="px-5 py-4 mx-4 bg-white/10 rounded-2xl border border-white/10 shadow-inner flex items-center gap-3 mb-6 shrink-0 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow shrink-0 flex items-center justify-center bg-white/20">
              <img src="/ethiopian-woman.png" alt="User Profile" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white truncate text-sm leading-snug">{user.fullName}</p>
              <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider leading-none mt-1">{user.role?.replace('_', ' ')}</p>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar py-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const count = item.label === 'Notifications' ? unreadNotifCount
              : item.label === 'Events' ? unreadEventCount
              : item.label === 'Messages' ? unreadMsgCount
              : 0

            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href)
                  setSidebarOpen(false)
                }}
                className={`group w-full flex items-center transition-all duration-200 relative cursor-pointer
                  ${isActive 
                    ? 'bg-brand-white text-brand-primary shadow-xl scale-[1.02]' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                  } ${sidebarOpen 
                    ? 'p-4 rounded-2xl justify-between' 
                    : 'p-3 rounded-xl justify-center w-12 h-12 mx-auto'
                  }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <div className="flex items-center gap-4">
                  <Icon size={20} className={isActive ? 'text-brand-primary' : 'group-hover:scale-110 transition-transform'} />
                  {sidebarOpen && <span className="font-bold text-sm tracking-wide">{item.label}</span>}
                </div>
                
                {count > 0 && (
                  sidebarOpen ? (
                    <span className={`${isActive ? 'bg-brand-primary text-white' : 'bg-brand-white text-brand-primary'} text-[10px] font-black px-2 py-0.5 rounded-full ring-2 ring-white/10`}>
                      {count}
                    </span>
                  ) : (
                    <span className="absolute top-1.5 right-1.5 bg-brand-accent text-brand-primary text-[8px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full ring-2 ring-brand-primary animate-pulse">
                      {count}
                    </span>
                  )
                )}
              </button>
            )
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={() => {
              handleLogout()
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center text-white/95 hover:bg-white/10 rounded-2xl transition-all font-bold cursor-pointer
              ${sidebarOpen 
                ? 'justify-center gap-3 py-4 border border-white/10 bg-white/5 hover:bg-white/10 shadow-lg' 
                : 'justify-center w-12 h-12 mx-auto hover:bg-white/10'
              }`}
            title={!sidebarOpen ? 'Sign Out' : undefined}
          >
            <LogOut size={20} className={sidebarOpen ? 'text-white' : 'mx-auto'} />
            {sidebarOpen && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Subtle Brand Background Pattern */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Global Alert Overlay - stays visible until user explicitly dismisses */}
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
                  onClick={() => {
                    // Acknowledge so this popup won't reappear on next login
                    const uid = user?.userId || (user as any)?.user_id || (user as any)?.id || 'default'
                    const maxId = currentNotifsRef.current.length > 0
                      ? Math.max(...currentNotifsRef.current.map((n: any) => n.notificationId || n.notification_id || n.id || 0))
                      : 0
                    const maxTs = currentNotifsRef.current.length > 0
                      ? Math.max(...currentNotifsRef.current.map((n: any) => new Date(n.sentAt || n.createdAt || 0).getTime()))
                      : 0
                    if (maxId > 0) localStorage.setItem(`lastAcknowledgedNotifId_${uid}`, maxId.toString())
                    if (maxTs > 0) localStorage.setItem(`lastAcknowledgedNotifTs_${uid}`, maxTs.toString())
                    router.push('/dashboard/notifications')
                    setLiveAlert(null)
                  }}
                  className="mt-3 text-xs font-bold text-brand-primary hover:underline uppercase tracking-tighter"
                >
                  View &amp; Dismiss
                </button>
              </div>
              <button 
                onClick={() => {
                  // Acknowledge so this popup won't reappear on next login
                  const uid = user?.userId || (user as any)?.user_id || (user as any)?.id || 'default'
                  const maxId = currentNotifsRef.current.length > 0
                    ? Math.max(...currentNotifsRef.current.map((n: any) => n.notificationId || n.notification_id || n.id || 0))
                    : 0
                  const maxTs = currentNotifsRef.current.length > 0
                    ? Math.max(...currentNotifsRef.current.map((n: any) => new Date(n.sentAt || n.createdAt || 0).getTime()))
                    : 0
                  if (maxId > 0) localStorage.setItem(`lastAcknowledgedNotifId_${uid}`, maxId.toString())
                  if (maxTs > 0) localStorage.setItem(`lastAcknowledgedNotifTs_${uid}`, maxTs.toString())
                  setLiveAlert(null)
                }} 
                className="text-brand-text/40 hover:text-brand-heading"
              >
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
