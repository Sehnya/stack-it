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

export interface PinnedTech {
  techName: string
  unreadCount: number
  lastReadAt: string
}

export interface Discussion {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  resolved: boolean
  pinned: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string
    avatar: string
  }
  replies: number
  postId?: string
}

export interface Snippet {
  id: string
  title: string
  description?: string
  code: string
  language: string
  tags: string[]
  viewCount: number
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string
    avatar: string
  }
  rating: {
    average: number
    count: number
    userRating?: number | null
  }
  favorites: number
  isFavorited: boolean
}

export interface AdminStats {
  users: number
  posts: number
  comments: number
  views: number
  recentSignups: number
  recentPosts: number
}

export interface AdminUser {
  id: number
  username: string
  email: string
  role: string
  profilePhoto?: string
  createdAt: string
  lastSeen?: string
  postCount: number
}

export interface AdminPost {
  id: number
  title: string
  author: { id: number; username: string }
  viewCount: number
  favorites: number
  comments: number
  createdAt: string
}

export interface FollowUser {
  id: number
  username: string
  avatar: string
  bio?: string
  posts: number
  followers: number
  followedAt: string
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ message: string; user?: User; requiresVerification?: boolean; email?: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    signup: (username: string, email: string, password: string) =>
      request<{ message: string; user?: User; requiresVerification?: boolean; email?: string }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      }),

    verify: (email: string, code: string) =>
      request<{ message: string; user: User }>('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      }),

    resendCode: (email: string) =>
      request<{ message: string }>('/api/auth/resend-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    checkUsername: (username: string) =>
      request<{ available: boolean; error?: string }>(`/api/auth/check-username/${encodeURIComponent(username)}`),

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

    updateProfile: (data: { username?: string; profilePhoto?: string; bio?: string }) =>
      request<{ message: string; user: User }>('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    follow: (id: string) =>
      request<{ following: boolean }>(`/api/users/${id}/follow`, {
        method: 'POST',
      }),

    getFollowers: (id: string, limit = 20, offset = 0) =>
      request<FollowUser[]>(`/api/users/${id}/followers?limit=${limit}&offset=${offset}`),

    getFollowing: (id: string, limit = 20, offset = 0) =>
      request<FollowUser[]>(`/api/users/${id}/following?limit=${limit}&offset=${offset}`),
  },

  pinnedTech: {
    getAll: () =>
      request<PinnedTech[]>('/api/pinned-tech'),

    pin: (tech: string) =>
      request<{ pinned: boolean }>(`/api/pinned-tech/${encodeURIComponent(tech)}`, {
        method: 'POST',
      }),

    unpin: (tech: string) =>
      request<{ pinned: boolean }>(`/api/pinned-tech/${encodeURIComponent(tech)}`, {
        method: 'DELETE',
      }),

    markAsRead: (tech: string) =>
      request<{ success: boolean }>(`/api/pinned-tech/${encodeURIComponent(tech)}/read`, {
        method: 'POST',
      }),
  },

  discussions: {
    getAll: (sort: 'latest' | 'popular' = 'latest', limit = 20, category?: string) =>
      request<Discussion[]>(`/api/discussions?sort=${sort}&limit=${limit}${category ? `&category=${category}` : ''}`),

    getById: (id: string) =>
      request<Discussion>(`/api/discussions/${id}`),

    create: (data: {
      title: string
      content: string
      category?: string
      tags?: string[]
      postId?: number
    }) =>
      request<Discussion>('/api/discussions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: {
      title?: string
      content?: string
      category?: string
      tags?: string[]
      resolved?: boolean
    }) =>
      request<Discussion>(`/api/discussions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ message: string }>(`/api/discussions/${id}`, {
        method: 'DELETE',
      }),

    getByTech: (tech: string) =>
      request<Discussion[]>(`/api/discussions/tech/${encodeURIComponent(tech)}`),

    getByUser: (userId: string) =>
      request<Discussion[]>(`/api/discussions/user/${userId}`),
  },

  admin: {
    getStats: () =>
      request<AdminStats>('/api/admin/stats'),

    getUsers: (limit = 10, offset = 0, search = '') =>
      request<{ users: AdminUser[]; total: number }>(
        `/api/admin/users?limit=${limit}&offset=${offset}&search=${encodeURIComponent(search)}`
      ),

    updateUserRole: (userId: number, role: string) =>
      request<{ message: string }>(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),

    deleteUser: (userId: number) =>
      request<{ message: string }>(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      }),

    getPosts: (limit = 10, offset = 0, search = '') =>
      request<{ posts: AdminPost[]; total: number }>(
        `/api/admin/posts?limit=${limit}&offset=${offset}&search=${encodeURIComponent(search)}`
      ),

    deletePost: (postId: number) =>
      request<{ message: string }>(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      }),
  },

  snippets: {
    getAll: (sort: 'latest' | 'popular' | 'top-rated' = 'latest', limit = 20, offset = 0, language?: string) =>
      request<Snippet[]>(`/api/snippets?sort=${sort}&limit=${limit}&offset=${offset}${language ? `&language=${language}` : ''}`),

    getById: (id: string) =>
      request<Snippet>(`/api/snippets/${id}`),

    create: (data: {
      title: string
      description?: string
      code: string
      language: string
      tags?: string[]
    }) =>
      request<Snippet>('/api/snippets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: {
      title?: string
      description?: string
      code?: string
      language?: string
      tags?: string[]
    }) =>
      request<Snippet>(`/api/snippets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ message: string }>(`/api/snippets/${id}`, {
        method: 'DELETE',
      }),

    rate: (id: string, rating: number) =>
      request<{ rating: number; average: number; count: number }>(`/api/snippets/${id}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      }),

    favorite: (id: string) =>
      request<{ favorited: boolean }>(`/api/snippets/${id}/favorite`, {
        method: 'POST',
      }),

    getByTech: (tech: string) =>
      request<Snippet[]>(`/api/snippets/tech/${encodeURIComponent(tech)}`),

    getByUser: (userId: string) =>
      request<Snippet[]>(`/api/snippets/user/${userId}`),

    getFavorites: () =>
      request<Snippet[]>('/api/snippets/favorites/me'),
  },
}
