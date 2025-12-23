import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  FileText,
  Eye,
  MessageSquare,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface AdminStats {
  users: number
  posts: number
  comments: number
  views: number
  recentSignups: number
  recentPosts: number
}

interface AdminUser {
  id: number
  username: string
  email: string
  role: string
  profilePhoto?: string
  createdAt: string
  lastSeen?: string
  postCount: number
}

interface AdminPost {
  id: number
  title: string
  author: { id: number; username: string }
  viewCount: number
  favorites: number
  comments: number
  createdAt: string
}

async function adminRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
    const data = await res.json()
    if (data.error) {
      console.error('Admin API error:', data.error)
      return null
    }
    return data
  } catch (e) {
    console.error('Admin request failed:', e)
    return null
  }
}

const StatCard = ({ icon: Icon, label, value, subValue, color }: {
  icon: any; label: string; value: number | string; subValue?: string; color: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-5"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </motion.div>
)


const Admin = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts'>('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [userTotal, setUserTotal] = useState(0)
  const [postTotal, setPostTotal] = useState(0)
  const [userPage, setUserPage] = useState(0)
  const [postPage, setPostPage] = useState(0)
  const [userSearch, setUserSearch] = useState('')
  const [postSearch, setPostSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Redirect non-admins
  if (user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'posts') fetchPosts()
  }, [activeTab, userPage, postPage])

  const fetchStats = async () => {
    setLoading(true)
    const data = await adminRequest<AdminStats>('/api/admin/stats')
    if (data) setStats(data)
    setLoading(false)
  }

  const fetchUsers = async () => {
    const data = await adminRequest<{ users: AdminUser[]; total: number }>(
      `/api/admin/users?limit=10&offset=${userPage * 10}&search=${userSearch}`
    )
    if (data) {
      setUsers(data.users)
      setUserTotal(data.total)
    }
  }

  const fetchPosts = async () => {
    const data = await adminRequest<{ posts: AdminPost[]; total: number }>(
      `/api/admin/posts?limit=10&offset=${postPage * 10}&search=${postSearch}`
    )
    if (data) {
      setPosts(data.posts)
      setPostTotal(data.total)
    }
  }

  const toggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    await adminRequest(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole }),
    })
    fetchUsers()
  }

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    await adminRequest(`/api/admin/users/${userId}`, { method: 'DELETE' })
    fetchUsers()
    fetchStats()
  }

  const deletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    await adminRequest(`/api/admin/posts/${postId}`, { method: 'DELETE' })
    fetchPosts()
    fetchStats()
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">Manage users, posts, and platform settings</p>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-1.5 mb-6 flex items-center gap-1 w-fit">
        {(['overview', 'users', 'posts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={stats.users} subValue={`+${stats.recentSignups} this week`} color="bg-gray-900" />
          <StatCard icon={FileText} label="Total Posts" value={stats.posts} subValue={`+${stats.recentPosts} this week`} color="bg-gray-700" />
          <StatCard icon={Eye} label="Total Views" value={stats.views} color="bg-gray-600" />
          <StatCard icon={MessageSquare} label="Comments" value={stats.comments} color="bg-gray-500" />
        </div>
      )}


      {/* Users Tab */}
      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="w-full pl-10 pr-4 py-2.5 bg-white/70 rounded-xl border border-gray-200 focus:border-gray-400 focus:outline-none"
              />
            </div>
            <span className="text-sm text-gray-500">{userTotal} users</span>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Posts</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{u.postCount}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleRole(u.id, u.role)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        >
                          {u.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Showing {userPage * 10 + 1}-{Math.min((userPage + 1) * 10, userTotal)} of {userTotal}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUserPage(Math.max(0, userPage - 1))}
                  disabled={userPage === 0}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setUserPage(userPage + 1)}
                  disabled={(userPage + 1) * 10 >= userTotal}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}


      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPosts()}
                className="w-full pl-10 pr-4 py-2.5 bg-white/70 rounded-xl border border-gray-200 focus:border-gray-400 focus:outline-none"
              />
            </div>
            <span className="text-sm text-gray-500">{postTotal} posts</span>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Author</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Views</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Favorites</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Created</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-900 line-clamp-1">{p.title}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{p.author.username}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{p.viewCount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{p.favorites}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{formatDate(p.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => deletePost(p.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete post"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {posts.length === 0 && (
              <div className="text-center py-12 text-gray-500">No posts found</div>
            )}

            {/* Pagination */}
            {posts.length > 0 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  Showing {postPage * 10 + 1}-{Math.min((postPage + 1) * 10, postTotal)} of {postTotal}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPostPage(Math.max(0, postPage - 1))}
                    disabled={postPage === 0}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPostPage(postPage + 1)}
                    disabled={(postPage + 1) * 10 >= postTotal}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Admin
