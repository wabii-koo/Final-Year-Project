'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'

interface Homework {
  homeworkId: number
  title: string
  description: string
  subject: string
  className: string
  dueDate: string
  createdAt: string
  isActive: boolean
  teacherName: string
  viewCount?: number
  feedbackCount?: number
}

interface HomeworkListProps {
  role: 'teacher' | 'homeroom_teacher' | 'guardian'
  userId?: number
  classId?: number
}

export default function HomeworkList({ role, userId, classId }: HomeworkListProps) {
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Please login to view homework')
          return
        }

        let url = '/api/homework'
        if (role === 'teacher' && userId) {
          url += `?teacherId=${userId}`
        } else if (role === 'homeroom_teacher' && classId) {
          url += `?classId=${classId}`
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setHomework(data.data.homework || [])
        } else {
          setError('Failed to fetch homework')
        }
      } catch (err) {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchHomework()
  }, [role, userId, classId])

  const handleCreateHomework = () => {
    if (role === 'teacher') {
      window.location.href = '/dashboard/homework/create'
    }
  }

  const handleViewHomework = (homeworkId: number) => {
    if (role === 'guardian') {
      window.location.href = `/dashboard/homework/${homeworkId}`
    }
  }

  const handleAnalytics = (homeworkId: number) => {
    if (role === 'teacher' || role === 'homeroom_teacher') {
      window.location.href = `/dashboard/homework/${homeworkId}/analytics`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading homework...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {role === 'teacher' ? 'My Homework' : role === 'homeroom_teacher' ? 'Class Homework' : 'Homework'}
            </h1>
            {role === 'teacher' && (
              <Button onClick={handleCreateHomework}>
                Create Homework
              </Button>
            )}
          </div>
          <p className="mt-2 text-gray-600">
            {role === 'teacher' 
              ? 'Manage your homework assignments and track student engagement'
              : role === 'homeroom_teacher'
              ? 'View all homework for your assigned class'
              : 'View homework assignments for your children'
            }
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Homework Assignments</h2>
          </div>

          <div className="overflow-hidden">
            {homework.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-500">No homework found</div>
                <p className="mt-2 text-sm text-gray-400">
                  {role === 'teacher' 
                    ? 'Create your first homework assignment to get started.'
                    : role === 'homeroom_teacher'
                    ? 'No homework has been assigned to your class yet.'
                    : 'No homework assignments available for your children.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Feedback
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {homework.map((hw) => (
                      <tr key={hw.homeworkId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{hw.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{new Date(hw.dueDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {hw.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {hw.className}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(hw.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            new Date(hw.dueDate) < new Date() 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {new Date(hw.dueDate) < new Date() ? 'Overdue' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {hw.teacherName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {hw.viewCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {hw.feedbackCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleViewHomework(hw.homeworkId)}
                              variant="outline"
                              size="sm"
                            >
                              View
                            </Button>
                            {(role === 'teacher' || role === 'homeroom_teacher') && (
                              <Button
                                onClick={() => handleAnalytics(hw.homeworkId)}
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                Analytics
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
