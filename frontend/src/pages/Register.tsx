import { useState } from 'react'
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
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Password strength indicators
  const passwordChecks = {
    length: password.length >= 6,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
  }

  const isPasswordValid = Object.values(passwordChecks).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    if (!isPasswordValid) {
      setError('Please meet all password requirements')
      return
    }

    setIsLoading(true)

    const result = await signup(username, email, password)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    navigate('/dashboard')
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
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors"
                  required
                  minLength={3}
                />
              </div>
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
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
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
