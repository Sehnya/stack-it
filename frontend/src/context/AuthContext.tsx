import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { api, User } from '../lib/api'

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error?: string; requiresVerification?: boolean; email?: string }>
  signup: (
    username: string,
    email: string,
    password: string
  ) => Promise<{ error?: string; requiresVerification?: boolean; email?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check auth status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data, error } = await api.auth.me()
      if (!error && data?.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await api.auth.login(email, password)

      if (error) {
        // Check if verification is required
        if (data?.requiresVerification) {
          return { error, requiresVerification: true, email: data.email }
        }
        return { error }
      }

      if (data?.user) {
        setUser(data.user)
      }

      return {}
    } catch (err) {
      return { error: 'Login failed. Please try again.' }
    }
  }

  const signup = async (username: string, email: string, password: string) => {
    try {
      const { data, error } = await api.auth.signup(username, email, password)

      if (error) {
        return { error }
      }

      // Check if verification is required (new flow)
      if (data?.requiresVerification) {
        return { requiresVerification: true, email: data.email }
      }

      if (data?.user) {
        setUser(data.user)
      }

      return {}
    } catch (err) {
      return { error: 'Signup failed. Please try again.' }
    }
  }

  const logout = async () => {
    try {
      await api.auth.logout()
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
