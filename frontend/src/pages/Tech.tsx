import { useState, useEffect } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileCode, Heart, Eye, Code2, Zap, Pin, PinOff, Users, MessageSquare, TrendingUp } from 'lucide-react'
import { api, Post } from '../lib/api'
import { TechTag, getTechColor } from '../components/TechTag'

const Tech = () => {
  const { techName } = useParams<{ techName: string }>()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isPinned, setIsPinned] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)

  const decodedTech = decodeURIComponent(techName || '')
  const techColor = getTechColor(decodedTech)

  useEffect(() => {
    const fetchData = async () => {
      if (!techName) return
      setLoading(true)

      const [postsRes, pinnedRes] = await Promise.all([
        api.posts.getByTech(decodedTech),
        api.pinnedTech.getAll(),
      ])

      if (postsRes.data) setPosts(postsRes.data)
      if (pinnedRes.data) {
        setIsPinned(pinnedRes.data.some(pt => pt.techName.toLowerCase() === decodedTech.toLowerCase()))
      }

      // Mark as read when visiting
      await api.pinnedTech.markAsRead(decodedTech)

      setLoading(false)
    }
    fetchData()
  }, [techName, decodedTech])

  const handleTogglePin = async () => {
    setPinLoading(true)
    if (isPinned) {
      await api.pinnedTech.unpin(decodedTech)
      setIsPinned(false)
    } else {
      await api.pinnedTech.pin(decodedTech)
      setIsPinned(true)
    }
    // Notify sidebar to refresh
    window.dispatchEvent(new CustomEvent('pinnedTechUpdated'))
    setPinLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading community...</p>
        </div>
      </div>
    )
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const totalViews = posts.reduce((sum, p) => sum + p.viewCount, 0)
  const totalLikes = posts.reduce((sum, p) => sum + p.favorites, 0)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <NavLink
          to="/community"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Community</span>
        </NavLink>
      </motion.div>

      {/* Tech Community Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-200/50 overflow-hidden mb-6 bg-white/70 backdrop-blur-sm"
      >
        <div 
          className="h-32 relative"
          style={{ 
            background: `linear-gradient(135deg, ${techColor.bg} 0%, ${techColor.bg}cc 50%, ${techColor.bg}99 100%)` 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
        </div>
        <div className="px-6 pb-6 -mt-10">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg"
                style={{ backgroundColor: techColor.bg, color: techColor.text }}
              >
                {decodedTech.charAt(0).toUpperCase()}
              </div>
              <div className="pb-2">
                <h1 className="text-2xl font-bold text-gray-900">{decodedTech}</h1>
                <p className="text-gray-500 text-sm flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1">
                    <FileCode size={14} /> {posts.length} stacks
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={14} /> {totalViews.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={14} /> {totalLikes} likes
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={handleTogglePin}
              disabled={pinLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isPinned 
                  ? 'bg-gray-900 text-white hover:bg-gray-800' 
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              } ${pinLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPinned ? (
                <>
                  <PinOff size={16} />
                  Unpin from Sidebar
                </>
              ) : (
                <>
                  <Pin size={16} />
                  Pin to Sidebar
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Community Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-4 gap-4 mb-6"
      >
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
          <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
            <FileCode size={14} /> Stacks
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</div>
          <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
            <Eye size={14} /> Views
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalLikes}</div>
          <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
            <Heart size={14} /> Likes
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{new Set(posts.map(p => p.author.id)).size}</div>
          <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
            <Users size={14} /> Contributors
          </div>
        </div>
      </motion.div>

      {/* Posts Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} />
            Latest Stacks
          </h2>
          <NavLink
            to="/create-post"
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            Share a Stack
          </NavLink>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 text-center">
            <FileCode size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No stacks using {decodedTech} yet</p>
            <p className="text-sm text-gray-400 mb-4">Be the first to share your {decodedTech} project!</p>
            <NavLink
              to="/create-post"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              Share Your Stack
            </NavLink>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden hover:shadow-lg transition-all"
              >
                {post.coverImage && (
                  <NavLink to={`/post/${post.id}`}>
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {index < 3 && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500 rounded-full">
                          <Zap size={12} className="text-white" />
                          <span className="text-xs font-semibold text-white">Popular</span>
                        </div>
                      )}
                    </div>
                  </NavLink>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <NavLink to={`/profile/${post.author.id}`}>
                      <img
                        src={post.author.avatar}
                        alt={post.author.username}
                        className="w-7 h-7 rounded-full"
                      />
                    </NavLink>
                    <NavLink 
                      to={`/profile/${post.author.id}`}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      {post.author.username}
                    </NavLink>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
                  </div>
                  <NavLink to={`/post/${post.id}`}>
                    <h3 className="font-semibold text-gray-900 hover:text-gray-700 mb-2 line-clamp-1">
                      {post.title}
                    </h3>
                  </NavLink>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.excerpt}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.technologies.slice(0, 4).map((tech) => (
                      <NavLink key={tech} to={`/tech/${encodeURIComponent(tech)}`}>
                        <TechTag tech={tech} size="sm" />
                      </NavLink>
                    ))}
                    {post.technologies.length > 4 && (
                      <span className="text-xs text-gray-400 self-center">+{post.technologies.length - 4}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Heart size={14} /> {post.favorites}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={14} /> {post.viewCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Code2 size={14} /> {post.files?.length || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={14} /> {post.comments || 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Tech
