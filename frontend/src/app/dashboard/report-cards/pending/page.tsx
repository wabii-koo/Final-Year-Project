'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Check, X, ArrowLeft, User, Calendar, Clock, AlertCircle } from 'lucide-react'

interface ReportCard {
  reportcardId: number
  studentId: number
  term: string
  academicYear: string
  filledAt: string
  status: string
  subjectsGrades: any
  teacherComments: string
  student: {
    fullName: string
  }
  teacher: {
    fullName: string
  }
}

export default function PendingReportCardsPage() {
  const router = useRouter()
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchPendingReportCards()
  }, [])

  const fetchPendingReportCards = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/admin/report-cards/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setReportCards(data.data)
      } else {
        setError(data.message || 'Failed to fetch report cards')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    if (!confirm('Are you sure you want to endorse this report card?')) return

    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/admin/report-cards/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setSuccess('Report card endorsed successfully!')
        setReportCards(prev => prev.filter(rc => rc.reportcardId !== id))
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.message || 'Failed to approve report card')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Endorse Report Cards</h1>
            <p className="text-gray-600 mt-1">Review and approve academic findings submitted by homeroom teachers.</p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold">
            {reportCards.length} Pending
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <Check className="h-5 w-5 text-green-400" />
              <p className="ml-3 text-green-700">{success}</p>
            </div>
          </div>
        )}

        {reportCards.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No Pending Report Cards</h3>
            <p className="text-gray-600 mt-2">All submitted report cards have been processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reportCards.map((rc) => (
              <div key={rc.reportcardId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                        <User className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{rc.student?.fullName}</h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {rc.term} - {rc.academicYear}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Submitted: {new Date(rc.filledAt).toLocaleDateString()}
                          </span>
                          <span className="text-blue-600 font-medium">
                            By: {rc.teacher?.fullName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleApprove(rc.reportcardId)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Endorse
                      </button>
                      <button className="flex items-center px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-bold">
                        <X className="h-4 w-4 mr-2" />
                        Request Revision
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Teacher Comments:</h4>
                    <p className="text-gray-600 italic">"{rc.teacherComments || 'No comments provided.'}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
