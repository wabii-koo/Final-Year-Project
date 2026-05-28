'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Car, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  Search, 
  Filter, 
  History,
  Leaf,
  ChevronRight,
  ShieldCheck,
  MapPin,
  X
} from 'lucide-react'

interface PickupRequest {
  requestId: number
  studentId: number
  studentName: string
  guardianId: number
  guardianName: string
  authorizedPersonName: string
  authorizedPersonRelationship: string
  authorizedPersonPhone: string
  authorizedPersonNationalId: string
  status: 'pending' | 'approved' | 'rejected'
  requestDate: string
  pickupDate: string
  pickupTimeStart?: string
  pickupTimeEnd?: string
  createdAt: string
  processedBy?: number
  processedAt?: string
  notes?: string
}

interface Student {
  studentId: number
  fullName: string
  classId: number
  className?: string
}

export default function PickupPage() {
  const [user, setUser] = useState<any>(null)
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const router = useRouter()

  const [newRequest, setNewRequest] = useState({
    studentId: '',
    authorizedPersonName: '',
    authorizedPersonRelationship: '',
    authorizedPersonPhone: '',
    authorizedPersonNationalId: '',
    pickupDate: '',
    pickupTimeStart: '',
    pickupTimeEnd: '',
    notes: ''
  })

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
      fetchPickupRequests()
      if (user.role === 'guardian') {
        fetchStudents()
      }
    }
  }, [user])

  const fetchPickupRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/pickup-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setPickupRequests(data.data?.pickupRequests || data.data || [])
      }
    } catch (error) {
      console.error('Fetch error')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/students/my-children`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setStudents(data.data || [])
      }
    } catch (error) {
      console.error('Fetch students error')
    }
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      
      const response = await fetch(`${apiUrl}/api/pickup-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newRequest)
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewRequest({
          studentId: '',
          authorizedPersonName: '',
          authorizedPersonRelationship: '',
          authorizedPersonPhone: '',
          authorizedPersonNationalId: '',
          pickupDate: '',
          pickupTimeStart: '',
          pickupTimeEnd: '',
          notes: ''
        })
        fetchPickupRequests()
      }
    } catch (error) {
      console.error('Submit error')
    }
  }

  const handleProcessRequest = async (requestId: number, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      
      const response = await fetch(`${apiUrl}/api/pickup-requests/${requestId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes })
      })

      if (response.ok) {
        fetchPickupRequests()
      }
    } catch (error) {
      console.error('Process error')
    }
  }

  const filteredRequests = pickupRequests.filter(request => {
    const matchesSearch = 
      request.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.authorizedPersonName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.authorizedPersonNationalId?.includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const isGuardian = user?.role === 'guardian'
  const canProcessRequests = user?.role === 'teacher' || user?.role === 'homeroom_teacher' || user?.role === 'registrar'

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="animate-pulse text-brand-primary font-black text-xl uppercase tracking-tighter">
          Synchronizing Logistic Feeds...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden font-sans">
      {/* Decorative Leaves */}
      <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none rotate-45 scale-125">
        <Leaf size={280} className="text-brand-accent" />
      </div>

      <div className="relative mx-auto max-w-7xl p-6 lg:p-8 space-y-10">
        {/* Header Section */}
        <header className="bg-brand-white rounded-[3rem] p-10 shadow-xl shadow-brand-primary/5 border border-brand-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-brand-heading tracking-tight flex items-center gap-3">
              Pickup Requests
            </h1>
            <p className="text-brand-text font-medium mt-2 text-lg">
              Secure logistics for student dismissal and safety.
            </p>
          </div>
          
          {isGuardian && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="relative z-10 bg-brand-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              New Request
            </button>
          )}
          <Leaf className="absolute -bottom-10 -right-10 text-brand-accent/10 -rotate-12" size={180} />
        </header>

        {/* Filter Bar */}
        <div className="bg-brand-white p-4 rounded-[2.5rem] border border-brand-100 shadow-xl shadow-brand-primary/5 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-accent" size={18} />
            <input
              type="text"
              placeholder="Search logistics database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-bg border border-brand-100 rounded-3xl py-4 pl-14 pr-6 text-brand-heading font-bold placeholder-brand-text/50 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full md:w-48 bg-brand-bg border border-brand-100 rounded-3xl py-4 px-6 text-brand-heading font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-primary/10"
            >
              <option value="all">All Records</option>
              <option value="pending">In Review</option>
              <option value="approved">Validated</option>
              <option value="rejected">Declined</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="grid grid-cols-1 gap-6">
          {filteredRequests.length === 0 ? (
            <div className="bg-brand-white rounded-[3.5rem] p-24 text-center border border-brand-100">
              <Car className="mx-auto text-brand-accent/20 mb-6" size={80} />
              <h3 className="text-2xl font-black text-brand-heading">No active pickup requests</h3>
              <p className="text-brand-text font-medium mt-2">The pickup request feed is currently quiet.</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.requestId} className="bg-brand-white rounded-[3rem] shadow-xl shadow-brand-primary/5 p-8 md:p-10 border border-brand-100 group hover:border-brand-primary/20 transition-all">
                <div className="flex flex-col lg:flex-row justify-between gap-10">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        request.status === 'pending' ? 'bg-brand-bg text-brand-secondary border-brand-secondary/20' :
                        request.status === 'approved' ? 'bg-brand-success/10 text-brand-success border-brand-success/20' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {request.status}
                      </span>
                      <span className="text-[10px] font-black text-brand-text uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} className="text-brand-accent" />
                        SUBMITTED {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-3xl font-black text-brand-heading tracking-tight">
                        {request.studentName}
                      </h3>
                      <p className="text-brand-text font-bold text-sm uppercase tracking-widest mt-1">
                         Student Subject for Release
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                      <div className="space-y-4">
                         <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-brand-bg rounded-xl flex items-center justify-center text-brand-primary">
                               <User size={18} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-brand-text uppercase tracking-widest">Authorized Person</p>
                               <p className="font-black text-brand-heading">{request.authorizedPersonName}</p>
                               <p className="text-xs font-bold text-brand-secondary uppercase">{request.authorizedPersonRelationship}</p>
                            </div>
                         </div>
                         <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-brand-bg rounded-xl flex items-center justify-center text-brand-primary">
                               <CreditCard size={18} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-brand-text uppercase tracking-widest">Identification</p>
                               <p className="font-black text-brand-heading">ID: {request.authorizedPersonNationalId}</p>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-brand-bg rounded-xl flex items-center justify-center text-brand-primary">
                               <Phone size={18} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-brand-text uppercase tracking-widest">Contact Hash</p>
                               <p className="font-black text-brand-heading">{request.authorizedPersonPhone}</p>
                            </div>
                         </div>
                          <div className="flex items-start gap-4">
                             <div className="w-10 h-10 bg-brand-bg rounded-xl flex items-center justify-center text-brand-primary">
                                <Calendar size={18} />
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-brand-text uppercase tracking-widest">Authorized Release Period</p>
                                <p className="font-black text-brand-heading">
                                   {(() => {
                                      const startDateStr = new Date(request.pickupDate).toLocaleDateString();
                                      if (request.pickupTimeEnd && request.pickupTimeEnd.trim() !== '') {
                                         const endDate = new Date(request.pickupTimeEnd);
                                         if (!isNaN(endDate.getTime())) {
                                            return `${startDateStr} to ${endDate.toLocaleDateString()}`;
                                         }
                                      }
                                      return startDateStr;
                                   })()}
                                </p>
                                <p className="text-xs font-bold text-brand-secondary uppercase">
                                   {request.pickupTimeEnd && request.pickupTimeEnd.trim() !== '' ? 'Multi-day window' : 'Single-day release'}
                                </p>
                             </div>
                          </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-3">
                    {canProcessRequests && request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleProcessRequest(request.requestId, 'approved')}
                          className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
                        >
                          <CheckCircle size={18} />
                          Approve Release
                        </button>
                        <button
                          onClick={() => handleProcessRequest(request.requestId, 'rejected')}
                          className="border-2 border-red-100 text-red-500 px-8 py-4 rounded-2xl font-black text-xs uppercase hover:bg-red-50 transition-all flex items-center gap-2"
                        >
                          <XCircle size={18} />
                          Deny Request
                        </button>
                      </>
                    )}
                    
                    {request.status !== 'pending' && (
                      <div className="bg-brand-bg p-6 rounded-[2rem] border border-brand-100 text-center">
                        <ShieldCheck className="mx-auto text-brand-primary mb-2" size={32} />
                        <p className="text-[10px] font-black text-brand-text uppercase">LOGGED ON</p>
                        <p className="font-black text-brand-heading">{request.processedAt ? new Date(request.processedAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-4 bg-brand-heading/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-brand-white rounded-[3.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-brand-100 flex flex-col">
            <div className="px-10 py-8 border-b border-brand-100 flex justify-between items-center bg-brand-bg/50">
              <h3 className="text-2xl font-black text-brand-heading tracking-tight flex items-center gap-3">
                <Car className="text-brand-primary" />
                Initiate Request
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-brand-bg rounded-xl transition-colors">
                <X size={24} className="text-brand-heading" />
              </button>
            </div>
            
            <form onSubmit={handleCreateRequest} className="p-10 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-brand-text uppercase tracking-widest block mb-2 px-2">Target Student</label>
                  <select
                    value={newRequest.studentId}
                    onChange={(e) => setNewRequest({...newRequest, studentId: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/10"
                    required
                  >
                    <option value="">Select dependent...</option>
                    {students.map(student => (
                      <option key={student.studentId} value={student.studentId}>{student.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-brand-text uppercase tracking-widest block mb-2 px-2">Authorized Designee</label>
                  <input
                    type="text"
                    value={newRequest.authorizedPersonName}
                    onChange={(e) => setNewRequest({...newRequest, authorizedPersonName: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none"
                    placeholder="Full legal name"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-brand-text uppercase tracking-widest block mb-2 px-2">Relationship</label>
                  <input
                    type="text"
                    value={newRequest.authorizedPersonRelationship}
                    onChange={(e) => setNewRequest({...newRequest, authorizedPersonRelationship: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none"
                    placeholder="e.g. Grandparent"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-brand-text uppercase tracking-widest block mb-2 px-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={newRequest.authorizedPersonPhone}
                    onChange={(e) => setNewRequest({...newRequest, authorizedPersonPhone: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none"
                    placeholder="+251..."
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-brand-text uppercase tracking-widest block mb-2 px-2">National ID</label>
                  <input
                    type="text"
                    value={newRequest.authorizedPersonNationalId}
                    onChange={(e) => setNewRequest({...newRequest, authorizedPersonNationalId: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none"
                    placeholder="Document Number"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-brand-text uppercase tracking-widest block mb-2 px-2">Start Date (From)</label>
                  <input
                    type="date"
                    value={newRequest.pickupDate}
                    onChange={(e) => setNewRequest({...newRequest, pickupDate: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/10"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-brand-text uppercase tracking-widest block mb-2 px-2">End Date (Upto)</label>
                  <input
                    type="date"
                    value={newRequest.pickupTimeEnd}
                    onChange={(e) => setNewRequest({...newRequest, pickupTimeEnd: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/10"
                    placeholder="Optional date limit"
                  />
                </div>
              </div>

              <div className="bg-brand-primary/5 p-6 rounded-[2rem] border border-brand-primary/10 flex items-start gap-4">
                 <ShieldCheck className="text-brand-primary mt-1" size={20} />
                 <p className="text-xs font-bold text-brand-heading leading-relaxed">
                   Authorized personnel must present original identification matching these credentials. Release will not be granted without verification.
                 </p>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-brand-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-8 py-4 text-brand-text font-black text-xs uppercase hover:underline"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="bg-brand-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase shadow-xl shadow-brand-primary/20"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
