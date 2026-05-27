'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, CheckCircle2, AlertCircle, BookOpen, Clock, Tag } from 'lucide-react'
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

const COMMON_SUBJECTS = [
  'Mathematics',
  'Science',
  'English Language',
  'Social Studies',
  'History',
  'Geography',
  'Art',
  'Music',
  'Physical Education',
  'French',
  'Spanish',
  'Other'
]

export default function CreateHomeworkPage() {
  const router = useRouter()
  
  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState(COMMON_SUBJECTS[0])
  const [customSubject, setCustomSubject] = useState('')
  const [className, setClassName] = useState('')
  const [dueDate, setDueDate] = useState('')
  
  // Operational states
  const [classes, setClasses] = useState<Classroom[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
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

  // Fetch teacher's classes
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
            const firstClass = classList[0]
            setSelectedClassId(firstClass.classId || firstClass.id)
            setClassName(firstClass.className) // Default to first class
          }
        }
      } catch (err) {
        console.error('Failed to fetch teacher classes:', err)
      } finally {
        setClassesLoading(false)
      }
    }

    fetchClasses()
  }, [])

  // Update className and subject automatically when selectedClassId changes
  useEffect(() => {
    if (selectedClassId && classes.length > 0) {
      const selectedClass = classes.find(c => (c.classId === selectedClassId || c.id === selectedClassId))
      if (selectedClass) {
        setClassName(selectedClass.className)
        if ((selectedClass as any).subject) {
          setSubject((selectedClass as any).subject)
        }
      }
    }
  }, [selectedClassId, classes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setToast(null)

    const finalSubject = subject === 'Other' ? customSubject.trim() : subject

    if (!finalSubject) {
      setError('Please specify a subject.')
      setLoading(false)
      return
    }

    if (!className) {
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

      const response = await fetch('/api/homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          subject: finalSubject,
          className,
          dueDate
        })
      })

      const data = await response.json()

      if (data.success) {
        setToast({ message: 'Homework created and parents notified successfully!', type: 'success' })
        // Clear fields
        setTitle('')
        setDescription('')
        setCustomSubject('')
        // Delay redirect so user can see success toast
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
      setError('Network error. Please verify the backend status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Toast message */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100] max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-brand-success p-5 flex items-start gap-4 text-brand-heading">
            <div className="p-2.5 rounded-xl shadow-inner bg-brand-success/10 text-brand-success">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-tight">Success</h4>
              <p className="text-brand-text font-semibold text-xs mt-1 leading-relaxed">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header section */}
      <header className="bg-brand-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-brand-primary/5 border border-brand-100 flex flex-col gap-3 relative overflow-hidden">
        <button
          onClick={() => router.push('/dashboard/homework')}
          className="group flex items-center gap-1.5 text-brand-text hover:text-brand-primary transition-colors font-bold text-xs uppercase tracking-widest self-start"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to homework
        </button>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-brand-heading leading-tight">
            Schedule Homework
          </h1>
          <p className="mt-2 text-brand-text font-semibold text-sm max-w-xl">
            Designate learning targets, add resources, and post updates to parent feeds automatically.
          </p>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-bold text-sm">{error}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-brand-white rounded-[2.5rem] shadow-xl shadow-brand-primary/5 p-8 md:p-10 border border-brand-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Homework Title */}
          <div>
            <Input
              label="Assignment Title"
              type="text"
              value={title}
              onChange={(e: any) => setTitle(e.target.value)}
              placeholder="e.g. Fractions Practice Sheet, Chemistry Lab Prep"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest ml-1">
              Assignment Instructions & Requirements
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full bg-brand-bg border border-brand-100 rounded-2xl p-4 text-brand-heading font-bold placeholder:text-brand-text/40 outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary focus:bg-brand-white transition-all text-sm"
              placeholder="Provide clear steps, page numbers, links, or expectations for parent verification..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Subject Dropdown */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest ml-1">
                Subject
              </label>
              <div className="relative">
                {classes.find(c => (c.classId === selectedClassId || c.id === selectedClassId))?.subject ? (
                  <input
                    type="text"
                    value={subject}
                    disabled
                    className="w-full bg-slate-100 border border-brand-100 rounded-2xl py-4 px-4 text-slate-500 font-bold outline-none cursor-not-allowed text-sm"
                  />
                ) : (
                  <>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4.5 px-4 text-brand-heading font-bold outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary focus:bg-brand-white appearance-none cursor-pointer text-sm"
                    >
                      {COMMON_SUBJECTS.map((subj) => (
                        <option key={subj} value={subj}>{subj}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-brand-text/40">
                      <Tag className="w-4 h-4" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Target Class Dropdown */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest ml-1">
                Target Class / Grade
              </label>
              <div className="relative">
                {classesLoading ? (
                  <div className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 px-4 text-brand-text font-bold text-sm">
                    Loading classes...
                  </div>
                ) : classes.length > 0 ? (
                  <>
                    <select
                      value={selectedClassId || ''}
                      onChange={(e) => setSelectedClassId(Number(e.target.value))}
                      className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4.5 px-4 text-brand-heading font-bold outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary focus:bg-brand-white appearance-none cursor-pointer text-sm"
                    >
                      {classes.map((cls) => (
                        <option key={cls.classId || cls.id} value={cls.classId || cls.id}>
                          {cls.className} {cls.subject ? `(${cls.subject})` : ''} ({cls.totalStudents} Students)
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-brand-text/40">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </>
                ) : (
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="e.g. Grade 1-A"
                    className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 px-4 text-brand-heading font-bold outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary focus:bg-brand-white text-sm"
                    required
                  />
                )}
              </div>
            </div>

          </div>

          {/* Custom Subject field if "Other" selected */}
          {subject === 'Other' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <Input
                label="Custom Subject Name"
                type="text"
                value={customSubject}
                onChange={(e: any) => setCustomSubject(e.target.value)}
                placeholder="Enter custom subject (e.g. Robotics)"
                required
              />
            </div>
          )}

          {/* Due Date */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-brand-heading uppercase tracking-widest ml-1">
              Due Date & Time
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4.5 px-4 text-brand-heading font-bold outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary focus:bg-brand-white text-sm"
                required
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 flex gap-4">
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
    </div>
  )
}
