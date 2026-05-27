'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, GraduationCap, Mail, Phone, Baby } from 'lucide-react'

interface Student {
  id: number
  firstName: string
  lastName: string
  grade: string
  guardianName: string
  guardianEmail: string
  guardianPhone: string
  attendance: string
  studentCode: string
}

export default function StudentsPage() {
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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
      fetchStudents()
    }
  }, [user])

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token')
      console.log('Fetching students with token:', token ? 'exists' : 'missing')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/teacher/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched students:', data)
        setStudents(data)
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch students:', response.status, errorText)
        // Fallback to mock data if API fails
        setStudents([
          {
            id: 1,
            firstName: 'Alice',
            lastName: 'Johnson',
            grade: 'KG-A',
            guardianName: 'Sarah Johnson',
            guardianEmail: 'sarah.johnson@email.com',
            guardianPhone: '+1-234-567-8901',
            attendance: '95%',
            studentCode: 'KG2024001'
          },
          {
            id: 2,
            firstName: 'Bob',
            lastName: 'Smith',
            grade: 'KG-B',
            guardianName: 'Mike Smith',
            guardianEmail: 'mike.smith@email.com',
            guardianPhone: '+1-234-567-8902',
            attendance: '92%',
            studentCode: 'KG2024002'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      // Fallback to mock data
      setStudents([
        {
          id: 1,
          firstName: 'Alice',
          lastName: 'Johnson',
          grade: 'KG-A',
          guardianName: 'Sarah Johnson',
          guardianEmail: 'sarah.johnson@email.com',
          guardianPhone: '+1-234-567-8901',
          attendance: '95%',
          studentCode: 'KG2024001'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Baby className="h-8 w-8 text-pink-600 mr-3" />
            Students
          </h1>
          <p className="text-gray-600 mt-2">Manage your class students and their information</p>
        </div>

        {students.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Baby className="h-12 w-12 text-pink-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-500">No students have been assigned to your class yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <div key={student.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                      <Baby className="h-6 w-6 text-pink-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{student.grade}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {student.guardianEmail}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {student.guardianPhone}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    Parent: {student.guardianName}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                    ID: {student.studentCode}
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
