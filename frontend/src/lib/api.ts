import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/api/auth/login', credentials),
  
  register: (userData: {
    email: string
    password: string
    fullName: string
    phoneNo: string
    address: string
    relationshipType: string
  }) =>
    api.post('/api/auth/register', userData),
  
  logout: () =>
    api.post('/api/auth/logout'),
}

// Messages API
export const messagesAPI = {
  getMessages: (params?: { page?: number; limit?: number; unread_only?: boolean }) =>
    api.get('/api/messages', { params }),
  
  getConversations: () =>
    api.get('/api/messages/conversations'),
  
  sendMessage: (messageData: {
    receiverId: number
    content: string
    messageType?: string
  }) =>
    api.post('/api/messages', messageData),
  
  markAsRead: (messageId: number) =>
    api.put(`/api/messages/${messageId}/read`),
}

// Notifications API
export const notificationsAPI = {
  getNotifications: (params?: { page?: number; limit?: number; priority?: string }) =>
    api.get('/api/notifications', { params }),
  
  createNotification: (notificationData: {
    title: string
    content: string
    priority?: string
    recipientGroup: string
    scheduledFor?: string
  }) =>
    api.post('/api/notifications', notificationData),
  
  markAsRead: (notificationId: number) =>
    api.put(`/api/notifications/${notificationId}/read`),
}

// Events API
export const eventsAPI = {
  getEvents: (params?: { start_date?: string; end_date?: string }) =>
    api.get('/api/events', { params }),
  
  createEvent: (eventData: {
    title: string
    description: string
    eventDate: string
    eventType: string
    location?: string
    targetAudience?: string
  }) =>
    api.post('/api/events', eventData),
  
  updateEvent: (eventId: number, eventData: any) =>
    api.put(`/api/events/${eventId}`, eventData),
  
  deleteEvent: (eventId: number) =>
    api.delete(`/api/events/${eventId}`),
}

// Homework API
export const homeworkAPI = {
  getHomework: (params?: { student_id?: number; subject?: string }) =>
    api.get('/api/homework', { params }),
  
  createHomework: (homeworkData: {
    studentId: number
    subject: string
    instructions: string
    dueDate?: string
  }) =>
    api.post('/api/homework', homeworkData),
  
  addFeedback: (homeworkId: number, feedback: string) =>
    api.post(`/api/homework/${homeworkId}/feedback`, { feedback }),
}

// Report Cards API
export const reportCardsAPI = {
  getReportCards: (params?: { student_id?: number; term?: string; academic_year?: string }) =>
    api.get('/api/report-cards', { params }),
  
  createReportCard: (reportCardData: {
    studentId: number
    term: string
    academicYear: string
    subjectsGrades: Record<string, string>
    teacherComments?: string
    conductGrade?: string
    overallGrade?: string
  }) =>
    api.post('/api/report-cards', reportCardData),
  
  approveReportCard: (reportCardId: number) =>
    api.put(`/api/report-cards/${reportCardId}/approve`),
  
  unlockReportCard: (reportCardId: number) =>
    api.put(`/api/report-cards/${reportCardId}/unlock`),
}

// Pickup Requests API
export const pickupAPI = {
  getPickupRequests: (params?: { status?: string; date?: string }) =>
    api.get('/api/pickup-requests', { params }),
  
  createPickupRequest: (requestData: {
    studentId: number
    authorizedPersonName: string
    authorizedPersonRelationship: string
    authorizedPersonPhone: string
    authorizedPersonNationalId: string
    pickupDate: string
  }) =>
    api.post('/api/pickup-requests', requestData),
  
  processPickupRequest: (requestId: number, processData: {
    status: 'approved' | 'rejected'
    notes?: string
  }) =>
    api.post(`/api/pickup-requests/${requestId}/process`, processData),
}

// Users API
export const usersAPI = {
  getProfile: () =>
    api.get('/api/users/profile'),
  
  updateProfile: (profileData: {
    fullName?: string
    phoneNo?: string
    address?: string
  }) =>
    api.put('/api/users/profile', profileData),
  
  changePassword: (passwordData: {
    currentPassword: string
    newPassword: string
  }) =>
    api.put('/api/users/password', passwordData),
}

// Guardians API
export const guardiansAPI = {
  getRegistrations: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/api/guardians/registrations', { params }),
  
  approveRegistration: (registrationId: number) =>
    api.put(`/api/guardians/registrations/${registrationId}/approve`),
  
  rejectRegistration: (registrationId: number, rejectionReason: string) =>
    api.put(`/api/guardians/registrations/${registrationId}/reject`, { rejectionReason }),
}

// Student Import API
export const studentImportAPI = {
  importStudents: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/registration/registrar/students/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

export default api
