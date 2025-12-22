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
      }
    } catch {
      // Not authenticated
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const { data, error } = await api.auth.login(email, password)

    if (error) {
      return { error }
    }

    if (data?.user) {
      setUser(data.user)
    }

    return {}
  }

  const signup = async (username: string, email: string, password: string) => {
    const { data, error } = await api.auth.signup(username, email, password)

    if (error) {
      return { error }
    }

    if (data?.user) {
      setUser(data.user)
    }

    return {}
  }

  const logout = async () => {
    await api.auth.logout()
    setUser(null)
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
