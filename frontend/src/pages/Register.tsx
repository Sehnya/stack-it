import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Lock,
  User,
  AlertCircle,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const Register = () => {
  const navigate = useNavigate()
  const auth = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  
  // Verification state
  const [showVerification, setShowVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Username validation
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameError, setUsernameError] = useState('')

  // Username must be alphanumeric only
  const isUsernameValid = /^[a-zA-Z0-9]{3,20}$/.test(username)

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      setUsernameError('')
      return
    }

    if (!isUsernameValid) {
      setUsernameAvailable(false)
      setUsernameError('Only letters and numbers allowed')
      return
    }

    // Username format is valid, allow signup (server will validate uniqueness)
    setUsernameAvailable(true)
    setUsernameError('')
  }, [username, isUsernameValid])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Password strength indicators
  const passwordChecks = {
    length: password.length >= 6,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
  }

  const isPasswordValid = Object.values(passwordChecks).every(Boolean)

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric characters
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '')
    setUsername(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    if (!isUsernameValid) {
      setError('Please choose a valid username (3-20 alphanumeric characters)')
      return
    }

    if (!isPasswordValid) {
      setError('Please meet all password requirements')
      return
    }

    setIsLoading(true)

    const result = await api.auth.signup(username, email, password)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    if (result.data?.requiresVerification) {
      setVerificationEmail(result.data.email || email)
      setShowVerification(true)
      setResendCooldown(60)
    } else if (result.data?.user) {
      navigate('/dashboard')
    }

    setIsLoading(false)
  }

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only digits

    const newCode = [...verificationCode]
    newCode[index] = value.slice(-1) // Only last digit
    setVerificationCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...verificationCode]
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i]
    }
    setVerificationCode(newCode)
    if (pasted.length === 6) {
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const code = verificationCode.join('')
    if (code.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setVerifyLoading(true)
    setError('')

    const result = await api.auth.verify(verificationEmail, code)

    if (result.error) {
      setError(result.error)
      setVerifyLoading(false)
      return
    }

    if (result.data?.user) {
      auth.setUser(result.data.user)
      navigate('/dashboard')
    }

    setVerifyLoading(false)
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return

    setResendLoading(true)
    setError('')

    const result = await api.auth.resendCode(verificationEmail)

    if (result.error) {
      setError(result.error)
    } else {
      setResendCooldown(60)
    }

    setResendLoading(false)
  }

  // Verification screen
  if (showVerification) {
    return (
      <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm"
        >
          <button
            onClick={() => setShowVerification(false)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-600">
              We sent a verification code to<br />
              <span className="font-medium text-gray-900">{verificationEmail}</span>
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-700"
            >
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter verification code
            </label>
            <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none transition-colors"
                />
              ))}
            </div>
          </div>

          <motion.button
            onClick={handleVerify}
            disabled={verifyLoading || verificationCode.join('').length !== 6}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {verifyLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Verifying...
              </span>
            ) : (
              'Verify Email'
            )}
          </motion.button>

          <div className="text-center">
            <span className="text-gray-600 text-sm">Didn't receive the code? </span>
            <button
              onClick={handleResendCode}
              disabled={resendLoading || resendCooldown > 0}
              className="text-gray-900 font-medium text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? (
                'Sending...'
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                'Resend code'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#e5e7eb] flex">
      {/* Left Panel - Visual */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden lg:flex flex-1 bg-gray-900 items-center justify-center p-12"
      >
        <div className="max-w-md text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8"
          >
            <img
              src="/images/black-logo.png"
              alt="Stack-it"
              className="w-16 h-16 object-contain invert"
            />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Join the community
          </h2>
          <p className="text-gray-400">
            Create your account and start sharing your tech stack with
            developers around the world.
          </p>

          {/* Feature highlights */}
          <div className="mt-12 space-y-4 text-left">
            {[
              'Share your projects and tech stacks',
              'Connect with like-minded developers',
              'Discover trending technologies',
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-3 text-gray-300"
              >
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                {feature}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <NavLink
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to home
          </NavLink>

          <div className="flex items-center gap-3 mb-8">
            <img
              src="/images/black-logo.png"
              alt="Stack-it"
              className="w-12 h-12 object-contain"
            />
            <span className="text-2xl font-semibold text-gray-900">
              Stack-it
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create account
          </h1>
          <p className="text-gray-600 mb-8">
            Start your journey with Stack-it today
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-700"
            >
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="johndoe123"
                  className={`w-full pl-11 pr-10 py-3 bg-white rounded-xl border transition-colors focus:outline-none ${
                    username.length >= 3
                      ? usernameAvailable === true
                        ? 'border-green-300 focus:border-green-400'
                        : usernameAvailable === false
                        ? 'border-red-300 focus:border-red-400'
                        : 'border-gray-200 focus:border-gray-400'
                      : 'border-gray-200 focus:border-gray-400'
                  }`}
                  required
                  minLength={3}
                  maxLength={20}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameChecking ? (
                    <Loader2 size={18} className="text-gray-400 animate-spin" />
                  ) : username.length >= 3 ? (
                    usernameAvailable === true ? (
                      <Check size={18} className="text-green-500" />
                    ) : usernameAvailable === false ? (
                      <X size={18} className="text-red-500" />
                    ) : null
                  ) : null}
                </div>
              </div>
              {usernameError && (
                <p className="text-xs text-red-500 mt-1">{usernameError}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Letters and numbers only, 3-20 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-white rounded-xl border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password requirements */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 space-y-1"
                >
                  {[
                    { check: passwordChecks.length, label: 'At least 6 characters' },
                    { check: passwordChecks.hasLetter, label: 'Contains a letter' },
                    { check: passwordChecks.hasNumber, label: 'Contains a number' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-xs ${
                        item.check ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      <Check size={12} />
                      {item.label}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-gray-900 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-gray-900 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || !isUsernameValid}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-gray-600">Already have an account? </span>
            <NavLink
              to="/login"
              className="text-gray-900 font-medium hover:underline"
            >
              Sign in
            </NavLink>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Register
