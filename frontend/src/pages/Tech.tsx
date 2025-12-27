import { useState, useEffect } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileCode, Heart, Eye, Code2, Zap, Pin, PinOff, Users, MessageSquare, TrendingUp, HelpCircle, Sparkles, MessageCircle, CheckCircle } from 'lucide-react'
import { api, Post, Discussion, Snippet } from '../lib/api'
import { TechTag, getTechColor, getTechIconUrl } from '../components/TechTag'
import { SnippetCard } from '../components/SnippetCard'

const categoryStyles: Record<string, { bg: string; text: string; icon: typeof HelpCircle }> = {
  help: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: HelpCircle },
  showcase: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', icon: Sparkles },
  feedback: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: MessageCircle },
  general: { bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-gray-700 dark:text-gray-400', icon: MessageSquare },
}

const Tech = () => {
  const { techName } = useParams<{ techName: string }>()
  const [posts, setPosts] = useState<Post[]>([])
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [isPinned, setIsPinned] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)

  const decodedTech = decodeURIComponent(techName || '')
  const techColor = getTechColor(decodedTech)

  useEffect(() => {
    const fetchData = async () => {
      if (!techName) return
      setLoading(true)

      const [postsRes, snippetsRes, discussionsRes, pinnedRes] = await Promise.all([
        api.posts.getByTech(decodedTech),
        api.snippets.getByTech(decodedTech),
        api.discussions.getByTech(decodedTech),
        api.pinnedTech.getAll(),
      ])

      if (postsRes.data) setPosts(postsRes.data)
      if (snippetsRes.data) setSnippets(snippetsRes.data)
      if (discussionsRes.data) setDiscussions(discussionsRes.data)
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
          <div className="animate-spin w-10 h-10 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-gray-100 rounded-full mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading community...</p>
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
    <div className="min-h-screen p-6 pt-8">
      <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <NavLink
          to="/community"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Community</span>
        </NavLink>
      </motion.div>

      {/* Tech Community Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-200/50 dark:border-[#333]/50 overflow-hidden mb-6 bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm"
      >
        <div 
          className="relative pb-16"
          style={{ 
            background: `linear-gradient(135deg, ${techColor.bg} 0%, ${techColor.bg}cc 50%, ${techColor.bg}99 100%)` 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
          <div className="h-24" />
          {/* Content positioned at bottom of gradient */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
            <div className="flex items-end justify-between">
              <div className="flex items-end gap-4">
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center border-4 border-white/20 shadow-lg bg-white relative z-10"
                >
                  {getTechIconUrl(decodedTech) ? (
                    <img 
                      src={getTechIconUrl(decodedTech)!} 
                      alt={decodedTech}
                      className="w-12 h-12"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                        const parent = (e.target as HTMLImageElement).parentElement
                        if (parent) {
                          parent.innerHTML = `<span style="color: white; font-weight: bold; font-size: 28px;">${decodedTech.charAt(0).toUpperCase()}</span>`
                        }
                      }}
                    />
                  ) : (
                    <span 
                      className="text-3xl font-bold"
                      style={{ color: techColor.text }}
                    >
                      {decodedTech.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="pb-1">
                  <h1 className="text-2xl font-bold text-white drop-shadow-sm">{decodedTech}</h1>
                  <p className="text-white/80 text-sm flex items-center gap-4 mt-1">
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all mb-1 ${
                  isPinned
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30'
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
        </div>
      </motion.div>

      {/* Community Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-4 gap-4 mb-6"
      >
        <div className="bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-[#333]/50 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{posts.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
            <FileCode size={14} /> Stacks
          </div>
        </div>
        <div className="bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-[#333]/50 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalViews.toLocaleString()}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
            <Eye size={14} /> Views
          </div>
        </div>
        <div className="bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-[#333]/50 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalLikes}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
            <Heart size={14} /> Likes
          </div>
        </div>
        <div className="bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-[#333]/50 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{new Set(posts.map(p => p.author.id)).size}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp size={20} />
            Latest Stacks
          </h2>
          <NavLink
            to="/create-post"
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Share a Stack
          </NavLink>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#333]/50 p-8 text-center">
            <FileCode size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No stacks using {decodedTech} yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Be the first to share your {decodedTech} project!</p>
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
                className="bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#333]/50 overflow-hidden hover:shadow-lg transition-all"
              >
                {post.coverImage && (
                  <NavLink to={`/post/${post.id}`}>
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                        decoding="async"
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
                        loading="lazy"
                        decoding="async"
                      />
                    </NavLink>
                    <NavLink 
                      to={`/profile/${post.author.id}`}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      {post.author.username}
                    </NavLink>
                    <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(post.createdAt)}</span>
                  </div>
                  <NavLink to={`/post/${post.id}`}>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 mb-2 line-clamp-1">
                      {post.title}
                    </h3>
                  </NavLink>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{post.excerpt}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.technologies.slice(0, 4).map((tech) => (
                      <NavLink key={tech} to={`/tech/${encodeURIComponent(tech)}`}>
                        <TechTag tech={tech} size="sm" />
                      </NavLink>
                    ))}
                    {post.technologies.length > 4 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 self-center">+{post.technologies.length - 4}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
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

      {/* Snippets Section */}
      {snippets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Code2 size={20} />
              {decodedTech} Snippets
            </h2>
            <NavLink
              to="/create-snippet"
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
            >
              Share Snippet
            </NavLink>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {snippets.slice(0, 4).map((snippet) => (
              <SnippetCard 
                key={snippet.id} 
                snippet={snippet}
                onUpdate={(updated) => {
                  setSnippets(prev => prev.map(s => s.id === updated.id ? updated : s))
                }}
                compact
              />
            ))}
          </div>
          {snippets.length > 4 && (
            <div className="mt-4 text-center">
              <NavLink to={`/community?tab=snippets&tech=${encodeURIComponent(decodedTech)}`} className="text-sm text-blue-600 hover:underline">
                View all {snippets.length} snippets →
              </NavLink>
            </div>
          )}
        </motion.div>
      )}

      {/* Discussions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquare size={20} />
            Discussions about {decodedTech}
          </h2>
          <NavLink
            to="/create-discussion"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
          >
            Start Discussion
          </NavLink>
        </div>

        {discussions.length === 0 ? (
          <div className="bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#333]/50 p-6 text-center">
            <MessageSquare size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No discussions about {decodedTech} yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Start a conversation about this technology!</p>
          </div>
        ) : (
          <div className="bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#333]/50 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-[#333]">
              {discussions.slice(0, 5).map((discussion, index) => {
                const catStyle = categoryStyles[discussion.category] || categoryStyles.general
                const CatIcon = catStyle.icon
                return (
                  <motion.div
                    key={discussion.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-4 p-4 hover:bg-gray-50/50 dark:hover:bg-[#252525]/50 transition-colors"
                  >
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${catStyle.bg} ${catStyle.text}`}>
                      <CatIcon size={10} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {discussion.resolved && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-[10px] font-semibold">
                            <CheckCircle size={10} /> Resolved
                          </span>
                        )}
                        <NavLink to={`/discussion/${discussion.id}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1">
                          {discussion.title}
                        </NavLink>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <NavLink to={`/profile/${discussion.author.id}`} className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-gray-100">
                          <img src={discussion.author.avatar} alt="" className="w-4 h-4 rounded-full" loading="lazy" decoding="async" />
                          <span>{discussion.author.username}</span>
                        </NavLink>
                        <span>{timeAgo(discussion.createdAt)}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={12} /> {discussion.replies}</span>
                        <span className="flex items-center gap-1"><Eye size={12} /> {discussion.viewCount}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            {discussions.length > 5 && (
              <div className="px-4 py-3 bg-gray-50/50 dark:bg-[#252525]/50 border-t border-gray-100 dark:border-[#333] text-center">
                <NavLink to={`/community?tab=discussions&tech=${encodeURIComponent(decodedTech)}`} className="text-sm text-blue-600 hover:underline">
                  View all {discussions.length} discussions →
                </NavLink>
              </div>
            )}
          </div>
        )}
      </motion.div>
      </div>
    </div>
  )
}

export default Tech
