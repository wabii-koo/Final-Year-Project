'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Clock, 
  Tag, 
  Users, 
  Sparkles, 
  Settings, 
  Eye, 
  MessageSquare,
  Lock,
  ArrowRight,
  HelpCircle
} from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'

interface Classroom {
  id: number
  classId: number
  classLevel: string
  className: string
  academicYear: string
  totalStudents: number
  subject?: string
}

export default function CreateHomeworkPage() {
  const router = useRouter()
  
  // User context
  const [user, setUser] = useState<any>(null)
  
  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  
  // Selection states (Standard Mode)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('')
  
  // Custom Override states (Custom Mode)
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customClassSelect, setCustomClassSelect] = useState('Grade 1-A')
  const [customClassInput, setCustomClassInput] = useState('')
  const [customSubjectSelect, setCustomSubjectSelect] = useState('English')
  const [customSubjectInput, setCustomSubjectInput] = useState('')
  
  // Resolved form values for final submission
  const [resolvedClass, setResolvedClass] = useState('')
  const [resolvedSubject, setResolvedSubject] = useState('')
  
  // Operational states
  const [classes, setClasses] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(false)
  const [classesLoading, setClassesLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Get user details
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/auth/login')
    }
  }, [router])

  // Fetch teacher's specific class & subject assignments
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/teacher/classes?onlySubjectClasses=true`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const resData = await response.json()
          const classList = resData.data?.classes || []
          setClasses(classList)
          
          if (classList.length > 0) {
            // Set first class/subject combination as default assignment
            const first = classList[0]
            const assignmentKey = `${first.classId}_${first.subject || ''}`
            setSelectedAssignmentId(assignmentKey)
            setResolvedClass(first.className)
            setResolvedSubject(first.subject || '')
          }
        }
      } catch (err) {
        console.error('Failed to fetch teacher classes:', err)
        setError('Could not retrieve your teaching assignments. Please reload the page.')
      } finally {
        setClassesLoading(false)
      }
    }

    fetchClasses()
  }, [])

  // Sync resolved class/subject when standard assignment changes
  useEffect(() => {
    if (!isCustomMode && selectedAssignmentId && classes.length > 0) {
      const found = classes.find(c => `${c.classId}_${c.subject || ''}` === selectedAssignmentId)
      if (found) {
        setResolvedClass(found.className)
        setResolvedSubject(found.subject || '')
      }
    }
  }, [selectedAssignmentId, classes, isCustomMode])

  // Sync resolved class/subject when custom choices change
  useEffect(() => {
    if (isCustomMode) {
      const targetClass = customClassSelect === 'Other' ? customClassInput.trim() : customClassSelect
      const targetSubject = customSubjectSelect === 'Other' ? customSubjectInput.trim() : customSubjectSelect
      setResolvedClass(targetClass)
      setResolvedSubject(targetSubject)
    }
  }, [customClassSelect, customClassInput, customSubjectSelect, customSubjectInput, isCustomMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setToast(null)

    if (!resolvedSubject) {
      setError('Please specify a subject.')
      setLoading(false)
      return
    }

    if (!resolvedClass) {
      setError('Please select or specify a target class.')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please login to create homework')
        setLoading(false)
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/homework`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          subject: resolvedSubject,
          className: resolvedClass,
          dueDate
        })
      })

      const data = await response.json()

      if (data.success) {
        setToast({ message: 'Homework created and parents notified successfully!', type: 'success' })
        // Clear inputs
        setTitle('')
        setDescription('')
        setDueDate('')
        
        // Delay redirect for success toast
        setTimeout(() => {
          router.push('/dashboard/homework')
        }, 1500)
      } else {
        if (data.error?.details && data.error.details.length > 0) {
          const firstError = data.error.details[0]
          setError(`${firstError.field}: ${firstError.message}`)
        } else {
          setError(data.error?.message || data.message || 'Failed to create homework')
        }
      }
    } catch (err) {
      setError('Network error. Please verify the server is running.')
    } finally {
      setLoading(false)
    }
  }

  // Find currently active teaching assignment metadata
  const activeAssignment = !isCustomMode && classes.find(
    c => `${c.classId}_${c.subject || ''}` === selectedAssignmentId
  )

  const isHomeroomTeacher = user?.role === 'homeroom_teacher'

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* Toast alert */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100] max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-brand-success p-5 flex items-start gap-4 text-brand-heading">
            <div className="p-2.5 rounded-xl shadow-inner bg-brand-success/10 text-brand-success">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-tight text-brand-primary">Success</h4>
              <p className="text-brand-text font-semibold text-xs mt-1 leading-relaxed">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header card with forest gradients */}
      <header className="relative bg-gradient-to-br from-brand-primary to-brand-secondary rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-brand-primary/10 border border-brand-primary/10 overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-accent/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        <button
          onClick={() => router.push('/dashboard/homework')}
          className="group relative z-10 flex items-center gap-1.5 text-white/80 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest self-start mb-6"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to homework
        </button>
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1 px-3.5 py-1 bg-white/15 text-white rounded-full text-xs font-black uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
            Aligned Schedule Wizard
          </span>
          <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight">
            Schedule Homework
          </h1>
          <p className="mt-2 text-white/80 font-medium text-sm max-w-xl">
            Create error-free homework schedules synced with your assigned classes and subjects. Feed announcements are automatically pushed to parents.
          </p>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span className="font-bold text-sm">{error}</span>
        </div>
      )}

      {/* Two-Column Responsive Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-7 bg-brand-white rounded-[2.5rem] shadow-xl shadow-brand-primary/5 p-8 border border-brand-100 space-y-8">
          <div className="flex items-center justify-between border-b border-brand-100 pb-4">
            <h2 className="text-xl font-black text-brand-heading flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-primary" />
              Assignment Configuration
            </h2>
            {isHomeroomTeacher && (
              <span className="bg-brand-accent/20 text-brand-primary px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">
                Homeroom Privileged
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Class and Subject Selection Area */}
            <div className="bg-brand-bg/50 p-6 rounded-3xl border border-brand-100 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-xs text-brand-heading uppercase tracking-wider">
                    {isCustomMode ? "Override Assignment" : "Teaching Assignment"}
                  </h3>
                  <p className="text-[11px] text-brand-text font-bold">
                    {isCustomMode 
                      ? "Custom entry for special assignments or homeroom classes" 
                      : "Directly fetch your classrooms and subjects"}
                  </p>
                </div>

                {/* iOS-Style Toggle for Override Mode - ONLY for Homeroom Teachers */}
                {isHomeroomTeacher && (
                  <label className="flex items-center gap-3 cursor-pointer self-start sm:self-center">
                    <span className="text-xs font-bold text-brand-text">Custom Override</span>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={isCustomMode}
                        onChange={(e) => setIsCustomMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </div>
                  </label>
                )}
              </div>

              {!isCustomMode ? (
                /* STANDARD ALIGNED MODE */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest ml-1">
                      Choose Class & Subject
                    </label>
                    <div className="relative">
                      {classesLoading ? (
                        <div className="w-full bg-brand-white border border-brand-100 rounded-2xl py-4.5 px-4 text-brand-text font-bold text-sm flex items-center gap-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
                          Retrieving teaching schedule...
                        </div>
                      ) : classes.length > 0 ? (
                        <>
                          <select
                            value={selectedAssignmentId}
                            onChange={(e) => setSelectedAssignmentId(e.target.value)}
                            className="w-full bg-brand-white border border-brand-100 rounded-2xl py-4 px-4 text-brand-heading font-black outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary appearance-none cursor-pointer text-sm"
                          >
                            {classes.map((cls) => (
                              <option 
                                key={`${cls.classId}_${cls.subject || ''}`} 
                                value={`${cls.classId}_${cls.subject || ''}`}
                              >
                                {cls.className} — {cls.subject || 'General'} ({cls.totalStudents} Students)
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-brand-primary">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full bg-brand-white border-2 border-dashed border-brand-200 rounded-2xl py-6 px-4 text-center text-brand-text font-bold text-sm">
                          No standard assignments found. Override enabled automatically.
                        </div>
                      )}
                    </div>
                  </div>

                  {activeAssignment && (
                    /* Elegant summary display of active selection */
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="bg-brand-white p-3.5 rounded-2xl border border-brand-100 text-center flex flex-col items-center justify-center">
                        <Users className="w-4 h-4 text-brand-primary mb-1" />
                        <span className="block text-[8px] font-black uppercase text-brand-text tracking-widest">Audience</span>
                        <span className="block text-xs font-black text-brand-heading mt-0.5">{activeAssignment.className}</span>
                      </div>
                      <div className="bg-brand-white p-3.5 rounded-2xl border border-brand-100 text-center flex flex-col items-center justify-center">
                        <Tag className="w-4 h-4 text-brand-accent mb-1" />
                        <span className="block text-[8px] font-black uppercase text-brand-text tracking-widest">Subject</span>
                        <span className="block text-xs font-black text-brand-heading mt-0.5">{activeAssignment.subject}</span>
                      </div>
                      <div className="bg-brand-white p-3.5 rounded-2xl border border-brand-100 text-center flex flex-col items-center justify-center">
                        <Clock className="w-4 h-4 text-brand-secondary mb-1" />
                        <span className="block text-[8px] font-black uppercase text-brand-text tracking-widest">Enrolled</span>
                        <span className="block text-xs font-black text-brand-heading mt-0.5">{activeAssignment.totalStudents} Pupils</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* CUSTOM OVERRIDE MODE */
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Custom Class Selection */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest ml-1">
                        Override Target Class
                      </label>
                      <select
                        value={customClassSelect}
                        onChange={(e) => setCustomClassSelect(e.target.value)}
                        className="w-full bg-brand-white border border-brand-100 rounded-2xl py-4 px-4 text-brand-heading font-bold outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary appearance-none cursor-pointer text-sm"
                      >
                        <option value="Grade 1-A">Grade 1-A</option>
                        <option value="Grade 2-B">Grade 2-B</option>
                        <option value="Grade 3-B">Grade 3-B</option>
                        <option value="Other">Other (Custom Class)...</option>
                      </select>
                    </div>

                    {/* Custom Subject Selection */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest ml-1">
                        Override Subject
                      </label>
                      <select
                        value={customSubjectSelect}
                        onChange={(e) => setCustomSubjectSelect(e.target.value)}
                        className="w-full bg-brand-white border border-brand-100 rounded-2xl py-4 px-4 text-brand-heading font-bold outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary appearance-none cursor-pointer text-sm"
                      >
                        <option value="English">English</option>
                        <option value="Social Studies">Social Studies</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science">Science</option>
                        <option value="Other">Other (Custom Subject)...</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditional inputs for Custom / Other entry */}
                  {customClassSelect === 'Other' && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <Input
                        label="Type Custom Class Name"
                        type="text"
                        value={customClassInput}
                        onChange={(e: any) => setCustomClassInput(e.target.value)}
                        placeholder="e.g. Grade 4-A"
                        required
                        className="bg-brand-white"
                      />
                    </div>
                  )}

                  {customSubjectSelect === 'Other' && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <Input
                        label="Type Custom Subject Name"
                        type="text"
                        value={customSubjectInput}
                        onChange={(e: any) => setCustomSubjectInput(e.target.value)}
                        placeholder="e.g. Art & Crafts"
                        required
                        className="bg-brand-white"
                      />
                    </div>
                  )}

                  <div className="bg-brand-white/80 p-3.5 rounded-2xl border-2 border-dashed border-brand-accent/30 text-xs font-bold text-brand-primary flex items-start gap-2.5">
                    <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Validation Guard:</strong> Standard teachers are restricted by backend constraints. Homeroom teachers can bypass subject limitations in their homeroom classes.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Title input */}
            <div>
              <Input
                label="Assignment Title"
                type="text"
                value={title}
                onChange={(e: any) => setTitle(e.target.value)}
                placeholder="e.g. Fractions Practice Sheet, Science Experiment Report"
                required
              />
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest ml-1">
                Assignment Instructions & Criteria
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full bg-brand-bg border border-brand-100 rounded-2xl p-4 text-brand-heading font-bold placeholder:text-brand-text/40 outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary focus:bg-brand-white transition-all text-sm"
                placeholder="Give clear steps, due questions, materials required, and what parameters parent verification needs..."
                required
              />
            </div>

            {/* Due Date & Time Picker */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest ml-1">
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-3.5 px-4 text-brand-heading font-bold outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary focus:bg-brand-white transition-all text-sm"
                required
              />
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-4 flex gap-4 border-t border-brand-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/homework')}
                className="w-1/3 py-4.5 text-xs font-black uppercase tracking-widest"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-2/3 py-4.5 text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20"
              >
                {loading ? 'Publishing...' : 'Publish Homework'}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Parent Dashboard Feed Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-6">
          <div className="bg-brand-heading text-brand-bg p-6 rounded-[2rem] border border-brand-heading/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-primary/40 text-brand-accent rounded-full text-[9px] font-black uppercase tracking-widest mb-3.5 border border-brand-primary/20">
              <Eye className="w-3 h-3" />
              Live Feed Simulation
            </span>
            <h3 className="text-lg font-black text-white leading-tight">Parent Portal Preview</h3>
            <p className="text-white/60 font-semibold text-xs mt-1 leading-relaxed">
              This card simulates exactly how parents view your assignment on their home screen feed.
            </p>
          </div>

          {/* Rendered Homework Card */}
          <div className="bg-brand-white rounded-[2rem] shadow-2xl shadow-brand-primary/5 p-8 border-2 border-dashed border-brand-200/80 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2.5 h-full bg-brand-primary group-hover:scale-y-105 transition-transform"></div>
            
            <div className="pl-3.5 space-y-5">
              {/* Header badges */}
              <div className="flex items-center justify-between">
                <span className="bg-brand-accent/15 text-brand-primary font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-wider border border-brand-accent/25">
                  {resolvedSubject || 'Subject Name'}
                </span>
                
                {(() => {
                  const isOverdue = dueDate ? new Date(dueDate) < new Date() : false;
                  return (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${
                      isOverdue 
                        ? 'bg-red-50 text-red-600 border border-red-100'
                        : 'bg-brand-success/15 text-brand-success border border-brand-success/20'
                    }`}>
                      {isOverdue ? 'Overdue' : 'Active'}
                    </span>
                  );
                })()}
              </div>

              {/* Assignment Title */}
              <div>
                <h4 className="text-xl font-black text-brand-heading leading-snug group-hover:text-brand-primary transition-colors">
                  {title.trim() || 'Your Assignment Title'}
                </h4>
                <p className="text-brand-text font-semibold text-xs leading-relaxed mt-2.5 line-clamp-4 whitespace-pre-wrap">
                  {description.trim() || 'Instruction details will automatically mirror here as you type. Outline expectations, pages, and homework goals...'}
                </p>
              </div>

              {/* Assignment Details */}
              <div className="border-t border-brand-100 pt-5 space-y-3.5">
                <div className="flex items-center gap-2.5 text-brand-text font-bold text-xs">
                  <Clock className="w-4 h-4 text-brand-primary" />
                  <span>
                    Due: {dueDate ? new Date(dueDate).toLocaleString() : 'Select date & time'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-brand-text font-bold text-xs">
                  <BookOpen className="w-4 h-4 text-brand-primary" />
                  <span>Class: {resolvedClass || 'Select Classroom'}</span>
                </div>

                <div className="flex items-center gap-2.5 text-brand-text font-bold text-xs">
                  <Users className="w-4 h-4 text-brand-primary" />
                  <span>By: {user ? user.fullName : 'Your Name'}</span>
                </div>
              </div>

              {/* Parent Action Simulator */}
              <div className="pt-4 border-t border-brand-100 flex items-center justify-between gap-4 mt-2">
                <div className="flex gap-2">
                  <div className="bg-brand-bg rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-[11px] text-brand-heading font-black">
                    <Eye className="w-3.5 h-3.5 text-brand-primary" />
                    <span>0</span>
                  </div>
                  <div className="bg-brand-bg rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-[11px] text-brand-heading font-black">
                    <MessageSquare className="w-3.5 h-3.5 text-brand-primary" />
                    <span>0</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="bg-brand-primary/10 text-brand-primary font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-not-allowed flex items-center gap-1"
                >
                  Parent Feed
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
