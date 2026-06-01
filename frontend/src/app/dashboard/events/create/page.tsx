'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, AlertCircle, ArrowLeft, MapPin, Users, Clock, Send } from 'lucide-react'

interface EventData {
  title: string
  description: string
  eventDate: string
  eventType: 'exam' | 'meeting' | 'holiday' | 'activity' | 'other'
  location: string
  targetAudience: 'all' | 'guardians_only' | 'teachers_only' | 'specific_class'
}

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [event, setEvent] = useState<EventData>({
    title: '',
    description: '',
    eventDate: '',
    eventType: 'activity',
    location: '',
    targetAudience: 'all'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEvent(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(event)
      })

      const data = await response.json()

      if (data.success) {
        // Send a system notification alerting all users of the new event
        try {
          await fetch(`${apiUrl}/api/notifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title: `New Event: ${event.title}`,
              content: `A new school event "${event.title}" has been scheduled.\n\nDetails:\nDate: ${new Date(event.eventDate).toLocaleDateString()}\nLocation: ${event.location || 'TBD'}\nDescription: ${event.description}`,
              priority: 'normal',
              recipientGroup: 'all'
            })
          })
        } catch (notifErr) {
          console.error('Failed to send event creation notification:', notifErr)
        }

        setSuccess('Event scheduled successfully!')
        setTimeout(() => router.push('/dashboard/events'), 1500)
      } else {
        // Handle Conflict specifically
        if (data.error?.code === 'EVENT_CONFLICT') {
          setError(data.error.message)
        } else {
          setError(data.message || 'Failed to schedule event')
        }
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Schedule School Event</h1>
        <p className="text-gray-600 mt-1">Plan upcoming activities, meetings, or exams. System will check for location/time conflicts.</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div className="ml-3">
              <h3 className="text-sm font-bold text-red-800">Scheduling Conflict or Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
          <div className="flex">
            <Calendar className="h-5 w-5 text-green-500" />
            <p className="ml-3 text-green-700 font-medium">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Event Title *</label>
            <input
              type="text"
              name="title"
              value={event.title}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. Annual Sports Day 2026"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={event.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Provide details about the event..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Date & Start Time *</label>
            <input
              type="datetime-local"
              name="eventDate"
              value={event.eventDate}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Location *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="location"
                value={event.location}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. Main Hall, Room 102"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Event Type</label>
            <select
              name="eventType"
              value={event.eventType}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="activity">Activity</option>
              <option value="exam">Exam</option>
              <option value="meeting">Meeting</option>
              <option value="holiday">Holiday</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Target Audience</label>
            <select
              name="targetAudience"
              value={event.targetAudience}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="all">Everyone (School-Wide)</option>
              <option value="guardians_only">Guardians Only</option>
              <option value="teachers_only">Teachers Only</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:scale-95 transition-all flex items-center disabled:opacity-50"
          >
            {loading ? 'Scheduling...' : (
              <>
                <Calendar className="h-5 w-5 mr-2" />
                Schedule Event
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
