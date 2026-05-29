'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  UserCheck, 
  Users, 
  Clock, 
  FileText, 
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Upload,
  Download
} from 'lucide-react'
import { studentImportAPI } from '@/lib/api'

interface UserData {
  userId: number
  email: string
  role: string
  fullName: string
}

interface Stats {
  pendingRegistrations: number
  approvedRegistrations: number
  rejectedRegistrations: number
  totalGuardians: number
  recentActivity: Array<{
    id: number
    action: string
    user: string
    timestamp: string
    status: 'pending' | 'approved' | 'rejected'
  }>
}

export default function RegistrarDashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    pendingRegistrations: 0,
    approvedRegistrations: 0,
    rejectedRegistrations: 0,
    totalGuardians: 0,
    recentActivity: []
  })
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [uploadError, setUploadError] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    const parsed = JSON.parse(userData)
    setUser(parsed)

    if (parsed.role !== 'registrar') {
      router.push('/dashboard')
      return
    }

    fetchRegistrarStats(token)
  }, [router])

  const fetchRegistrarStats = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/registrar/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      } else {
        setStats({
          pendingRegistrations: 5,
          approvedRegistrations: 150,
          rejectedRegistrations: 3,
          totalGuardians: 153,
          recentActivity: [
            { id: 1, action: 'Guardian registration approved', user: 'Ms. Hana Ali', timestamp: '2026-03-29 10:30', status: 'approved' },
            { id: 2, action: 'Document verification pending', user: 'Mr. Daniel Tesfaye', timestamp: '2026-03-29 09:15', status: 'pending' },
            { id: 3, action: 'Registration rejected - invalid document', user: 'Ms. Sara Bekele', timestamp: '2026-03-28 16:45', status: 'rejected' }
          ]
        })
      }
    } catch (error) {
      console.error('Error fetching registrar stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError('')
    setUploadResult(null)

    try {
      const response = await studentImportAPI.importStudents(file)
      setUploadResult(response.data)
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Failed to upload CSV file'
      setUploadError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const downloadCSVTemplate = () => {
    const csvContent = `fullName,dob,emergencyContact,classLevel\nJohn Doe,2015-05-15,+251911000000,Grade 1-A\nJane Smith,2016-08-20,+251922000000,Grade 2-B`
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  const statCards = [
    { icon: Clock, label: 'Pending Apps', value: stats.pendingRegistrations, color: 'text-brand-secondary', bgColor: 'bg-brand-bg' },
    { icon: CheckCircle, label: 'Verified Guardians', value: stats.approvedRegistrations, color: 'text-brand-success', bgColor: 'bg-brand-bg' },
    { icon: XCircle, label: 'Rejected Files', value: stats.rejectedRegistrations, color: 'text-red-500', bgColor: 'bg-brand-bg' },
    { icon: Users, label: 'Total Database', value: stats.totalGuardians, color: 'text-brand-primary', bgColor: 'bg-brand-bg' }
  ]

  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden font-sans">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none rotate-45">
        <ShieldCheck size={240} className="text-brand-accent" />
      </div>

      <div className="relative mx-auto max-w-7xl p-6 lg:p-8 space-y-10">
        {/* Welcome Banner */}
        <header className="bg-brand-white rounded-3xl p-8 shadow-xl shadow-brand-primary/5 border border-brand-100 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-brand-heading tracking-tight">
              Registrar Portal
            </h1>
            <p className="text-brand-text mt-2 text-lg font-medium">
              You have <span className="text-brand-primary font-bold">{stats.pendingRegistrations}</span> applications awaiting verification.
            </p>
            <div className="inline-block mt-4 px-4 py-1.5 bg-brand-accent text-brand-primary rounded-full text-xs font-black uppercase tracking-widest">
              Officer: {user?.fullName}
            </div>
          </div>
          <div className="flex gap-3 relative z-10">
            <button 
              onClick={() => router.push('/dashboard/registrations')}
              className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-brand-primary to-brand-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <ShieldCheck size={20} />
              REVIEW APPLICATIONS
            </button>
          </div>
          <ShieldCheck className="absolute -bottom-8 -left-8 text-brand-accent/5 -rotate-12" size={160} />
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-brand-white p-6 rounded-3xl shadow-sm border border-brand-100 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${stat.bgColor} ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-brand-text font-bold text-xs uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black text-brand-heading mt-1">{stat.value}</h3>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Feed */}
          <div className="lg:col-span-2 bg-brand-white rounded-[3rem] shadow-xl shadow-brand-primary/5 border border-brand-100 p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-brand-heading flex items-center gap-3">
                <Clock className="text-brand-primary" />
                Registration Activity
              </h3>
            </div>

            <div className="flex-1 space-y-6">
              {stats.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-brand-bg rounded-2xl border border-brand-100 group hover:bg-white transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-white rounded-xl shadow-sm ${
                      activity.status === 'approved' ? 'text-brand-success' : 
                      activity.status === 'rejected' ? 'text-red-500' : 'text-brand-secondary'
                    }`}>
                      {activity.status === 'approved' ? <CheckCircle size={20} /> : 
                       activity.status === 'rejected' ? <XCircle size={20} /> : <AlertCircle size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-heading text-sm">{activity.action}</h4>
                      <p className="text-xs text-brand-text font-semibold uppercase">{activity.user} • {activity.timestamp}</p>
                    </div>
                  </div>
                  <button className="p-2 text-brand-text hover:text-brand-primary transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button className="mt-8 w-full py-4 border-2 border-brand-secondary text-brand-secondary font-black text-xs uppercase rounded-2xl hover:bg-brand-secondary hover:text-white transition-all">
              VIEW ALL ARCHIVES
            </button>
          </div>

          {/* Quick Actions / Alerts */}
          <div className="space-y-6">
            <div className="bg-brand-white rounded-[3rem] shadow-xl shadow-brand-primary/5 border border-brand-100 p-8 flex flex-col">
              <h3 className="text-2xl font-black text-brand-heading mb-8 flex items-center gap-3">
                <Bell className="text-brand-primary" />
                Quick Actions
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Verify Documents', icon: FileText, href: '/dashboard/registrations', color: 'bg-brand-primary' },
                  { label: 'Guardian List', icon: Users, href: '/dashboard/users', color: 'bg-brand-secondary' },
                  { label: 'System Alerts', icon: Bell, href: '/dashboard/notifications', color: 'bg-brand-accent' }
                ].map((action, i) => (
                  <button 
                    key={i}
                    onClick={() => router.push(action.href)}
                    className="w-full flex items-center gap-4 p-4 bg-brand-bg rounded-2xl border border-brand-100 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <action.icon size={18} />
                    </div>
                    <span className="font-bold text-brand-heading text-sm">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CSV Upload Section */}
            <div className="bg-brand-white rounded-[3rem] shadow-xl shadow-brand-primary/5 border border-brand-100 p-8 flex flex-col">
              <h3 className="text-2xl font-black text-brand-heading mb-6 flex items-center gap-3">
                <Upload className="text-brand-primary" />
                Import Students
              </h3>
              
              <div className="space-y-4">
                <button
                  onClick={downloadCSVTemplate}
                  className="w-full flex items-center gap-3 p-4 bg-brand-bg rounded-2xl border border-brand-100 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <div className="p-2 rounded-lg bg-brand-secondary text-white">
                    <Download size={18} />
                  </div>
                  <span className="font-bold text-brand-heading text-sm">Download CSV Template</span>
                </button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="w-full p-4 bg-brand-bg rounded-2xl border-2 border-dashed border-brand-200 hover:border-brand-primary transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-brand-primary file:text-white file:font-bold file:text-xs file:uppercase file:tracking-wider hover:file:bg-brand-accent"
                  />
                </div>

                {uploading && (
                  <div className="flex items-center gap-3 p-4 bg-brand-bg rounded-2xl border border-brand-100">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary"></div>
                    <span className="text-sm font-bold text-brand-text">Uploading CSV file...</span>
                  </div>
                )}

                {uploadResult && (
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-200 space-y-3">
                    <p className="text-sm font-bold text-green-800">Upload Completed</p>
                    <p className="text-xs text-green-700">
                      {uploadResult.data.successful} students imported successfully
                      {uploadResult.data.duplicates > 0 && `, ${uploadResult.data.duplicates} duplicates skipped`}
                      {uploadResult.data.failed > 0 && `, ${uploadResult.data.failed} failed`}
                    </p>
                    {uploadResult.data.created?.length > 0 && (
                      <div className="text-xs text-green-700">
                        <p className="font-bold">Created students:</p>
                        <ul className="list-disc list-inside mt-2">
                          {uploadResult.data.created.map((student: any) => (
                            <li key={student.studentId}>{student.fullName}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {uploadResult.data.errors?.length > 0 && (
                      <div className="text-xs text-amber-700">
                        <p className="font-bold">Import warnings/errors:</p>
                        <ul className="list-disc list-inside mt-2 max-h-32 overflow-auto">
                          {uploadResult.data.errors.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {uploadError && (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
                    <p className="text-sm font-bold text-red-800">Upload Failed</p>
                    <p className="text-xs text-red-700 mt-1">{uploadError}</p>
                  </div>
                )}
              </div>
            </div>

            {stats.pendingRegistrations > 0 && (
              <div className="bg-brand-primary rounded-[3rem] p-8 text-white shadow-xl shadow-brand-primary/20 relative overflow-hidden group cursor-pointer" onClick={() => router.push('/dashboard/registrations')}>
                <div className="relative z-10">
                  <h4 className="text-xl font-black tracking-tight">System Alert</h4>
                  <p className="text-white/80 text-sm mt-2 font-medium">You have {stats.pendingRegistrations} applications that require immediate attention.</p>
                </div>
                <ShieldCheck className="absolute -bottom-6 -right-6 text-white/10 group-hover:rotate-45 transition-transform" size={100} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
