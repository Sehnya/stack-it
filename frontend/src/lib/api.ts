const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface ApiResponse<T> {
  data?: T
  error?: string
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()

    if (data.error) {
      return { error: data.error }
    }

    return { data }
  } catch (error) {
    console.error('API Error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ message: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    signup: (username: string, email: string, password: string) =>
      request<{ message: string; user: User }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      }),

    logout: () =>
      request<{ message: string }>('/api/auth/logout', {
        method: 'POST',
      }),

    me: () =>
      request<{ user: User }>('/api/auth/me'),
  },
}

export interface User {
  id: number
  username: string
  email: string
  role: string
  profilePhoto?: string
  lastSeen?: string
  dismissedWelcomeBanner?: boolean
}
