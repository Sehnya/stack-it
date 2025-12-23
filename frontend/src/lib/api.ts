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

export interface User {
  id: number
  username: string
  email: string
  role: string
  profilePhoto?: string
  lastSeen?: string
  dismissedWelcomeBanner?: boolean
}

export interface PostFile {
  id?: number
  name: string
  language: string
  code: string
}

export interface Post {
  id: string
  title: string
  excerpt: string
  content: string
  coverImage?: string
  technologies: string[]
  viewCount: number
  createdAt: string
  savedAt?: string
  author: {
    id: string
    username: string
    avatar: string
  }
  files: PostFile[]
  likes: number
  favorites: number
  comments?: number
}

export interface UserStats {
  posts: number
  likes: number
  views: number
  followers: number
  following: number
}

export interface TopUser {
  id: number
  name: string
  avatar: string
  stacks: number
  rank: number
}

export interface TrendingTech {
  name: string
  posts: number
  hot: boolean
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

  posts: {
    getAll: (sort: 'latest' | 'popular' = 'latest', limit = 20, offset = 0) =>
      request<Post[]>(`/api/posts?sort=${sort}&limit=${limit}&offset=${offset}`),

    getById: (id: string) =>
      request<Post>(`/api/posts/${id}`),

    create: (data: {
      title: string
      excerpt: string
      content: string
      coverImage?: string
      technologies: string[]
      files?: PostFile[]
    }) =>
      request<Post>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: {
      title: string
      excerpt: string
      content: string
      coverImage?: string
      technologies: string[]
      files?: PostFile[]
    }) =>
      request<Post>(`/api/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ message: string }>(`/api/posts/${id}`, {
        method: 'DELETE',
      }),

    like: (id: string) =>
      request<{ liked: boolean }>(`/api/posts/${id}/like`, { method: 'POST' }),

    favorite: (id: string) =>
      request<{ favorited: boolean }>(`/api/posts/${id}/favorite`, { method: 'POST' }),

    getFavorites: () =>
      request<Post[]>('/api/posts/favorites/me'),

    getStats: () =>
      request<UserStats>('/api/posts/stats/me'),

    getTopUsers: () =>
      request<TopUser[]>('/api/posts/top-users'),

    getTrendingTech: () =>
      request<TrendingTech[]>('/api/posts/trending-tech'),

    getByTech: (tech: string) =>
      request<Post[]>(`/api/posts/tech/${encodeURIComponent(tech)}`),
  },

  users: {
    getById: (id: string) =>
      request<{ user: any }>(`/api/users/${id}`),

    getPosts: (id: string, limit = 20, offset = 0) =>
      request<{ posts: any[] }>(`/api/users/${id}/posts?limit=${limit}&offset=${offset}`),

    updateProfile: (data: { username?: string; profilePhoto?: string }) =>
      request<{ message: string; user: User }>('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
}
