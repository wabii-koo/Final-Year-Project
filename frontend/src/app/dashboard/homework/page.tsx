'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HomeworkList from '../../../components/homework/HomeworkList'

export default function HomeworkPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      // For homeroom teachers, fetch their assigned class to filter
      if (parsedUser.role === 'homeroom_teacher') {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        fetch(`${apiUrl}/api/teacher/classes`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data?.classes?.length > 0) {
            parsedUser.classId = data.data.classes[0].classId
            setUser(parsedUser)
          }
        })
        .catch(error => console.error('Error fetching classes:', error))
        .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    } else {
      router.push('/auth/login')
    }
  }, [router])

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  const allowedRoles = ['teacher', 'homeroom_teacher', 'guardian']
  if (!allowedRoles.includes(user?.role)) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl max-w-lg mx-auto text-center font-bold">
        Access denied: You don't have permission to view homework assignments.
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <HomeworkList 
        role={user.role}
        userId={user.userId}
        classId={user.classId}
      />
    </div>
  )
}
