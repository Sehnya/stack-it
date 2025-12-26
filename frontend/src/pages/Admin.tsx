import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, FileText, Eye, MessageSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { api, AdminStats } from '../lib/api'
import { StatCard } from '../components/StatCard'
import { AdminUserTable } from '../components/admin/AdminUserTable'
import { AdminPostTable } from '../components/admin/AdminPostTable'

const Admin = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts'>('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Redirect non-admins
  if (user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const fetchStats = async () => {
    setLoading(true)
    const { data } = await api.admin.getStats()
    if (data) setStats(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchStats()
  }, [])

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
          <StatCard 
            icon={Users} 
            label="Total Users" 
            value={stats.users} 
            subValue={`+${stats.recentSignups} this week`} 
            color="bg-gray-900" 
          />
          <StatCard 
            icon={FileText} 
            label="Total Posts" 
            value={stats.posts} 
            subValue={`+${stats.recentPosts} this week`} 
            color="bg-gray-700" 
            delay={0.05}
          />
          <StatCard 
            icon={Eye} 
            label="Total Views" 
            value={stats.views} 
            color="bg-gray-600" 
            delay={0.1}
          />
          <StatCard 
            icon={MessageSquare} 
            label="Comments" 
            value={stats.comments} 
            color="bg-gray-500" 
            delay={0.15}
          />
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <AdminUserTable onUserChange={fetchStats} />
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <AdminPostTable onPostChange={fetchStats} />
      )}
    </div>
  )
}

export default Admin
