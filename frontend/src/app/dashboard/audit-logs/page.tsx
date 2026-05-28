'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  X,
  AlertCircle,
  Activity,
  Calendar,
  ChevronRight,
  Eye,
  Info,
  Server,
  ArrowRight,
  Laptop
} from 'lucide-react'

interface UserDetails {
  fullName: string
  email: string
}

interface AuditLog {
  logId: number
  userId: number
  action: string
  tableName: string
  recordId: number
  oldValues: Record<string, any> | null
  newValues: Record<string, any> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user?: UserDetails
}

export default function AuditLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [actionFilter, entityFilter, startDate, endDate])

  const fetchLogs = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      
      let url = `${apiUrl}/api/registration/registrar/audit-logs?limit=100`
      if (actionFilter) url += `&action=${encodeURIComponent(actionFilter)}`
      if (entityFilter) url += `&entity=${encodeURIComponent(entityFilter)}`
      if (startDate && endDate) {
        url += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setLogs(data.data || [])
      } else {
        setError(data.error?.message || 'Failed to fetch audit logs')
      }
    } catch (err) {
      setError('Network error. Failed to load audit records.')
    } finally {
      setLoading(false)
    }
  }

  const formatActionName = (action: string): string => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const getActionBadgeColor = (action: string): string => {
    const act = action.toLowerCase()
    if (act.includes('approve') || act.includes('create')) {
      return 'bg-green-50 text-green-700 border-green-200/50'
    }
    if (act.includes('reject') || act.includes('delete')) {
      return 'bg-red-50 text-red-700 border-red-200/50'
    }
    if (act.includes('update') || act.includes('correct') || act.includes('revision')) {
      return 'bg-brand-primary/5 text-brand-primary border-brand-primary/20'
    }
    return 'bg-slate-50 text-slate-700 border-slate-200/50'
  }

  const filteredLogs = logs.filter(log => {
    const matchesUser = log.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        log.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        log.tableName?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesUser
  })

  // Group log values into changed fields for easy readability
  const renderDiff = (log: AuditLog) => {
    const oldVal = log.oldValues || {}
    const newVal = log.newValues || {}
    const keys = Array.from(new Set([...Object.keys(oldVal), ...Object.keys(newVal)]))

    if (keys.length === 0) {
      return <p className="text-slate-400 text-xs italic">No specific values recorded.</p>
    }

    return (
      <div className="space-y-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-brand-100 text-[10px] uppercase tracking-wider text-brand-text font-black">
              <th className="py-2 px-4">Field</th>
              <th className="py-2 px-4">Before</th>
              <th className="py-2 px-4">After</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100 text-xs">
            {keys.map(key => {
              const before = oldVal[key]
              const after = newVal[key]
              const isChanged = JSON.stringify(before) !== JSON.stringify(after)

              return (
                <tr key={key} className={`hover:bg-brand-bg/25 transition-colors ${isChanged ? 'bg-brand-primary/5 font-semibold text-brand-heading' : 'text-brand-text'}`}>
                  <td className="py-3 px-4 font-mono text-[11px]">{key}</td>
                  <td className="py-3 px-4 break-all">
                    {before !== undefined ? (
                      typeof before === 'object' ? JSON.stringify(before) : String(before)
                    ) : (
                      <span className="text-slate-300 italic">undefined</span>
                    )}
                  </td>
                  <td className="py-3 px-4 break-all flex items-center gap-2">
                    {isChanged && before !== undefined && <ArrowRight size={12} className="text-brand-accent shrink-0" />}
                    <span>
                      {after !== undefined ? (
                        typeof after === 'object' ? JSON.stringify(after) : String(after)
                      ) : (
                        <span className="text-slate-300 italic">undefined</span>
                      )}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden font-sans">
      <div className="relative mx-auto max-w-7xl p-6 lg:p-8 space-y-10">
        {/* Header */}
        <header className="bg-brand-white rounded-[3rem] p-8 shadow-xl shadow-brand-primary/5 border border-brand-100 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-brand-heading tracking-tight flex items-center gap-3">
              <ClipboardList className="text-brand-primary" size={36} />
              System Audit Logs
            </h1>
            <p className="text-brand-text mt-2 text-lg font-medium">
              Real-time monitoring of administrative and registration events.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            aria-label="Refresh logs"
            className="p-4 bg-brand-bg text-brand-primary rounded-2xl border border-brand-100 hover:bg-white transition-all shadow-sm relative z-10 shrink-0 self-start md:self-center"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </header>

        {/* Filters Panel */}
        <div className="bg-brand-white p-6 rounded-[2rem] border border-brand-100 shadow-xl shadow-brand-primary/5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent" size={18} />
              <input
                type="text"
                placeholder="Search user, action, or table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-3 pl-12 pr-4 text-brand-heading font-bold placeholder-brand-text/50 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
              />
            </div>

            <div>
              <select
                aria-label="Filter by Action Type"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-3 px-4 text-brand-heading font-bold outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
              >
                <option value="">All Action Types</option>
                <option value="APPROVED">Registration Approvals</option>
                <option value="REJECTED">Registration Rejections</option>
                <option value="CORRECTION">Correction Requests</option>
                <option value="UPDATE">Update Actions</option>
                <option value="CREATE">Creation Actions</option>
                <option value="DELETE">Deletion Actions</option>
              </select>
            </div>

            <div>
              <select
                aria-label="Filter by Table Entity"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-3 px-4 text-brand-heading font-bold outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
              >
                <option value="">All Database Entities</option>
                <option value="users">Users</option>
                <option value="GuardianRegistrations">Guardian Registrations</option>
                <option value="Students">Students</option>
                <option value="ReportCards">Report Cards</option>
                <option value="Homework">Homework</option>
                <option value="Notifications">Notifications</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center pt-2 border-t border-brand-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-text flex items-center gap-2">
              <Calendar size={14} className="text-brand-primary" />
              Date Filter Range:
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-brand-bg border border-brand-100 rounded-xl px-3 py-1.5 text-xs font-bold text-brand-heading outline-none"
              />
              <span className="text-slate-400 text-xs font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-brand-bg border border-brand-100 rounded-xl px-3 py-1.5 text-xs font-bold text-brand-heading outline-none"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('')
                    setEndDate('')
                  }}
                  className="text-xs text-brand-primary font-black uppercase hover:underline ml-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 font-bold p-6 rounded-3xl border border-red-100 flex items-center gap-3">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Audit Log Table */}
        <div className="bg-brand-white rounded-[3rem] shadow-xl shadow-brand-primary/5 border border-brand-100 overflow-hidden">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              <p className="text-sm font-bold text-brand-text uppercase tracking-widest">Querying Audit Ledger...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brand-bg border-b border-brand-100">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">User / Operator</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Action Type</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Database Target</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Client IP</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-brand-text">Timestamp</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-brand-text">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.logId} className="hover:bg-brand-bg transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary font-black text-xs uppercase">
                            {log.user?.fullName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-black text-brand-heading">{log.user?.fullName || 'System Event'}</p>
                            <p className="text-[10px] text-brand-text font-bold uppercase">{log.user?.email || 'automated@system'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getActionBadgeColor(log.action)}`}>
                          {formatActionName(log.action)}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-brand-heading">{log.tableName}</p>
                        <p className="text-[9px] text-brand-secondary font-black uppercase tracking-wider">Record ID #{log.recordId}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-mono font-bold text-brand-text">{log.ipAddress || 'Internal'}</span>
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-brand-text">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedLog(log)
                            setShowModal(true)
                          }}
                          className="px-3 py-1.5 bg-brand-bg text-brand-primary border border-brand-100 hover:bg-brand-primary hover:text-white transition-all text-xs font-black uppercase tracking-wider rounded-xl shadow-sm"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredLogs.length === 0 && (
                <div className="py-24 text-center">
                  <Activity className="mx-auto text-brand-accent/20" size={64} />
                  <p className="mt-4 text-brand-text font-bold uppercase tracking-widest">No audit trails recorded</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-4 bg-brand-heading/40 backdrop-blur-sm">
          <div className="bg-brand-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-brand-100 flex flex-col animate-fadeIn">
            {/* Modal Header */}
            <div className="px-10 py-6 border-b border-brand-100 flex justify-between items-center bg-brand-bg/50">
              <h3 className="text-2xl font-black text-brand-heading tracking-tight flex items-center gap-3">
                <ShieldCheck className="text-brand-primary" />
                Audit Trail Record #{selectedLog.logId}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-brand-bg rounded-xl transition-colors"
                aria-label="Close details"
              >
                <X size={24} className="text-brand-heading" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-text mb-3">Actor / Operator</h4>
                  <div className="bg-brand-bg border border-brand-100 p-5 rounded-2xl space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-brand-text">User Name:</span>
                      <span className="font-black text-brand-heading">{selectedLog.user?.fullName || 'System (Cron/Trigger)'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-brand-text">User Email:</span>
                      <span className="font-black text-brand-heading">{selectedLog.user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-brand-text">Database Table:</span>
                      <span className="font-mono text-brand-primary font-bold">{selectedLog.tableName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-brand-text">Target Record ID:</span>
                      <span className="font-bold text-brand-heading">#{selectedLog.recordId}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-text mb-3">Origin Context</h4>
                  <div className="bg-brand-bg border border-brand-100 p-5 rounded-2xl space-y-2">
                    <div className="flex justify-between text-xs items-center gap-4">
                      <span className="font-bold text-brand-text flex items-center gap-1 shrink-0">
                        <Server size={12} className="text-brand-accent" /> IP Address:
                      </span>
                      <span className="font-mono font-bold text-brand-heading break-all">{selectedLog.ipAddress || 'Internal System'}</span>
                    </div>
                    <div className="flex justify-between text-xs items-start gap-4">
                      <span className="font-bold text-brand-text flex items-center gap-1 shrink-0 mt-0.5">
                        <Laptop size={12} className="text-brand-accent" /> Client Device:
                      </span>
                      <span className="font-medium text-brand-heading break-all text-right text-[11px] leading-relaxed">
                        {selectedLog.userAgent || 'No device details captured'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-text mb-3 flex items-center gap-2">
                  <Info size={14} className="text-brand-primary" />
                  Data Transaction Details (JSON Diff)
                </h4>
                <div className="bg-brand-bg border border-brand-100 rounded-3xl p-6 overflow-x-auto">
                  {renderDiff(selectedLog)}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-6 bg-brand-bg border-t border-brand-100 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-8 py-3.5 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
