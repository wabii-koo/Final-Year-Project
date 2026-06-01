'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight,
  TrendingUp,
  Award,
  AlertCircle,
  Users,
  Plus,
  BookOpen,
  Check,
  X,
  FileSpreadsheet,
  Lock
} from 'lucide-react'

interface ReportCard {
  id: number
  reportcardId: number
  studentId: number
  studentName: string
  grade: string
  term: string
  academicYear: string
  status: 'pending' | 'approved' | 'unlocked'
  createdAt: string
  submittedBy: string
  subjectsGrades: Record<string, string>
  teacherComments: string
  conductGrade?: string
  overallGrade?: string
  student?: {
    guardianId: number
  }
  homeroomTeacher?: {
    userId: number | null
    fullName: string
    email: string
    phoneNo: string
  }
}

const SUBJECTS = ['English', 'Mathematics', 'Science', 'Amharic']

const GRADE_DESCRIPTIONS: Record<string, string> = {
  'A+': 'Outstanding / Exceptional',
  'A': 'Excellent',
  'A-': 'Very Excellent',
  'A−': 'Very Excellent',
  'B+': 'Very Good',
  'B': 'Good',
  'B-': 'Fairly Good',
  'B−': 'Fairly Good',
  'C+': 'Above Average Pass',
  'C': 'Average Pass',
  'C-': 'Minimum Average Pass',
  'C−': 'Minimum Average Pass',
  'D': 'Minimum Pass',
  'F': 'Fail'
}

const parseSubjectGrade = (value: string) => {
  if (!value) return { score: '', grade: 'A' }
  const match = value.match(/^(\d+)\s*\(([^)]+)\)$/)
  if (match) {
    return { score: match[1], grade: match[2] }
  }
  return { score: '', grade: value }
}

const getLetterGradeFromScore = (scoreVal: number): string => {
  if (scoreVal >= 90) return 'A+'
  if (scoreVal >= 85) return 'A'
  if (scoreVal >= 80) return 'A-'
  if (scoreVal >= 75) return 'B+'
  if (scoreVal >= 70) return 'B'
  if (scoreVal >= 65) return 'B-'
  if (scoreVal >= 60) return 'C+'
  if (scoreVal >= 50) return 'C'
  if (scoreVal >= 45) return 'C-'
  if (scoreVal >= 40) return 'D'
  return 'F'
}

export default function ReportCardsPage() {
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentFilterParam = searchParams.get('student')

  // User state
  const [user, setUser] = useState<any>(null)

  // Teacher specific state
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [activeTab, setActiveTab] = useState<'roster' | 'history'>('roster')
  const [modalTab, setModalTab] = useState<'transcript' | 'analytics'>('transcript')

  // Modal / Form state
  const [showModal, setShowModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [editingReportCard, setEditingReportCard] = useState<any>(null)
  const [formTerm, setFormTerm] = useState('Semester 1')
  const [formAcademicYear, setFormAcademicYear] = useState('2025-2026')
  const [formSubjectData, setFormSubjectData] = useState<Record<string, { score: string; grade: string }>>({
    'English': { score: '', grade: '—' },
    'Mathematics': { score: '', grade: '—' },
    'Science': { score: '', grade: '—' },
    'Amharic': { score: '', grade: '—' },
  })
  const [formConduct, setFormConduct] = useState('Excellent')
  const [formOverall, setFormOverall] = useState('')
  const [formComments, setFormComments] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Comment Board specific state
  const [commentsList, setCommentsList] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newCommentText, setNewCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const initPage = async () => {
      try {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')
        
        if (!token || !userData) {
          router.push('/auth/login')
          return
        }

        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        
        // Fetch report cards visible to this user
        const response = await fetch(`${apiUrl}/api/report-cards`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setReportCards(data.data.reportCards || [])
        } else {
          setError('Failed to fetch report cards')
        }

        // If teacher, fetch their classrooms
        if (parsedUser.role === 'teacher' || parsedUser.role === 'homeroom_teacher') {
          const classRes = await fetch(`${apiUrl}/api/teacher/classes`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (classRes.ok) {
            const classData = await classRes.json()
            const fetchedClasses = classData.data?.classes || classData.data || []
            setClassrooms(fetchedClasses)
            if (fetchedClasses.length > 0) {
              setSelectedClassId(fetchedClasses[0].classId || fetchedClasses[0].id)
            }
          }
        }
      } catch (err) {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    initPage()
  }, [router])

  // Fetch students when selected classroom changes
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([])
      return
    }

    const fetchStudents = async () => {
      setLoadingStudents(true)
      try {
        const token = localStorage.getItem('token')
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/teacher/classes/${selectedClassId}/students`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setStudents(data || [])
        } else {
          setError('Failed to fetch class students')
        }
      } catch (err) {
        setError('Network error. Failed to load students.')
      } finally {
        setLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [selectedClassId])

  const refreshReportCards = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/report-cards`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setReportCards(data.data.reportCards || [])
      }
    } catch (err) {
      console.error('Error refreshing report cards:', err)
    }
  }

  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/report-cards/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setSuccess('Report card approved successfully!')
        setTimeout(() => setSuccess(''), 3000)
        refreshReportCards()
      } else {
        setError('Failed to approve report card')
      }
    } catch (err) {
      setError('Failed to approve')
    }
  }

  const handleReject = async (id: number, reason: string = '') => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/report-cards/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        setSuccess('Report card sent back for revision.')
        setTimeout(() => setSuccess(''), 3000)
        refreshReportCards()
      } else {
        setError('Failed to send back for revision')
      }
    } catch (err) {
      setError('Failed to reject')
    }
  }

  const loadTermData = (studentId: number, termStr: string) => {
    const studentIdToMatch = Number(studentId)
    const existing = reportCards.find(rc => 
      Number(rc.studentId) === studentIdToMatch && 
      rc.term === termStr
    )
    
    if (existing) {
      setEditingReportCard(existing)
      setFormAcademicYear(existing.academicYear)
      
      const parsedGrades: Record<string, { score: string; grade: string }> = {}
      SUBJECTS.forEach(subject => {
        const val = existing.subjectsGrades?.[subject] || ''
        parsedGrades[subject] = parseSubjectGrade(val)
      })
      setFormSubjectData(parsedGrades)
      
      setFormConduct(existing.conductGrade || 'Excellent')
      setFormComments(existing.teacherComments || '')

      const scores = Object.values(parsedGrades)
        .map(d => d.score)
        .filter(s => s !== '')
        .map(s => parseInt(s, 10))
        .filter(s => !isNaN(s))

      if (scores.length > 0) {
        const average = Math.round(scores.reduce((sum, val) => sum + val, 0) / scores.length)
        const calculatedOverall = getLetterGradeFromScore(average)
        setFormOverall(`${average} (${calculatedOverall})`)
      } else {
        setFormOverall(existing.overallGrade || '')
      }
    } else {
      setEditingReportCard(null)
      const defaultGrades: Record<string, { score: string; grade: string }> = {}
      SUBJECTS.forEach(subject => {
        defaultGrades[subject] = { score: '', grade: '—' }
      })
      setFormSubjectData(defaultGrades)
      
      setFormConduct('Excellent')
      setFormOverall('')
      setFormComments('')
    }
  }

  const openFillModal = (student: any) => {
    setSelectedStudent(student)
    setModalTab('transcript')
    setFormTerm('Semester 1')
    loadTermData(student.id || student.studentId, 'Semester 1')
    setShowModal(true)
  }

  const openViewModal = (card: any) => {
    setSelectedStudent({
      id: card.studentId,
      studentId: card.studentId,
      fullName: card.studentName || card.student?.fullName || 'Unknown Student'
    })
    setModalTab('transcript')
    setFormTerm(card.term)
    setFormAcademicYear(card.academicYear)
    
    const parsedGrades: Record<string, { score: string; grade: string }> = {}
    SUBJECTS.forEach(subject => {
      const val = card.subjectsGrades?.[subject] || ''
      parsedGrades[subject] = parseSubjectGrade(val)
    })
    setFormSubjectData(parsedGrades)
    
    setFormConduct(card.conductGrade || 'Excellent')
    setFormComments(card.teacherComments || '')

    // Recalculate average on load if scores exist
    const scores = Object.values(parsedGrades)
      .map(d => d.score)
      .filter(s => s !== '')
      .map(s => parseInt(s, 10))
      .filter(s => !isNaN(s))

    if (scores.length > 0) {
      const average = Math.round(scores.reduce((sum, val) => sum + val, 0) / scores.length)
      const calculatedOverall = getLetterGradeFromScore(average)
      setFormOverall(`${average} (${calculatedOverall})`)
    } else {
      setFormOverall(card.overallGrade || '')
    }
    
    setEditingReportCard(card)
    setShowModal(true)
  }

  const fetchComments = async (otherUserId: number) => {
    try {
      setLoadingComments(true)
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/messages?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const allMsgs: any[] = data.data?.messages || []
        const thread = allMsgs.filter(m => 
          ((m.senderId === user.userId && m.receiverId === otherUserId) ||
           (m.senderId === otherUserId && m.receiverId === user.userId)) &&
          m.messageType === 'report_card'
        )
        thread.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
        setCommentsList(thread)
      }
    } catch (err) {
      console.error('Failed to load comments:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleSendComment = async (receiverId: number) => {
    if (!newCommentText.trim()) return
    try {
      setSendingComment(true)
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId,
          content: newCommentText,
          messageType: 'report_card'
        })
      })
      if (response.ok) {
        setNewCommentText('')
        fetchComments(receiverId)
      }
    } catch (err) {
      console.error('Failed to send comment:', err)
    } finally {
      setSendingComment(false)
    }
  }

  useEffect(() => {
    if (showModal && user && editingReportCard) {
      let recipientId = null
      if (user.role === 'guardian') {
        recipientId = editingReportCard.homeroomTeacher?.userId
      } else if (user.role === 'teacher' || user.role === 'homeroom_teacher') {
        recipientId = editingReportCard.student?.guardianId
      }
      
      if (recipientId) {
        fetchComments(recipientId)
      } else {
        setCommentsList([])
      }
    } else {
      setCommentsList([])
    }
  }, [showModal, editingReportCard, user])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      
      const combinedGrades: Record<string, string> = {}
      SUBJECTS.forEach(subject => {
        const { score, grade } = formSubjectData[subject] || { score: '', grade: 'A' }
        combinedGrades[subject] = score ? `${score} (${grade})` : grade
      })

      const payload = {
        studentId: selectedStudent.studentId || selectedStudent.id,
        term: formTerm,
        academicYear: formAcademicYear,
        subjectsGrades: combinedGrades,
        teacherComments: formComments,
        conductGrade: formConduct,
        overallGrade: formOverall
      }

      let response;
      if (editingReportCard) {
        response = await fetch(`${apiUrl}/api/report-cards/${editingReportCard.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
      } else {
        response = await fetch(`${apiUrl}/api/report-cards`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
      }

      const resData = await response.json()
      
      if (response.ok && resData.success) {
        setSuccess(editingReportCard ? 'Report card updated successfully!' : 'Report card submitted successfully!')
        setShowModal(false)
        refreshReportCards()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(resData.message || 'Failed to submit report card')
      }
    } catch (err) {
      setError('Network error. Failed to save report card.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubjectScoreChange = (subject: string, score: string) => {
    if (score !== '') {
      if (score.includes('-')) return;
      const parsedScore = parseInt(score, 10);
      if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) return;
    }

    let grade = '—'
    if (score !== '') {
      const parsedScore = parseInt(score, 10)
      if (!isNaN(parsedScore)) {
        grade = getLetterGradeFromScore(parsedScore)
      }
    }

    const updatedSubjectData = {
      ...formSubjectData,
      [subject]: { ...formSubjectData[subject], score, grade }
    }

    setFormSubjectData(updatedSubjectData)

    // Dynamic Overall Grade calculation based on filled subject scores
    const scores = Object.values(updatedSubjectData)
      .map(d => d.score)
      .filter(s => s !== '')
      .map(s => parseInt(s, 10))
      .filter(s => !isNaN(s))

    if (scores.length > 0) {
      const average = Math.round(scores.reduce((sum, val) => sum + val, 0) / scores.length)
      const calculatedOverall = getLetterGradeFromScore(average)
      setFormOverall(`${average} (${calculatedOverall})`)

      // Automatically fill conduct grade based on average score
      let autoConduct = 'Excellent'
      if (average >= 90) autoConduct = 'Excellent'
      else if (average >= 80) autoConduct = 'Very Good'
      else if (average >= 70) autoConduct = 'Good'
      else if (average >= 50) autoConduct = 'Satisfactory'
      else autoConduct = 'Needs Improvement'
      setFormConduct(autoConduct)
    } else {
      setFormOverall('')
      setFormConduct('Excellent')
    }
  }

  const handleSubjectGradeChange = (subject: string, grade: string) => {
    setFormSubjectData(prev => ({
      ...prev,
      [subject]: { ...prev[subject], grade }
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="animate-pulse text-brand-primary font-black text-xl uppercase tracking-tighter">
          Loading Academic Records...
        </div>
      </div>
    )
  }

  const isTeacher = user?.role === 'teacher' || user?.role === 'homeroom_teacher'
  const isDirector = user?.role === 'director' || user?.role === 'registrar'

  const selectedClass = classrooms.find(cls => (cls.classId || cls.id || '').toString() === selectedClassId.toString())
  const isHomeroomTeacherOfSelectedClass = selectedClass ? Number(selectedClass.homeroomTeacherId) === Number(user?.userId) : false

  // Filter records based on search query and optional student query param
  const filteredReportCards = reportCards.filter(card => {
    const matchesSearch = card.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          card.grade.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStudentParam = studentFilterParam ? card.studentId.toString() === studentFilterParam : true
    return matchesSearch && matchesStudentParam;
  })

  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden font-sans">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none rotate-12">
        <Award size={300} className="text-brand-accent" />
      </div>

      <div className="relative mx-auto max-w-7xl p-6 lg:p-8 space-y-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-brand-white p-10 rounded-[3rem] shadow-xl shadow-brand-primary/5 border border-brand-100">
          <div>
            <h1 className="text-4xl font-black text-brand-heading tracking-tight">Academic Performance</h1>
            <p className="text-brand-text font-medium mt-2 text-lg">
              {isTeacher 
                ? 'Create, manage and edit terminal report cards for your classrooms.'
                : 'Verification, review and archive of student terminal report cards.'
              }
            </p>
          </div>
          {isDirector && (
            <div className="flex gap-4">
              <Link href="/dashboard/report-cards/pending" className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all">
                Pending Approval ({reportCards.filter(c => c.status === 'pending').length})
              </Link>
            </div>
          )}
        </header>

        {/* Success/Error Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-[2rem] flex items-center gap-4 animate-fadeIn">
            <AlertCircle size={24} />
            <p className="font-bold">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-brand-success/20 text-brand-success p-6 rounded-[2rem] flex items-center gap-4 animate-fadeIn">
            <CheckCircle size={24} />
            <p className="font-bold">{success}</p>
          </div>
        )}

        {/* TEACHER WORKSPACE */}
        {isTeacher && (
          <div className="space-y-6">
            {/* Tabs & Class Selector */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-3xl border border-brand-100 shadow-sm">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('roster')}
                  className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                    activeTab === 'roster' 
                      ? 'bg-brand-primary text-white shadow-md' 
                      : 'hover:bg-brand-bg text-brand-text'
                  }`}
                >
                  Roster & Grade Entry
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                    activeTab === 'history' 
                      ? 'bg-brand-primary text-white shadow-md' 
                      : 'hover:bg-brand-bg text-brand-text'
                  }`}
                >
                  Submitted History ({reportCards.length})
                </button>
              </div>

              {activeTab === 'roster' && (
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <span className="text-xs font-black text-brand-heading uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                    <Users size={16} className="text-brand-primary" />
                    Classroom:
                  </span>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="bg-brand-bg border border-brand-100 rounded-xl px-4 py-2.5 text-xs font-bold text-brand-heading outline-none focus:border-brand-primary w-full md:w-56"
                  >
                    {classrooms.map((cls) => (
                      <option key={cls.classId || cls.id} value={cls.classId || cls.id}>
                        {cls.classLevel || cls.className} ({cls.totalStudents || 0} Students)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Tab 1: Student Roster Renders */}
            {activeTab === 'roster' && (
              <div className="bg-brand-white rounded-[3.5rem] shadow-2xl shadow-brand-primary/5 border border-brand-100 overflow-hidden">
                <div className="p-8 border-b border-brand-bg flex items-center justify-between bg-brand-bg/20">
                  <h2 className="text-xl font-black text-brand-heading uppercase tracking-widest flex items-center gap-3">
                    <FileSpreadsheet className="text-brand-primary" />
                    Student Roster
                  </h2>
                </div>

                {loadingStudents ? (
                  <div className="py-24 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
                    <p className="text-brand-text font-medium italic">Loading student list...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="py-24 text-center">
                    <Users className="mx-auto text-brand-accent/20 mb-6" size={80} />
                    <h3 className="text-2xl font-black text-brand-heading">No students enrolled</h3>
                    <p className="text-brand-text font-medium mt-2">Select another classroom or contact the registrar.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-brand-bg/10">
                        <tr>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Student</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Student Code</th>
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Semester 1</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-brand-text">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-bg/30">
                        {students.map((student) => {
                          const rc1 = reportCards.find(card => (Number(card.studentId) === Number(student.id) || Number(card.studentId) === Number(student.studentId)) && card.term === 'Semester 1')
                          return (
                            <tr key={student.id || student.studentId} className="hover:bg-brand-bg/20 transition-colors group">
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary font-black text-sm">
                                    {student.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-brand-heading">{student.fullName}</p>
                                    <p className="text-[10px] text-brand-text font-semibold uppercase">Class ID: {selectedClassId}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-sm font-bold text-brand-heading">
                                {student.studentCode || `KG${student.id || student.studentId}`}
                              </td>
                              <td className="px-8 py-6">
                                {rc1 && (
                                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit ${
                                    rc1.status === 'approved' 
                                      ? 'bg-brand-success/10 text-brand-success border-brand-success/20'
                                      : rc1.status === 'unlocked'
                                      ? 'bg-red-50 text-red-600 border-red-100'
                                      : 'bg-brand-accent/10 text-brand-primary border-brand-accent/20'
                                  }`}>
                                    {rc1.status === 'approved' && <Lock size={12} />}
                                    {rc1.status === 'unlocked' ? 'Revision' : rc1.status}
                                  </span>
                                )}
                              </td>

                              <td className="px-8 py-6 text-right">
                                {isHomeroomTeacherOfSelectedClass ? (
                                  <button 
                                    onClick={() => openFillModal(student)}
                                    className="px-4 py-2 bg-brand-primary text-white shadow-lg shadow-brand-primary/10 hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-wider rounded-xl"
                                  >
                                    Manage Grades
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => openFillModal(student)}
                                    className="px-4 py-2 border border-slate-300 text-slate-500 hover:bg-slate-50 transition-all text-xs font-black uppercase tracking-wider rounded-xl"
                                  >
                                    View Grades
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Submitted History */}
            {activeTab === 'history' && (
              <div className="bg-brand-white rounded-[3.5rem] shadow-2xl shadow-brand-primary/5 border border-brand-100 overflow-hidden">
                <div className="p-8 border-b border-brand-bg flex items-center justify-between bg-brand-bg/20">
                  <h2 className="text-xl font-black text-brand-heading uppercase tracking-widest flex items-center gap-3">
                    <Award className="text-brand-primary" />
                    All Submissions
                  </h2>
                </div>

                {reportCards.length === 0 ? (
                  <div className="py-24 text-center">
                    <FileText className="mx-auto text-brand-accent/20 mb-6" size={80} />
                    <h3 className="text-2xl font-black text-brand-heading">No submissions yet</h3>
                    <p className="text-brand-text font-medium mt-2">Any report cards you submit will be listed here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-brand-bg/10">
                        <tr>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Student</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Academic Context</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Overall Grade</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Status</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Date Filled</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-bg/30">
                        {reportCards.map((card) => (
                          <tr key={card.id} className="hover:bg-brand-bg/20 transition-colors group">
                            <td className="px-8 py-6">
                              <p className="text-sm font-black text-brand-heading">{card.studentName}</p>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-bold text-brand-heading">{card.term} • {card.academicYear}</p>
                            </td>
                            <td className="px-8 py-6">
                               <span className="px-3.5 py-1.5 rounded-xl bg-brand-bg border border-brand-100 flex items-center justify-center font-black text-xs text-brand-primary w-fit min-w-[3.5rem] whitespace-nowrap shadow-sm">
                                 {card.overallGrade || 'N/A'}
                               </span>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                card.status === 'approved' 
                                  ? 'bg-brand-success/10 text-brand-success border-brand-success/20'
                                  : card.status === 'unlocked'
                                  ? 'bg-red-50 text-red-600 border-red-100'
                                  : 'bg-brand-accent/10 text-brand-primary border-brand-accent/20'
                              }`}>
                                {card.status === 'unlocked' ? 'unlocked for revision' : card.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-xs text-brand-text font-semibold uppercase">
                              {new Date(card.createdAt || card.id).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* DIRECTOR / ARCHIVE VIEW */}
        {!isTeacher && (() => {
          // Group filteredReportCards by studentId so each student gets one row
          const studentMap = new Map<number, { studentName: string; grade: string; submittedBy: string; rc1: ReportCard | undefined; rc2: ReportCard | undefined }>()
          filteredReportCards.forEach(card => {
            if (!studentMap.has(card.studentId)) {
              studentMap.set(card.studentId, {
                studentName: card.studentName,
                grade: card.grade,
                submittedBy: card.submittedBy,
                rc1: undefined,
                rc2: undefined,
              })
            }
            const entry = studentMap.get(card.studentId)!
            if (card.term === 'Semester 1') entry.rc1 = card
            if (card.term === 'Semester 2') entry.rc2 = card
          })
          const groupedStudents = Array.from(studentMap.entries())

          return (
            <div className="bg-brand-white rounded-[3.5rem] shadow-2xl shadow-brand-primary/5 border border-brand-100 overflow-hidden">
              <div className="p-8 border-b border-brand-bg flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-bg/20">
                <h2 className="text-xl font-black text-brand-heading uppercase tracking-widest flex items-center gap-3">
                  <Award className="text-brand-primary" />
                  Directory of Records
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent" size={16} />
                  <input
                    type="text"
                    placeholder="Filter by student..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-brand-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                {groupedStudents.length === 0 ? (
                  <div className="py-24 text-center">
                    <FileText className="mx-auto text-brand-accent/20 mb-6" size={80} />
                    <h3 className="text-2xl font-black text-brand-heading">No results in archive</h3>
                    <p className="text-brand-text font-medium mt-2">Transcripts will populate once teacher validation is complete.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-brand-bg/10">
                      <tr>
                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Student</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Class</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Semester 1</th>
                        {(!isTeacher) && <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-brand-text">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-bg/30">
                      {groupedStudents.map(([studentId, entry]) => (
                        <tr key={studentId} className="hover:bg-brand-bg/20 transition-colors group">
                          {/* Student Name */}
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary font-black text-sm">
                                {entry.studentName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-black text-brand-heading">{entry.studentName}</p>
                              </div>
                            </div>
                          </td>

                          {/* Grade / Class */}
                          <td className="px-8 py-6">
                            <p className="text-sm font-bold text-brand-heading">{entry.grade}</p>
                          </td>

                          {/* Semester 1 Status */}
                          <td className="px-8 py-6">
                            {entry.rc1 && (
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit ${
                                entry.rc1.status === 'approved'
                                  ? 'bg-brand-success/10 text-brand-success border-brand-success/20'
                                  : entry.rc1.status === 'unlocked'
                                  ? 'bg-red-50 text-red-600 border-red-100'
                                  : 'bg-brand-accent/10 text-brand-primary border-brand-accent/20'
                              }`}>
                                {entry.rc1.status === 'approved' && <Lock size={12} />}
                                {entry.rc1.status === 'unlocked' ? 'Revision' : entry.rc1.status}
                              </span>
                            )}
                          </td>


                          {/* Actions — review pending first; otherwise view the most recent card */}
                          {(!isTeacher) && (
                            <td className="px-8 py-6 text-right">
                              <div className="flex gap-2 justify-end">
                                {entry.rc1 && (
                                  <button
                                    onClick={() => openViewModal(entry.rc1!)}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 ${
                                      isDirector && entry.rc1.status === 'pending'
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg'
                                        : 'border border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10'
                                    }`}
                                  >
                                    {isDirector && entry.rc1.status === 'pending' ? 'Review S1' : 'View S1'}
                                  </button>
                                )}
                                {!entry.rc1 && (
                                  <span className="text-xs text-slate-400 italic">No cards yet</span>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )
        })()}

      </div>

      {/* DYNAMIC FORM MODAL OVERLAY */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => { if (!submitting) setShowModal(false) }}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-brand-100 overflow-hidden z-10 max-h-[90vh] flex flex-col animate-fadeIn">
            {/* Modal Header */}
            <div className="p-6 bg-brand-bg/50 border-b border-brand-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-brand-heading">
                  {user?.role === 'guardian'
                    ? 'Grade Report Card'
                    : isDirector 
                    ? (editingReportCard?.status === 'pending' ? 'Review Report Card' : 'View Report Card')
                    : (editingReportCard ? 'Edit Report Card' : 'Fill Report Card')
                  }
                </h3>
                <p className="text-xs text-brand-text font-bold uppercase mt-1">Student: {selectedStudent.fullName}</p>
                {user?.role === 'guardian' && editingReportCard && (
                  <span className={`inline-flex items-center gap-1 mt-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    editingReportCard.status === 'approved'
                      ? 'bg-brand-success/10 text-brand-success border-brand-success/20'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {editingReportCard.status === 'approved' ? <CheckCircle size={10} /> : <Clock size={10} />}
                    {editingReportCard.status === 'approved' ? 'Approved & Certified' : 'Pending Endorsement'}
                  </span>
                )}
              </div>
              <button 
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="p-2 text-brand-text hover:text-brand-heading rounded-full hover:bg-brand-bg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sub-navigation Tabs */}
            {(() => {
              const studentIdToMatch = selectedStudent.studentId || selectedStudent.id;
              const hasAnyReportCard = reportCards.some(rc => Number(rc.studentId) === Number(studentIdToMatch));
              if (!hasAnyReportCard) return null;
              return (
                <div className="flex border-b border-brand-100 bg-brand-bg/20 px-6">
                  <button
                    type="button"
                    onClick={() => setModalTab('transcript')}
                    className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                      modalTab === 'transcript'
                        ? 'border-brand-primary text-brand-primary'
                        : 'border-transparent text-brand-text hover:text-brand-heading'
                    }`}
                  >
                    Academic Transcript
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('analytics')}
                    className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                      modalTab === 'analytics'
                        ? 'border-brand-primary text-brand-primary'
                        : 'border-transparent text-brand-text hover:text-brand-heading'
                    }`}
                  >
                    Semester Progress Analytics
                  </button>
                </div>
              );
            })()}

            {/* Modal Scrollable Body */}
            {modalTab === 'analytics' ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-fadeIn bg-brand-bg/10">
                {(() => {
                  const studentIdToMatch = selectedStudent.studentId || selectedStudent.id;
                  const studentReportCards = reportCards.filter(rc => Number(rc.studentId) === Number(studentIdToMatch));
                  const sem1 = studentReportCards.find(rc => rc.term === 'Semester 1');
                  const sem2 = studentReportCards.find(rc => rc.term === 'Semester 2');

                  const parseOverallScore = (val: string | undefined) => {
                    if (!val) return null;
                    const parsed = parseSubjectGrade(val);
                    if (parsed.score) return parseInt(parsed.score);
                    const num = parseInt(val);
                    return isNaN(num) ? null : num;
                  };

                  const sem1Avg = parseOverallScore(sem1?.overallGrade);
                  const sem2Avg = parseOverallScore(sem2?.overallGrade);
                  const avgDelta = (sem1Avg !== null && sem2Avg !== null) ? (sem2Avg - sem1Avg) : null;

                  return (
                    <div className="space-y-6">
                      {/* Top Overall cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white border border-brand-100 rounded-2xl p-5 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Semester 1 Average</span>
                          <div className="text-3xl font-black text-brand-heading mt-2">
                            {sem1Avg !== null ? `${sem1Avg}%` : '—'}
                          </div>
                          {sem1?.overallGrade && (
                            <span className="text-[10px] text-brand-primary font-bold uppercase mt-1 block">
                              Grade: {parseSubjectGrade(sem1.overallGrade).grade}
                            </span>
                          )}
                        </div>

                        <div className="bg-white border border-brand-100 rounded-2xl p-5 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Semester 2 Average</span>
                          <div className="text-3xl font-black text-brand-heading mt-2">
                            {sem2Avg !== null ? `${sem2Avg}%` : '—'}
                          </div>
                          {sem2?.overallGrade ? (
                            <span className="text-[10px] text-brand-primary font-bold uppercase mt-1 block">
                              Grade: {parseSubjectGrade(sem2.overallGrade).grade}
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-bold uppercase mt-1 block italic animate-pulse">
                              Pending Submission
                            </span>
                          )}
                        </div>

                        <div className={`rounded-2xl p-5 border shadow-sm ${
                          avgDelta !== null 
                            ? (avgDelta >= 0 
                               ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                               : 'bg-rose-50 border-rose-100 text-rose-800') 
                            : 'bg-white border-brand-100 text-brand-heading'
                        }`}>
                          <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Yearly Progress</span>
                          <div className="text-2xl font-black mt-2 flex items-center gap-2">
                            {avgDelta !== null ? (
                              <>
                                <TrendingUp className={`transition-transform ${avgDelta < 0 ? 'rotate-180 text-rose-500' : 'text-emerald-500'}`} size={24} />
                                <span>{avgDelta >= 0 ? `+${avgDelta}` : avgDelta} pts</span>
                              </>
                            ) : (
                              <span className="text-xs font-bold text-slate-500">Need both semesters</span>
                            )}
                          </div>
                          {avgDelta !== null && (
                            <span className="text-[10px] font-bold uppercase mt-1 block">
                              {avgDelta >= 0 ? 'Performance Improved' : 'Performance Dropped'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Subject Comparison */}
                      <div>
                        <h4 className="text-[10px] font-black text-brand-heading uppercase tracking-widest mb-4 border-b border-brand-100 pb-2">Subject Performance Comparison</h4>
                        <div className="space-y-4">
                          {SUBJECTS.map(subject => {
                            const s1Val = sem1?.subjectsGrades?.[subject] || '';
                            const s1Parsed = parseSubjectGrade(s1Val);
                            const s1Score = s1Parsed.score ? parseInt(s1Parsed.score) : null;

                            const s2Val = sem2?.subjectsGrades?.[subject] || '';
                            const s2Parsed = parseSubjectGrade(s2Val);
                            const s2Score = s2Parsed.score ? parseInt(s2Parsed.score) : null;

                            const sDelta = (s1Score !== null && s2Score !== null) ? (s2Score - s1Score) : null;

                            return (
                              <div key={subject} className="bg-white border border-brand-100 rounded-2xl p-4 shadow-sm space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-black text-brand-heading">{subject}</span>
                                  {sDelta !== null ? (
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                      sDelta >= 0 
                                        ? 'bg-emerald-100 text-emerald-800' 
                                        : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {sDelta >= 0 ? `+${sDelta}` : sDelta} points
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Semester 2 Missing</span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {/* Semester 1 bar */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                      <span>Semester 1</span>
                                      <span>{s1Score !== null ? `${s1Score}/100 (${s1Parsed.grade})` : '—'}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                      <div 
                                        className="bg-brand-secondary h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${s1Score ?? 0}%` }}
                                      ></div>
                                    </div>
                                  </div>

                                  {/* Semester 2 bar */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                      <span>Semester 2</span>
                                      <span>{s2Score !== null ? `${s2Score}/100 (${s2Parsed.grade})` : '—'}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                      <div 
                                        className="bg-brand-primary h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${s2Score ?? 0}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Conduct & Comments Comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white border border-brand-100 rounded-2xl p-5 shadow-sm">
                          <h5 className="text-[10px] font-black text-brand-heading uppercase tracking-widest mb-3 border-b border-brand-100 pb-1.5">Conduct Grade</h5>
                          <div className="space-y-2 text-xs font-bold">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Semester 1:</span>
                              <span className="text-brand-heading">{sem1?.conductGrade || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Semester 2:</span>
                              <span className="text-brand-heading">{sem2?.conductGrade || '—'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-brand-100 rounded-2xl p-5 shadow-sm">
                          <h5 className="text-[10px] font-black text-brand-heading uppercase tracking-widest mb-3 border-b border-brand-100 pb-1.5">Semester Comments</h5>
                          <div className="space-y-3 text-xs font-medium italic text-slate-600">
                            <div>
                              <strong className="text-[9px] uppercase tracking-wider text-slate-400 not-italic block mb-0.5">Semester 1 Feedback:</strong>
                              "{sem1?.teacherComments || 'No feedback submitted.'}"
                            </div>
                            <div>
                              <strong className="text-[9px] uppercase tracking-wider text-slate-400 not-italic block mt-2 mb-0.5">Semester 2 Feedback:</strong>
                              "{sem2?.teacherComments || 'No feedback submitted.'}"
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Modal Footer Actions inside the analytics view */}
                <div className="pt-4 border-t border-brand-100 flex justify-end gap-3 bg-white">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 border border-slate-200 text-slate-500 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Read Only State warning */}
                {user?.role === 'guardian' ? (
                  <div className="bg-brand-primary/5 border border-brand-primary/10 text-brand-primary p-4 rounded-xl flex items-center gap-3 animate-fadeIn">
                    <BookOpen size={18} className="text-brand-primary" />
                    <p className="text-xs font-bold">You are viewing your child's grade report. Scores are read-only.</p>
                  </div>
                ) : isDirector && editingReportCard?.status === 'pending' ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 animate-fadeIn">
                    <Clock size={18} className="text-amber-600" />
                    <p className="text-xs font-bold">This report card is Pending. Please inspect the grades below and choose to Approve or Request Revision.</p>
                  </div>
                ) : editingReportCard?.status === 'approved' ? (
                  <div className="bg-brand-success/10 border border-brand-success/20 text-brand-success p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle size={18} />
                    <p className="text-xs font-bold">This report card is Approved and cannot be modified (Read-Only).</p>
                  </div>
                ) : !isHomeroomTeacherOfSelectedClass && isTeacher ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle size={18} className="text-amber-600" />
                    <p className="text-xs font-bold">You are viewing this class as a Subject Teacher. Only the homeroom teacher can fill or modify report cards.</p>
                  </div>
                ) : null}

                {editingReportCard?.status === 'unlocked' && editingReportCard?.principalComments && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-2xl space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-red-700">
                      <AlertCircle size={18} />
                      Director Rejection Feedback:
                    </div>
                    <p className="text-xs font-bold leading-relaxed bg-white/60 p-3 rounded-xl border border-red-100 italic">
                      "{editingReportCard.principalComments}"
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Term */}
                  <div>
                    <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest mb-2">Academic Term</label>
                    <select
                      value={formTerm}
                      onChange={(e) => {
                        const newTerm = e.target.value;
                        setFormTerm(newTerm);
                        const sId = selectedStudent.studentId || selectedStudent.id;
                        loadTermData(sId, newTerm);
                      }}
                      disabled={submitting || user?.role === 'guardian'}
                      className="w-full bg-brand-bg border border-brand-100 rounded-xl px-4 py-3 text-xs font-bold text-brand-heading outline-none focus:border-brand-primary"
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                    </select>
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest mb-2">Academic Year</label>
                    <input
                      type="text"
                      value={formAcademicYear}
                      onChange={(e) => setFormAcademicYear(e.target.value)}
                      disabled={submitting || editingReportCard?.status === 'approved' || !isHomeroomTeacherOfSelectedClass || user?.role === 'guardian'}
                      required
                      className="w-full bg-brand-bg border border-brand-100 rounded-xl px-4 py-3 text-xs font-bold text-brand-heading outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                {/* Subjects & Grades */}
                <div>
                  <h4 className="text-[10px] font-black text-brand-heading uppercase tracking-widest mb-4 border-b border-brand-100 pb-2">Subject Performance (Score & Grade)</h4>
                  <div className="space-y-3">
                    {SUBJECTS.map((subject) => (
                      <div key={subject} className="flex flex-col sm:flex-row sm:items-center justify-between bg-brand-bg/30 p-4 rounded-2xl border border-brand-100 gap-3">
                        <span className="text-xs font-black text-brand-heading">{subject}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Score:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              required
                              value={formSubjectData[subject]?.score || ''}
                              onChange={(e) => handleSubjectScoreChange(subject, e.target.value)}
                              disabled={submitting || editingReportCard?.status === 'approved' || !isHomeroomTeacherOfSelectedClass || user?.role === 'guardian'}
                              placeholder="0-100"
                              className="bg-white border border-brand-100 rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-heading outline-none focus:border-brand-primary w-20 text-center"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Grade:</span>
                            <span className="bg-brand-primary/10 border border-brand-primary/20 px-3.5 py-1.5 rounded-lg text-xs font-black text-brand-primary min-w-[3.5rem] text-center" title={GRADE_DESCRIPTIONS[formSubjectData[subject]?.grade] || ''}>
                              {formSubjectData[subject]?.grade || '—'}
                            </span>
                            {GRADE_DESCRIPTIONS[formSubjectData[subject]?.grade] && (
                              <span className="text-[10px] text-slate-500 font-bold italic max-w-[150px] truncate" title={GRADE_DESCRIPTIONS[formSubjectData[subject]?.grade]}>
                                {GRADE_DESCRIPTIONS[formSubjectData[subject]?.grade]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Behavior & Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Conduct */}
                  <div>
                    <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest mb-2">Conduct Grade</label>
                    <select
                      value={formConduct}
                      onChange={(e) => setFormConduct(e.target.value)}
                      disabled={submitting || editingReportCard?.status === 'approved' || !isHomeroomTeacherOfSelectedClass || user?.role === 'guardian'}
                      className="w-full bg-brand-bg border border-brand-100 rounded-xl px-4 py-3 text-xs font-bold text-brand-heading outline-none focus:border-brand-primary"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Very Good">Very Good</option>
                      <option value="Good">Good</option>
                      <option value="Satisfactory">Satisfactory</option>
                      <option value="Needs Improvement">Needs Improvement</option>
                    </select>
                  </div>

                  {/* Overall */}
                  <div>
                    <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest mb-2">Overall Term Grade</label>
                    <div className="w-full bg-brand-bg border border-brand-100 rounded-xl px-4 py-3.5 text-xs font-black text-brand-primary flex items-center justify-between shadow-inner">
                      <span className="text-slate-400">Calculated Average:</span>
                      <span className="bg-brand-primary/10 border border-brand-primary/20 px-4 py-1.5 rounded-lg text-sm">
                        {formOverall || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Teacher Comments */}
                {!isDirector && (
                  <div>
                    <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest mb-2">Teacher's Comments on Student</label>
                    <textarea
                      rows={4}
                      value={formComments}
                      onChange={(e) => setFormComments(e.target.value)}
                      disabled={submitting || editingReportCard?.status === 'approved' || !isHomeroomTeacherOfSelectedClass || user?.role === 'guardian'}
                      placeholder="Provide comments about the student's cognitive, physical and social development during this term..."
                      className="w-full bg-brand-bg border border-brand-100 rounded-[1.25rem] p-4 text-xs font-medium text-brand-heading outline-none focus:border-brand-primary resize-none"
                    ></textarea>
                  </div>
                )}

                {/* Comment Board Section (visible to Guardians and Teachers) */}
                {(user?.role === 'guardian' || user?.role === 'teacher' || user?.role === 'homeroom_teacher') && editingReportCard && (
                  <div className="bg-brand-bg/50 border border-brand-100 rounded-[2rem] p-6 space-y-4 animate-fadeIn">
                    <h4 className="text-[10px] font-black text-brand-heading uppercase tracking-widest border-b border-brand-100 pb-2 flex items-center justify-between">
                      <span>Parent-Teacher Comment Board</span>
                      <span className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-[9px]">
                        {user?.role === 'guardian' 
                          ? `Teacher: ${editingReportCard.homeroomTeacher?.fullName || 'Sarah Smith'}` 
                          : `Parent: ${editingReportCard.studentName || 'Guardian'}`}
                      </span>
                    </h4>
                    
                    {/* Messages Feed */}
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                      {loadingComments ? (
                        <div className="py-6 text-center text-xs text-brand-text/60 animate-pulse font-bold">
                          Synchronizing Comment Feed...
                        </div>
                      ) : commentsList.length === 0 ? (
                        <div className="py-8 text-center text-xs text-brand-text/50 font-bold italic">
                          No comments recorded yet. Start the conversation below.
                        </div>
                      ) : (
                        commentsList.map((msg) => {
                          const isMe = msg.senderId === user?.userId
                          return (
                            <div 
                              key={msg.messageId} 
                              className={`flex flex-col max-w-[85%] rounded-2xl p-4 text-xs font-bold leading-relaxed shadow-sm transition-all hover:shadow-md ${
                                isMe 
                                  ? 'bg-brand-primary text-white ml-auto rounded-tr-none' 
                                  : 'bg-white border border-brand-100 text-brand-heading rounded-tl-none'
                              }`}
                            >
                              <div className="flex justify-between items-center gap-4 mb-1">
                                <span className={`text-[9px] uppercase tracking-wider font-black ${isMe ? 'text-white/80' : 'text-brand-secondary'}`}>
                                  {isMe ? 'You' : msg.senderName}
                                </span>
                                <span className={`text-[8px] ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                                  {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="font-semibold">{msg.content}</p>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Comment Input Box */}
                    <div className="flex gap-3 pt-2">
                      <input
                        type="text"
                        placeholder="Write a comment regarding this grade report..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        disabled={sendingComment}
                        className="flex-1 bg-white border border-brand-100 rounded-xl px-4 py-3 text-xs font-bold text-brand-heading outline-none focus:ring-2 focus:ring-brand-primary/10 placeholder-brand-text/40"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const recipientId = user?.role === 'guardian' 
                              ? editingReportCard.homeroomTeacher?.userId 
                              : editingReportCard.student?.guardianId
                            if (recipientId) handleSendComment(recipientId)
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={sendingComment || !newCommentText.trim()}
                        onClick={() => {
                          const recipientId = user?.role === 'guardian' 
                            ? editingReportCard.homeroomTeacher?.userId 
                            : editingReportCard.student?.guardianId
                          if (recipientId) handleSendComment(recipientId)
                        }}
                        className="bg-brand-primary text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-primary/10 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center whitespace-nowrap"
                      >
                        {sendingComment ? 'Sending...' : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-brand-100 flex justify-end gap-3 bg-white">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                    className="px-6 py-3 border border-slate-200 text-slate-500 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
                  >
                    {user?.role === 'guardian' || editingReportCard?.status === 'approved' || (!isHomeroomTeacherOfSelectedClass && isTeacher) ? 'Close' : 'Cancel'}
                  </button>
                  
                  {isDirector && editingReportCard?.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          const reason = prompt("Please enter the reason for revision / what is incorrect:")
                          if (reason === null) return
                          setShowModal(false)
                          await handleReject(editingReportCard.id, reason)
                        }}
                        className="px-6 py-3 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md"
                      >
                        Request Revision
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setShowModal(false)
                          await handleApprove(editingReportCard.id)
                        }}
                        className="px-6 py-3 bg-brand-success text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md"
                      >
                        Endorse / Approve
                      </button>
                    </>
                  )}

                  {editingReportCard?.status !== 'approved' && isHomeroomTeacherOfSelectedClass && user?.role !== 'guardian' && (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-brand-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      {submitting 
                        ? 'Submitting...' 
                        : (editingReportCard ? 'Update & Re-Submit' : 'Submit for Endorsement')
                      }
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
