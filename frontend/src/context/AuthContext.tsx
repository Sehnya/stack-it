import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { api, User } from '../lib/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  signup: (
    username: string,
    email: string,
    password: string
  ) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
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
