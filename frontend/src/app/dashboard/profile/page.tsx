'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Shield,
  Save,
  Key
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

interface ProfileData {
  userId: number
  email: string
  fullName: string
  role: string
  phoneNo: string
  address: string
  nationalId?: string
}

export default function ProfilePage() {
  const router = useRouter()
  
  // Loading & States
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Profile data
  const [profile, setProfile] = useState<ProfileData | null>(null)
  
  // Form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNo, setPhoneNo] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // UI States
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const data: ProfileData = result.data
        setProfile(data)
        setFullName(data.fullName || '')
        setEmail(data.email || '')
        setPhoneNo(data.phoneNo || '')
        setAddress(data.address || '')
      } else {
        setError(result.error?.message || 'Failed to load profile')
      }
    } catch (err: any) {
      setError('Network error. Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Basic password match validation
    if (password && password !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    // Password strength check
    if (password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!])[A-Za-z\d@#$%^&*!]{8,}$/
      if (!passwordRegex.test(password)) {
        setError('Password must be at least 8 characters long and contain at least one uppercase letter (A-Z), one lowercase letter (a-z), one number (0-9), and one special character (@#$%^&*!).')
        return
      }
    }

    // Ethiopian Phone validation
    const phoneRegex = /^(?:\+251|251|0)[97]\d{8}$/
    if (!phoneRegex.test(phoneNo)) {
      setError('Please enter a valid Ethiopian phone number (e.g. 0912345678, 0712345678, or +251912345678).')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName,
          email,
          phoneNo,
          address,
          ...(password ? { password } : {})
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess('Profile updated successfully!')
        setProfile(result.data)
        setPassword('')
        setConfirmPassword('')
        
        // Update user details in localStorage
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          parsedUser.fullName = fullName
          parsedUser.email = email
          localStorage.setItem('user', JSON.stringify(parsedUser))
          
          // 'storage' fires in OTHER tabs; 'user-profile-updated' fires in THIS tab too
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new Event('user-profile-updated'))
        }
      } else {
        setError(result.error?.message || 'Failed to update profile')
      }
    } catch (err: any) {
      setError('Network error. Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-brand-primary font-black text-lg uppercase tracking-widest">
          Loading profile details...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Profile Header */}
      <header className="bg-brand-white p-8 rounded-3xl shadow-xl shadow-brand-primary/5 border border-brand-100 flex flex-col md:flex-row items-center gap-6 justify-between relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-20 h-20 text-brand-accent/5 rotate-90" />
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-20 h-20 bg-brand-bg rounded-3xl overflow-hidden flex items-center justify-center shadow-inner border border-brand-100">
            <img src="/ethiopian-woman.png" alt="User Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-brand-heading tracking-tight">{profile?.fullName}</h1>
            <p className="text-brand-text font-bold text-xs uppercase tracking-widest mt-1 flex items-center justify-center md:justify-start gap-1">
              <Shield size={14} className="text-brand-primary" /> {profile?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        {profile?.nationalId && (
          <div className="p-3 bg-brand-bg rounded-2xl border border-brand-100 text-xs font-bold text-brand-text">
            National ID: <span className="text-brand-heading select-all font-mono">{profile.nationalId}</span>
          </div>
        )}
      </header>

      {/* Main Form */}
      <div className="bg-brand-white rounded-[2.5rem] shadow-xl shadow-brand-primary/5 border border-brand-100 p-8 md:p-10 relative overflow-hidden">
        <h2 className="text-xl font-black text-brand-heading uppercase tracking-wide mb-8 pb-3 border-b border-brand-100 flex items-center gap-2">
          <User className="text-brand-primary" size={20} /> Personal Profile Information
        </h2>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-red-800 text-sm font-semibold">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-brand-50 border border-brand-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-brand-success flex-shrink-0" />
            <span className="text-brand-success text-sm font-semibold">{success}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name *"
              icon={User}
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
            />

            <Input
              label="Email Address *"
              icon={Mail}
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />

            <Input
              label="Phone Number *"
              icon={Phone}
              type="tel"
              name="phoneNo"
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value)}
              placeholder="0912345678"
              required
            />

            <Input
              label="Home Address *"
              icon={MapPin}
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your residence address"
              required
            />
          </div>

          <div className="pt-6 border-t border-brand-100">
            <h3 className="text-sm font-black text-brand-heading uppercase tracking-widest mb-6 flex items-center gap-2">
              <Key className="text-brand-primary" size={16} /> Change Account Password (Optional)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="New Password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                rightIcon={showPassword ? EyeOff : Eye}
                onRightIconClick={() => setShowPassword(!showPassword)}
              />

              <Input
                label="Confirm New Password"
                icon={Lock}
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                rightIcon={showConfirmPassword ? EyeOff : Eye}
                onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </div>

            {password && (
              <div className="p-4 bg-brand-bg/50 border border-brand-100 rounded-2xl space-y-2 mt-4">
                <p className="text-[10px] font-black text-brand-heading uppercase tracking-widest mb-1">
                  Password Requirements:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'At least 8 characters', met: password.length >= 8 },
                    { label: 'At least 1 uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
                    { label: 'At least 1 lowercase letter (a-z)', met: /[a-z]/.test(password) },
                    { label: 'At least 1 number (0-9)', met: /[0-9]/.test(password) },
                    { label: 'At least 1 special character (@#$%^&*!)', met: /[@#$%^&*!]/.test(password) },
                  ].map((req, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 font-bold transition-all duration-300 ${
                        req.met ? 'text-brand-success' : 'text-brand-text/50'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center border text-[9px] font-black transition-all ${
                          req.met
                            ? 'bg-brand-success/10 border-brand-success text-brand-success'
                            : 'border-brand-100 bg-white text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="py-3 px-8 rounded-2xl bg-linear-to-r from-brand-primary to-brand-accent text-white font-black shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save size={18} /> {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
