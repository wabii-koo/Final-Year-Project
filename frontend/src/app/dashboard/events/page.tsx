'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, Plus, AlertTriangle, X, ChevronLeft, ChevronRight, Users, Bell } from 'lucide-react'

interface Event {
  eventId: number
  title: string
  description: string
  eventDate: string
  endDate?: string
  eventType: 'exam' | 'meeting' | 'holiday' | 'activity' | 'other'
  location?: string
  createdBy: number
  createdAt: string
  updatedAt: string
  isActive: boolean
  targetAudience: 'all' | 'guardians_only' | 'teachers_only' | 'specific_class'
}

export default function EventsPage() {
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventType: 'activity' as Event['eventType'],
    location: '',
    targetAudience: 'all' as Event['targetAudience']
  })
  const router = useRouter()

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventDate: '',
    endDate: '',
    eventType: 'activity' as Event['eventType'],
    location: '',
    targetAudience: 'all' as Event['targetAudience'],
    sendNotification: true
  })

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
      fetchEvents()
    }
  }, [user])

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const response_data = await response.json()
        const data = response_data.data?.events || response_data
        setEvents(Array.isArray(data) ? data : [])
      } else {
        console.error('Failed to fetch events')
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const checkConflict = (startDate: string, endDate: string, excludeId?: number): Event | null => {
    const newStart = new Date(startDate)
    const newEnd = endDate ? new Date(endDate) : newStart

    return events.find(event => {
      if (excludeId && event.eventId === excludeId) return false
      
      const eventStart = new Date(event.eventDate)
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart
      
      // Check for overlap
      return (newStart <= eventEnd && newEnd >= eventStart)
    }) || null
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setConflictWarning(null)

    // Check for conflicts
    const conflict = checkConflict(newEvent.eventDate, newEvent.endDate || newEvent.eventDate)
    if (conflict) {
      setConflictWarning(`Warning: This event overlaps with "${conflict.title}" on ${new Date(conflict.eventDate).toLocaleDateString()}`)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      
      const response = await fetch(`${apiUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEvent)
      })

      if (response.ok) {
        const data = await response.json()
        
        // If notification requested, send it
        if (newEvent.sendNotification) {
          await fetch(`${apiUrl}/api/notifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title: `New Event: ${newEvent.title}`,
              content: `${newEvent.description}\n\nDate: ${new Date(newEvent.eventDate).toLocaleDateString()}\nLocation: ${newEvent.location || 'TBD'}`,
              priority: 'normal',
              recipientGroup: newEvent.targetAudience === 'all' ? 'all' : 
                            newEvent.targetAudience === 'guardians_only' ? 'all_guardians' : 
                            newEvent.targetAudience === 'teachers_only' ? 'all_teachers' : 'all'
            })
          })
        }

        setShowCreateModal(false)
        setNewEvent({
          title: '',
          description: '',
          eventDate: '',
          endDate: '',
          eventType: 'activity',
          location: '',
          targetAudience: 'all',
          sendNotification: true
        })
        fetchEvents()
      } else {
        const error = await response.json()
        alert(error.error?.message || 'Failed to create event')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Network error. Please make sure the backend is running.')
    }
  }

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const tzoffset = date.getTimezoneOffset() * 60000
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16)
    return localISOTime
  }

  const handleStartEdit = (event: Event) => {
    setEditingEvent(event)
    setEditFormData({
      title: event.title,
      description: event.description,
      eventDate: formatDateTime(event.eventDate),
      eventType: event.eventType,
      location: event.location || '',
      targetAudience: event.targetAudience
    })
  }

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEvent) return

    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/events/${editingEvent.eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      })

      if (response.ok) {
        setEditingEvent(null)
        fetchEvents()
      } else {
        const error = await response.json()
        alert(error.error?.message || error.message || 'Failed to update event')
      }
    } catch (error) {
      console.error('Error updating event:', error)
      alert('Network error')
    }
  }

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to cancel this event?')) return

    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchEvents()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to delete event')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Network error')
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    
    return days
  }

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(event => event.eventDate.startsWith(dateStr))
  }

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1))
  }

  const canCreateEvent = user?.role === 'director'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-black">Events</h1>
            <p className="text-gray-700 mt-1 font-medium">School calendar and upcoming activities</p>
          </div>
          {canCreateEvent && (
            <button
              onClick={() => router.push('/dashboard/events/create')}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-semibold active:scale-95 transition-all" style={{ backgroundColor: '#7ab32e' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor='#6a9e28')} onMouseLeave={e => (e.currentTarget.style.backgroundColor='#7ab32e')}
            >
              <Plus className="h-5 w-5" />
              Create Event
            </button>
          )}
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Events</h3>
            <p className="text-gray-500">You're all caught up! No upcoming events.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: '#f2f9e8' }}>
               <h2 className="text-lg font-bold text-gray-800">Upcoming Events</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {events.map((event, index) => (
                <div key={event.eventId} className="p-6 hover:bg-gray-50 transition-colors relative group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-[18px] font-black text-black mb-2 flex items-center gap-2">
                        {event.title}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          event.eventType === 'meeting' ? 'bg-green-100 text-green-800' :
                          event.eventType === 'activity' ? 'bg-green-100 text-green-800' :
                          event.eventType === 'exam' ? 'bg-red-100 text-red-800' :
                          event.eventType === 'holiday' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.eventType ? (event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)) : 'Event'}
                        </span>
                      </h3>
                      <p className="text-sm font-bold text-black mb-2">
                        Date: {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'TBD'} • Location: {event.location || 'TBD'}
                      </p>
                      <p className="text-black text-sm mb-4 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                      <div className="flex gap-4 items-center">
                        <button 
                          onClick={() => setViewingEvent(event)}
                          className="text-red-600 font-bold hover:underline text-sm focus:outline-none"
                        >
                          See Detail
                        </button>
                        {canCreateEvent && (
                          <>
                            <button 
                              onClick={() => handleStartEdit(event)}
                              className="text-blue-600 font-bold hover:underline text-sm focus:outline-none"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteEvent(event.eventId)}
                              className="text-red-500 font-bold hover:underline text-sm focus:outline-none"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View Modal overlay */}
      {viewingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: '#f2f9e8', borderColor: '#c8e6a0' }}>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#3d6b0f' }}>
                <Calendar className="w-5 h-5" style={{ color: '#7ab32e' }} />
                Event Details
              </h2>
              <button 
                onClick={() => setViewingEvent(null)}
                className="text-gray-500 hover:text-gray-800 transition-colors p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  viewingEvent.eventType === 'meeting' ? 'bg-green-100 text-green-800' :
                  viewingEvent.eventType === 'activity' ? 'bg-green-100 text-green-800' :
                  viewingEvent.eventType === 'exam' ? 'bg-red-100 text-red-800' :
                  viewingEvent.eventType === 'holiday' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {viewingEvent.eventType ? (viewingEvent.eventType.charAt(0).toUpperCase() + viewingEvent.eventType.slice(1)) : 'Event'}
                </span>
                <h3 className="text-xl font-bold text-gray-900">{viewingEvent.title}</h3>
              </div>
              <div className="flex items-center gap-6 text-sm font-semibold text-gray-500 mb-6 border-b pb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {viewingEvent.eventDate ? new Date(viewingEvent.eventDate).toLocaleDateString() : 'TBD'}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {viewingEvent.location || 'TBD'}
                </div>
              </div>
              <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                {viewingEvent.description}
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center">
                {canCreateEvent && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setViewingEvent(null)
                        handleStartEdit(viewingEvent)
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      Edit Event
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this event?')) {
                          handleDeleteEvent(viewingEvent.eventId)
                          setViewingEvent(null)
                        }
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      Cancel Event
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setViewingEvent(null)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors text-sm ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal overlay */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: '#f2f9e8', borderColor: '#c8e6a0' }}>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#3d6b0f' }}>
                <Calendar className="w-5 h-5" style={{ color: '#7ab32e' }} />
                Edit Event
              </h2>
              <button 
                onClick={() => setEditingEvent(null)}
                className="text-gray-500 hover:text-gray-800 transition-colors p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateEvent} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Event Title *</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={e => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={e => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date & Start Time *</label>
                  <input
                    type="datetime-local"
                    value={editFormData.eventDate}
                    onChange={e => setEditFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={e => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Event Type</label>
                  <select
                    value={editFormData.eventType}
                    onChange={e => setEditFormData(prev => ({ ...prev, eventType: e.target.value as Event['eventType'] }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  >
                    <option value="activity">Activity</option>
                    <option value="exam">Exam</option>
                    <option value="meeting">Meeting</option>
                    <option value="holiday">Holiday</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Target Audience</label>
                  <select
                    value={editFormData.targetAudience}
                    onChange={e => setEditFormData(prev => ({ ...prev, targetAudience: e.target.value as Event['targetAudience'] }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  >
                    <option value="all">Everyone (School-Wide)</option>
                    <option value="guardians_only">Guardians Only</option>
                    <option value="teachers_only">Teachers Only</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-white font-medium rounded-lg transition-colors"
                  style={{ backgroundColor: '#7ab32e' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
