'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Leaf, 
  ChevronRight,
  TrendingUp,
  Award,
  AlertCircle
} from 'lucide-react'

interface ReportCard {
  id: number
  studentName: string
  grade: string
  term: string
  academicYear: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  submittedBy: string
}

export default function ReportCardsPage() {
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchReportCards = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/auth/login')
          return
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
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
      } catch (err) {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchReportCards()
  }, [router])

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
        setReportCards(reportCards.map(card => 
          card.id === id ? { ...card, status: 'approved' } : card
        ))
      }
    } catch (err) {
      setError('Failed to approve')
    }
  }

  const handleReject = async (id: number) => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/report-cards/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setReportCards(reportCards.map(card => 
          card.id === id ? { ...card, status: 'rejected' } : card
        ))
      }
    } catch (err) {
      setError('Failed to reject')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="animate-pulse text-brand-primary font-black text-xl uppercase tracking-tighter">
          Generating Analytics...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden font-sans">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none rotate-12">
        <Leaf size={300} className="text-brand-accent" />
      </div>

      <div className="relative mx-auto max-w-7xl p-6 lg:p-8 space-y-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-brand-white p-10 rounded-[3rem] shadow-xl shadow-brand-primary/5 border border-brand-100">
          <div>
            <h1 className="text-4xl font-black text-brand-heading tracking-tight">Academic Performance</h1>
            <p className="text-brand-text font-medium mt-2 text-lg">Verification and review of terminal report cards.</p>
          </div>
          <div className="flex gap-4">
             <Link href="/dashboard/report-cards/pending" className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all">
                Pending Approval ({reportCards.filter(c => c.status === 'pending').length})
             </Link>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-[2rem] flex items-center gap-4 animate-fadeIn">
            <AlertCircle size={24} />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {/* Main Records Card */}
        <div className="bg-brand-white rounded-[3.5rem] shadow-2xl shadow-brand-primary/5 border border-brand-100 overflow-hidden">
          <div className="p-8 border-b border-brand-bg flex items-center justify-between bg-brand-bg/20">
            <h2 className="text-xl font-black text-brand-heading uppercase tracking-widest flex items-center gap-3">
              <Award className="text-brand-primary" />
              Directory of Records
            </h2>
            <div className="relative w-64 hidden md:block">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent" size={16} />
               <input type="text" placeholder="Filter by student..." className="w-full bg-white border border-brand-100 rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none" />
            </div>
          </div>

          <div className="overflow-x-auto">
            {reportCards.length === 0 ? (
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
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Academic Context</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Status</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Validator</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-brand-text">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-bg/30">
                  {reportCards.map((card) => (
                    <tr key={card.id} className="hover:bg-brand-bg/20 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-brand-100 flex items-center justify-center">
                              <FileText size={18} className="text-brand-secondary" />
                           </div>
                           <p className="text-sm font-black text-brand-heading">{card.studentName}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-brand-heading">{card.grade}</p>
                        <p className="text-[10px] text-brand-text font-black uppercase">{card.term} • {card.academicYear}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          card.status === 'approved' 
                            ? 'bg-brand-success/10 text-brand-success border-brand-success/20'
                            : card.status === 'rejected'
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : 'bg-brand-accent/10 text-brand-primary border-brand-accent/20'
                        }`}>
                          {card.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-bold text-brand-text uppercase">{card.submittedBy}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {card.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                             <button 
                               onClick={() => handleApprove(card.id)}
                               className="p-2 bg-brand-success text-white rounded-lg hover:scale-110 transition-transform shadow-md"
                             >
                               <CheckCircle size={18} />
                             </button>
                             <button 
                               onClick={() => handleReject(card.id)}
                               className="p-2 bg-red-500 text-white rounded-lg hover:scale-110 transition-transform shadow-md"
                             >
                               <XCircle size={18} />
                             </button>
                          </div>
                        ) : (
                          <button className="p-2 bg-brand-bg text-brand-primary rounded-xl border border-brand-100 hover:bg-brand-primary hover:text-white transition-all group-hover:scale-105">
                             <ChevronRight size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
