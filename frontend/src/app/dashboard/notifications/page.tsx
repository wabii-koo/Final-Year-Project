'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCircle, AlertCircle, Clock, AlertTriangle, Megaphone, Edit, Trash2, X, Save, Plus } from 'lucide-react'

interface Notification {
  id: number
  title: string
  message?: string
  content?: string
  priority?: string
  recipientGroup?: string
  time: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  senderId?: number | string
}

export default function NotificationsPage() {
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  
  // Edit modal states
  const [editingNotif, setEditingNotif] = useState<Notification | null>(null)
  const [viewingNotif, setViewingNotif] = useState<Notification | null>(null)
  const [editFormData, setEditFormData] = useState({ title: '', content: '', priority: '', recipientGroup: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')

  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/auth/login')
      return
    }
  }, [router])

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      if (user) {
        fetchNotifications()
      }
    }
    window.addEventListener('school-notifications-updated', handleNotificationsUpdated)
    return () => {
      window.removeEventListener('school-notifications-updated', handleNotificationsUpdated)
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const response_data = await response.json()
        const data = response_data.data?.notifications || response_data

        const mappedNotifications = (Array.isArray(data) ? data : []).map((item: any) => ({
          id: item.notificationId || item.id || 0,
          title: item.title || 'Untitled Notification',
          content: item.content || item.message || '',
          message: item.message || item.content || '',
          priority: item.priority || 'normal',
          recipientGroup: item.recipientGroup || 'all_guardians',
          time: item.sentAt ? new Date(item.sentAt).toLocaleString() : item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown time',
          type: (item.priority === 'emergency' ? 'error' : 'info') as 'info' | 'warning' | 'success' | 'error',
          read: item.read ?? false,
          senderId: item.senderId,
        }))

        setNotifications(mappedNotifications)
      } else {
        console.error('Failed to fetch notifications')
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this notification globally?')) return;
    
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const deleted = notifications.find(n => n.id === id)
        setNotifications(notifications.filter(n => n.id !== id))
        // Broadcast to all other open tabs immediately
        try {
          const bc = new BroadcastChannel('school-updates')
          bc.postMessage({ type: 'notification', action: 'deleted', title: deleted?.title || 'Announcement' })
          bc.close()
        } catch (_) {}
      } else {
        alert('Failed to delete notification')
      }
    } catch (error) {
      console.error('Delete error', error)
      alert('An error occurred while deleting')
    }
  }

  const handleEditClick = (notif: Notification) => {
    setEditingNotif(notif)
    setEditFormData({
      title: notif.title,
      content: notif.content || notif.message || '',
      priority: notif.priority || 'normal',
      recipientGroup: notif.recipientGroup || 'all'
    })
    setActionError('')
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNotif) return
    setIsSubmitting(true)
    setActionError('')

    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/notifications/${editingNotif.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(editFormData)
      })

      if (response.ok) {
        // Broadcast to all other open tabs immediately
        try {
          const bc = new BroadcastChannel('school-updates')
          bc.postMessage({ type: 'notification', action: 'updated', title: editFormData.title })
          bc.close()
        } catch (_) {}
        await fetchNotifications()
        setEditingNotif(null)
        setSuccessMessage('Notification updated successfully!')
      } else {
        const data = await response.json()
        setActionError(data?.error?.message || 'Failed to update notification')
      }
    } catch (error) {
      setActionError('An error occurred while updating')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  const canManage = user?.role === 'director' || user?.role === 'registrar'

  return (
    <div className="min-h-screen relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-brand-success rounded-2xl flex items-center gap-2 font-bold animate-fadeIn">
            <CheckCircle className="h-5 w-5 text-brand-success shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-black flex items-center tracking-tight">
              <Bell className="h-8 w-8 text-brand-primary mr-3" />
              Notifications
            </h1>
            <p className="text-gray-700 mt-2 font-medium">Stay updated with school activities</p>
          </div>
          
          {canManage && (
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard/notifications/create')}
                className="bg-brand-primary hover:bg-brand-primaryHover text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-primary/20"
              >
                <Plus className="h-5 w-5" />
                Create Notification
              </button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No active announcements</h3>
            <p className="text-gray-500">You're all caught up! No new announcements.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl shadow-brand-900/5 overflow-hidden border border-gray-50">
            <div className="divide-y divide-gray-200">
              {notifications.map((notification, index) => (
                <div key={notification.id} className="p-6 hover:bg-gray-50 transition-colors relative group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-black mb-1 group-hover:text-brand-primary transition-colors">
                        {notification.title}
                      </h3>
                      <p className="text-sm font-bold text-black mb-2">
                        Posted : {notification.time}
                        {notification.type === 'error' && <span className="text-red-600 ml-2 uppercase text-xs tracking-wider bg-red-100 px-2 py-0.5 rounded">Emergency</span>}
                      </p>
                      <p className="text-black text-sm mb-4 line-clamp-2 leading-relaxed">
                        {notification.content || notification.message}
                      </p>
                      <button 
                        onClick={() => setViewingNotif(notification)}
                        className="text-red-600 font-bold hover:underline text-sm focus:outline-none"
                      >
                        See Detail
                      </button>
                    </div>

                    {/* Management Controls */}
                    {canManage && String(notification.senderId) === String(user?.userId) && (
                      <div className="flex items-center space-x-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                        <button 
                          onClick={() => handleEditClick(notification)}
                          className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors border border-transparent"
                          title="Edit Announcement"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors border border-transparent"
                          title="Delete Announcement"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View Modal overlay */}
      {viewingNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className={`px-6 py-4 border-b flex items-center justify-between ${viewingNotif.type === 'error' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
              <h2 className={`text-xl font-bold ${viewingNotif.type === 'error' ? 'text-red-800' : 'text-blue-900'}`}>
                {viewingNotif.type === 'error' && <AlertTriangle className="inline-block w-5 h-5 mr-2 -mt-1 text-red-600" />}
                Announcement Details
              </h2>
              <button 
                onClick={() => setViewingNotif(null)}
                className="text-gray-500 hover:text-gray-800 transition-colors p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{viewingNotif.title}</h3>
              <p className="text-sm font-semibold text-gray-500 mb-6 border-b pb-4">
                Posted: {viewingNotif.time}
              </p>
              <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                {viewingNotif.content || viewingNotif.message}
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setViewingNotif(null)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal overlay */}
      {editingNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold flex items-center text-gray-900">
                <Edit className="w-5 h-5 mr-2 text-blue-600" />
                Edit Notification
              </h2>
              <button 
                onClick={() => setEditingNotif(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              {actionError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 shrink-0" />
                  {actionError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={e => setEditFormData({...editFormData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Content / Message</label>
                <textarea
                  required
                  rows={4}
                  value={editFormData.content}
                  onChange={e => setEditFormData({...editFormData, content: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Priority Level</label>
                  <select
                    value={editFormData.priority}
                    onChange={e => setEditFormData({...editFormData, priority: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 space-x-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingNotif(null)}
                  className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-all flex items-center disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
