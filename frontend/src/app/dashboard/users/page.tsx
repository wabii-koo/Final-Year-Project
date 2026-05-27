'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, User, Mail, Phone, Shield, Filter, ArrowLeft, MoreVertical, CheckCircle, XCircle } from 'lucide-react'

interface SchoolUser {
  userId: number
  fullName: string
  email: string
  role: string
  phoneNo: string
  isActive: boolean
  profileImage: string | null
}

export default function UserDirectoryPage() {
  const router = useRouter()
  const [users, setUsers] = useState<SchoolUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  const fetchUsers = async (query = searchQuery) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const url = new URL('/api/admin/users/search', apiUrl)
      if (query) url.searchParams.append('query', query)
      if (roleFilter) url.searchParams.append('role', roleFilter)

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      } else {
        setError(data.message || 'Failed to search users')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(searchQuery)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'director': return 'bg-red-100 text-red-800'
      case 'registrar': return 'bg-purple-100 text-purple-800'
      case 'teacher':
      case 'homeroom_teacher': return 'bg-blue-100 text-blue-800'
      case 'guardian': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-2 font-medium">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System User Directory</h1>
        <p className="text-gray-600 mt-1">Manage and audit all staff, teachers, and guardians registered in the system.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-11 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="director">Director</option>
                <option value="registrar">Registrar</option>
                <option value="teacher">Teacher</option>
                <option value="homeroom_teacher">Homeroom Teacher</option>
                <option value="guardian">Guardian</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Searching directory...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">User Details</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Role</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Contact</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Status</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.userId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className="h-10 w-10 min-w-[40px] rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                          {u.profileImage ? (
                            <img src={u.profileImage} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            u.fullName.split(' ').map(n => n[0]).join('')
                          )}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-bold text-gray-900">{u.fullName}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getRoleBadgeColor(u.role)}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col space-y-1 text-xs text-gray-600 font-medium">
                        <span className="flex items-center"><Phone className="h-3 w-3 mr-2" /> {u.phoneNo}</span>
                        <span className="flex items-center"><Mail className="h-3 w-3 mr-2" /> {u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {u.isActive ? (
                        <span className="flex items-center text-xs font-bold text-green-600">
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center text-xs font-bold text-red-500">
                          <XCircle className="h-3.5 w-3.5 mr-1.5" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
