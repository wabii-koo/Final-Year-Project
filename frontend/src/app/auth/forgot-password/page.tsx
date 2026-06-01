'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Key, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, GraduationCap } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1) // 1: Request, 2: Reset, 3: Success
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()

      if (data.success) {
        setMessage('A reset token has been generated.')
        // In this demo, the token is returned in the response for convenience
        if (data.data?.token) {
          console.log('Reset Token (Demo):', data.data.token)
        }
        setStep(2)
      } else {
        setError(data.error?.message || 'Failed to process request.')
      }
    } catch (err) {
      setError('A network error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await response.json()

      if (data.success) {
        setStep(3)
      } else {
        setError(data.error?.message || 'Invalid or expired token.')
      }
    } catch (err) {
      setError('A network error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      {/* Top Header Bar - Consistent Green Header */}
      <header className="w-full bg-brand-primary shadow-lg">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1 rounded-full border border-white/20 w-10 h-10 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="GuardianGate Logo" className="object-contain w-full h-full" />
            </div>
            <span className="text-white font-black text-xl tracking-tighter uppercase">
              GuardianGate
            </span>
          </div>
          <GraduationCap className="text-white/40 w-5 h-5 hidden md:block" />
        </div>
      </header>

      <main className="flex-1 flex justify-center p-4 py-12 md:p-8 overflow-y-auto">
        <div className="w-full max-w-[480px] my-auto animate-fadeIn">
          <div className="bg-brand-white rounded-[3rem] shadow-2xl shadow-brand-primary/5 p-8 md:p-12 relative overflow-hidden border border-brand-100">
            <div className="text-center mb-8 relative z-10">
              <h1 className="text-3xl font-black text-brand-heading mb-2 tracking-tight uppercase">
                {step === 1 ? 'Forgot Password' : step === 2 ? 'Reset Password' : 'Success'}
              </h1>
              <p className="text-brand-text text-sm font-bold">
                {step === 1 && 'Enter your email to receive a reset token'}
                {step === 2 && 'Enter the token and your new password'}
                {step === 3 && 'Your password has been reset successfully'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleRequestReset} className="space-y-6 relative z-10">
                <Input
                  label="Email Address *"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  placeholder="example@school.com"
                  className="bg-brand-bg border-brand-100 rounded-2xl"
                  required
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-linear-to-r from-brand-primary to-brand-accent text-white font-black text-lg shadow-xl shadow-brand-primary/20 transform active:scale-[0.98] transition-all"
                >
                  {loading ? 'Processing...' : 'Send Reset Token'}
                </Button>
                <div className="text-center">
                  <Link href="/auth/login" className="text-brand-primary font-bold hover:underline flex items-center justify-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                  </Link>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-6 relative z-10">
                <div className="p-4 bg-brand-bg border border-brand-100 rounded-2xl text-brand-primary text-sm font-bold mb-4 text-center">
                  Please enter the verification code sent to your email.
                </div>
                <Input
                  label="Reset Token *"
                  icon={Key}
                  type="text"
                  value={token}
                  onChange={(e: any) => setToken(e.target.value)}
                  placeholder="Enter 6-digit token"
                  className="bg-brand-bg border-brand-100 rounded-2xl"
                  required
                />
                <Input
                  label="New Password *"
                  icon={Lock}
                  type="password"
                  value={newPassword}
                  onChange={(e: any) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-brand-bg border-brand-100 rounded-2xl"
                  required
                />
                <Input
                  label="Confirm Password *"
                  icon={Lock}
                  type="password"
                  value={confirmPassword}
                  onChange={(e: any) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-brand-bg border-brand-100 rounded-2xl"
                  required
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-linear-to-r from-brand-primary to-brand-accent text-white font-black text-lg shadow-xl shadow-brand-primary/20 transform active:scale-[0.98] transition-all"
                >
                  {loading ? 'Resetting...' : 'Update Password'}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => setStep(1)} className="text-brand-text font-bold hover:text-brand-primary flex items-center justify-center gap-2 text-sm">
                    <ArrowLeft className="h-4 w-4" /> Change Email
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="text-center space-y-6 relative z-10">
                <div className="bg-brand-success/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-brand-success/20">
                  <CheckCircle className="h-10 w-10 text-brand-success" />
                </div>
                <p className="text-brand-text font-bold">
                  Your password has been reset successfully.
                </p>
                <Button
                  onClick={() => router.push('/auth/login')}
                  className="w-full py-4 rounded-2xl bg-linear-to-r from-brand-primary to-brand-accent text-white font-black text-lg shadow-xl shadow-brand-primary/20"
                >
                  Go to Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
