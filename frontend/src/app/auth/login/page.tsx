'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  GraduationCap, 
  ChevronRight,
  Menu,
  Leaf
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'

type Role = 'Parent' | 'Teacher' | 'Registrar' | 'Director'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [activeRole, setActiveRole] = useState<Role>('Parent')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const roles: Role[] = ['Parent', 'Teacher', 'Registrar', 'Director']

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam) {
      const formattedRole = roleParam.charAt(0).toUpperCase() + roleParam.slice(1).toLowerCase()
      if (roles.includes(formattedRole as Role)) {
        setActiveRole(formattedRole as Role)
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const roleValue = activeRole.toLowerCase()
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role: roleValue }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        router.push('/dashboard')
      } else {
        setError(data.error?.message || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      setError('A network error occurred. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      {/* Top Header Bar - Exact Green from Screenshot */}
      <header className="w-full bg-brand-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-xl border border-white/20">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-white font-black text-xl tracking-tighter uppercase">
              Digital School
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Leaf className="text-white/40 w-5 h-5 hidden md:block" />
            <button className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex justify-center p-4 py-12 md:p-8 overflow-y-auto">
        <div className="w-full max-w-[480px] my-auto">
          {/* Main Card */}
          <div className="bg-brand-white rounded-[3rem] shadow-2xl shadow-brand-primary/5 p-8 md:p-12 relative overflow-hidden border border-brand-100">
            {/* Role Tabs Switcher */}
            <div className="bg-brand-100 p-1.5 rounded-2xl flex mb-10 overflow-x-auto no-scrollbar relative z-10">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setActiveRole(role)
                    setEmail('')
                    setPassword('')
                    setError('')
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                    activeRole === role 
                    ? 'bg-brand-primary text-white shadow-md' 
                    : 'text-brand-text hover:text-brand-primary'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-brand-heading mb-2 tracking-tight">
                Sign In
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-brand-primary group-focus-within:text-brand-primary transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@school.com"
                    className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 pl-12 pr-4 text-brand-heading font-medium focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-brand-primary group-focus-within:text-brand-primary transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-brand-bg border border-brand-100 rounded-2xl py-4 pl-12 pr-12 text-brand-heading font-medium focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary focus:bg-white transition-all outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-brand-primary hover:text-brand-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center group cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-5 h-5 border-2 border-brand-200 rounded-lg peer-checked:bg-brand-primary peer-checked:border-brand-primary transition-all" />
                    <svg className="absolute w-3.5 h-3.5 text-white left-[3px] top-[3px] opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="ml-2.5 text-sm font-bold text-brand-text group-hover:text-brand-primary transition-colors">
                    Remember me
                  </span>
                </label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm font-semibold text-brand-primary hover:text-brand-primaryHover transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button - Gradient from Screenshot */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-3 rounded-full border border-brand-primary/20 bg-white text-brand-heading font-black text-lg py-4 shadow-xl shadow-brand-primary/10 hover:bg-brand-primary/5 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin -ml-1 h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <>
                    <User className="w-5 h-5 text-brand-primary" />
                    Sign In
                  </>
                )}
              </Button>

              {/* Register Footer */}
              <div className="pt-4 text-center">
                <p className="text-gray-500 font-medium">
                  Don't have an account?{' '}
                  <Link 
                    href="/auth/register" 
                    className="text-brand-primary font-bold hover:underline underline-offset-4"
                  >
                    Register free
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="animate-pulse text-brand-primary font-black text-xl px-4 uppercase tracking-tighter">
          Loading Digital School...
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
