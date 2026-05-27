import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// API endpoints based on document specifications
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const API_BASE = `${apiUrl}/api/teacher`

// Types based on database schema
interface Class {
  id: string
  name: string
  classLevel: string
  academicYear: string
}

interface Student {
  studentId: string
  fullName: string
  classId: string
  guardianId: string
  studentCode: string
  isActive: boolean
}

interface Homework {
  id: string
  subject: string
  instructions: string
  dueDate: string
  classId: string
  teacherId: string
  createdAt: string
  views: number
  totalStudents: number
  feedbackCount: number
  status: 'upcoming' | 'due-soon' | 'overdue'
}

interface ViewTracking {
  studentName: string
  viewedStatus: 'Viewed' | 'Not viewed'
  viewedAt: string | null
  feedback: string | null
}

interface PickupRequest {
  id: string
  studentName: string
  className: string
  authorizedPerson: string
  pickupDate: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  requestedDate: string
}

// API functions
const api = {
  // Module 1: Get classes assigned to teacher
  getClasses: async (): Promise<Class[]> => {
    const response = await fetch(`${API_BASE}/classes`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch classes')
    const result = await response.json()
    return result.data?.classes || result.data || result || []
  },

  // Module 1: Get students in class
  getStudents: async (classId: string): Promise<Student[]> => {
    const response = await fetch(`${API_BASE}/classes/${classId}/students`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch students')
    const result = await response.json()
    return result.data?.students || result.data || result || []
  },

  // Module 2: Create homework
  createHomework: async (data: {
    subject: string
    instructions: string
    dueDate: string
    classId: string
  }): Promise<Homework> => {
    const response = await fetch(`${API_BASE}/homework`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to create homework')
    const result = await response.json()
    return result.data?.homework || result.data || result
  },

  // Module 3: Get homework list
  getHomework: async (classId?: string): Promise<Homework[]> => {
    const url = classId ? `${API_BASE}/homework?classId=${classId}` : `${API_BASE}/homework`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch homework')
    const result = await response.json()
    return result.data?.homework || result.data || result || []
  },

  // Module 4: Get homework details
  getHomeworkDetails: async (homeworkId: string): Promise<Homework & { viewTracking: ViewTracking[] }> => {
    const response = await fetch(`${API_BASE}/homework/${homeworkId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch homework details')
    const result = await response.json()
    return result.data?.homework || result.data || result
  },

  // Module 4: Get view tracking
  getViewTracking: async (homeworkId: string): Promise<ViewTracking[]> => {
    const response = await fetch(`${API_BASE}/homework/${homeworkId}/views`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch view tracking')
    const result = await response.json()
    return result.data?.views || result.data || result || []
  },

  // Module 4: Get guardian feedback
  getGuardianFeedback: async (homeworkId: string): Promise<ViewTracking[]> => {
    const response = await fetch(`${API_BASE}/homework/${homeworkId}/feedback`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch guardian feedback')
    const result = await response.json()
    return result.data?.feedback || result.data || result || []
  },

  // Module 5: Get pickup requests (read-only)
  getPickupRequests: async (): Promise<PickupRequest[]> => {
    const response = await fetch(`${API_BASE}/pickup-requests`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch pickup requests')
    const result = await response.json()
    return result.data?.pickupRequests || result.data || result || []
  },
}

// React Query hooks
export const useTeacherClasses = () => {
  return useQuery({
    queryKey: ['teacher-classes'],
    queryFn: api.getClasses,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useTeacherStudents = (classId: string) => {
  return useQuery({
    queryKey: ['teacher-students', classId],
    queryFn: () => api.getStudents(classId),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  })
}

export const useCreateHomework = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createHomework,
    onSuccess: () => {
      console.log('Homework created successfully!')
      queryClient.invalidateQueries({ queryKey: ['teacher-homework'] })
    },
    onError: (error) => {
      console.error(`Failed to create homework: ${error.message}`)
    }
  })
}

export const useTeacherHomework = (classId?: string) => {
  return useQuery({
    queryKey: ['teacher-homework', classId],
    queryFn: () => api.getHomework(classId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useHomeworkDetails = (homeworkId: string) => {
  return useQuery({
    queryKey: ['homework-details', homeworkId],
    queryFn: () => api.getHomeworkDetails(homeworkId),
    enabled: !!homeworkId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useViewTracking = (homeworkId: string) => {
  return useQuery({
    queryKey: ['view-tracking', homeworkId],
    queryFn: () => api.getViewTracking(homeworkId),
    enabled: !!homeworkId,
    staleTime: 1 * 60 * 1000,
  })
}

export const useGuardianFeedback = (homeworkId: string) => {
  return useQuery({
    queryKey: ['guardian-feedback', homeworkId],
    queryFn: () => api.getGuardianFeedback(homeworkId),
    enabled: !!homeworkId,
    staleTime: 1 * 60 * 1000,
  })
}

export const usePickupRequests = () => {
  return useQuery({
    queryKey: ['pickup-requests'],
    queryFn: api.getPickupRequests,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
