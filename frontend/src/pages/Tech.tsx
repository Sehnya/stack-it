import { useState, useEffect } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileCode, Heart, Eye, Code2, Zap } from 'lucide-react'
import { api, Post } from '../lib/api'
import { TechTag, getTechColor } from '../components/TechTag'

const Tech = () => {
  const { techName } = useParams<{ techName: string }>()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const decodedTech = decodeURIComponent(techName || '')
  const techColor = getTechColor(decodedTech)

  useEffect(() => {
    const fetchPosts = async () => {
      if (!techName) return
      setLoading(true)

      const { data } = await api.posts.getByTech(decodedTech)
      if (data) {
        setPosts(data)
      }

      setLoading(false)
    }
    fetchPosts()
  }, [techName, decodedTech])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading posts...</p>
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

  return (
    <div className="max-w-5xl mx-auto">
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

      {/* Tech Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-200/50 overflow-hidden mb-6"
        style={{ backgroundColor: techColor.bg + '20' }}
      >
        <div 
          className="h-24"
          style={{ 
            background: `linear-gradient(135deg, ${techColor.bg} 0%, ${techColor.bg}cc 100%)` 
          }}
        />
        <div className="px-6 pb-6 -mt-8">
          <div className="flex items-end gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold border-4 border-white shadow-lg"
              style={{ backgroundColor: techColor.bg, color: techColor.text }}
            >
              {decodedTech.charAt(0).toUpperCase()}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold text-gray-900">{decodedTech}</h1>
              <p className="text-gray-500 text-sm">{posts.length} stacks using this technology</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Posts Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileCode size={20} />
          Stacks with {decodedTech}
        </h2>

        {posts.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 text-center">
            <FileCode size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No stacks using {decodedTech} yet</p>
            <NavLink
              to="/create-post"
              className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              Be the first to share
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
