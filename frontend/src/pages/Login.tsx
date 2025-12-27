import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { NavLink, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const Login = () => {
  const navigate = useNavigate()
  const auth = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Verification state
  const [showVerification, setShowVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await api.auth.login(email, password)

    if (result.error) {
      // Check if it requires verification
      if (result.data?.requiresVerification) {
        setVerificationEmail(result.data.email || email)
        setShowVerification(true)
        setResendCooldown(60)
      } else {
        setError(result.error)
      }
      setIsLoading(false)
      return
    }

    if (result.data?.user) {
      auth.setUser(result.data.user)
      navigate('/dashboard')
    }

    setIsLoading(false)
  }

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...verificationCode]
    newCode[index] = value.slice(-1)
    setVerificationCode(newCode)

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
      <div className="min-h-screen bg-[#e5e7eb] dark:bg-[#0f0f0f] flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 shadow-sm"
        >
          <button
            onClick={() => setShowVerification(false)}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to login
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#252525] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-gray-600 dark:text-gray-300" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Verify your email</h1>
            <p className="text-gray-600 dark:text-gray-400">
              We sent a verification code to<br />
              <span className="font-medium text-gray-900 dark:text-gray-100">{verificationEmail}</span>
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400"
            >
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
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
                  className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none transition-colors text-gray-900 dark:text-gray-100"
                />
              ))}
            </div>
          </div>

          <motion.button
            onClick={handleVerify}
            disabled={verifyLoading || verificationCode.join('').length !== 6}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
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
            <span className="text-gray-600 dark:text-gray-400 text-sm">Didn't receive the code? </span>
            <button
              onClick={handleResendCode}
              disabled={resendLoading || resendCooldown > 0}
              className="text-gray-900 dark:text-gray-100 font-medium text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="min-h-screen bg-[#e5e7eb] dark:bg-[#0f0f0f] flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <NavLink
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to home
          </NavLink>

          <div className="flex items-center gap-3 mb-8">
            <img
              src="/images/black-logo.png"
              alt="Stack-it"
              className="w-12 h-12 object-contain dark:invert"
            />
            <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Stack-it
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome back</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Sign in to continue to your account
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400"
            >
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full pl-11 pr-12 py-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 dark:border-[#333] text-gray-900 dark:text-gray-100 focus:ring-gray-500 dark:bg-[#252525]"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Forgot password?
              </a>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
            <NavLink
              to="/register"
              className="text-gray-900 dark:text-gray-100 font-medium hover:underline"
            >
              Sign up
            </NavLink>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Visual */}
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
            Share your stack with the world
          </h2>
          <p className="text-gray-400">
            Join developers sharing their tech stacks, discovering new tools,
            and building connections.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
