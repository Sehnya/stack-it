import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, Eye, Clock, Search, Plus, ChevronUp, Zap, Trophy, TrendingUp, 
  Bookmark, Settings, HelpCircle, Sparkles, CheckCircle, MessageCircle, Layers, Code2, Star
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { api, Post, TopUser, TrendingTech, Discussion, Snippet } from '../lib/api'
import { getTechIconUrl, getTechColor } from '../components/TechTag'
import { SnippetCard } from '../components/SnippetCard'
import { useAuth } from '../context/AuthContext'

const categoryStyles: Record<string, { bg: string; text: string; icon: typeof HelpCircle }> = {
  help: { bg: 'bg-blue-100', text: 'text-blue-700', icon: HelpCircle },
  showcase: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Sparkles },
  feedback: { bg: 'bg-amber-100', text: 'text-amber-700', icon: MessageCircle },
  general: { bg: 'bg-gray-100', text: 'text-gray-700', icon: MessageSquare },
}

const Community = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'stacks' | 'snippets' | 'discussions'>('stacks')
  const [posts, setPosts] = useState<Post[]>([])
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [trendingTech, setTrendingTech] = useState<TrendingTech[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'latest' | 'popular'>('latest')
  const [snippetSort, setSnippetSort] = useState<'latest' | 'popular' | 'top-rated'>('top-rated')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [postsRes, snippetsRes, discussionsRes, usersRes, techRes] = await Promise.all([
        api.posts.getAll(sort, 50),
        api.snippets.getAll(snippetSort, 50),
        api.discussions.getAll(sort, 50),
        api.posts.getTopUsers(),
        api.posts.getTrendingTech(),
      ])
      if (postsRes.data) setPosts(postsRes.data)
      if (snippetsRes.data) setSnippets(snippetsRes.data)
      if (discussionsRes.data) setDiscussions(discussionsRes.data)
      if (usersRes.data) setTopUsers(usersRes.data)
      if (techRes.data) setTrendingTech(techRes.data)
      setLoading(false)
    }
    fetchData()
  }, [sort, snippetSort])

  const filteredPosts = posts.filter(p => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return p.title.toLowerCase().includes(q) || 
           p.author.username.toLowerCase().includes(q) ||
           p.technologies.some(t => t.toLowerCase().includes(q))
  })

  const filteredSnippets = snippets.filter(s => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return s.title.toLowerCase().includes(q) || 
           s.author.username.toLowerCase().includes(q) ||
           s.language.toLowerCase().includes(q) ||
           s.tags.some(t => t.toLowerCase().includes(q))
  })

  const filteredDiscussions = discussions.filter(d => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return d.title.toLowerCase().includes(q) || 
           d.author.username.toLowerCase().includes(q) ||
           d.tags.some(t => t.toLowerCase().includes(q))
  })

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-gray-200 dark:border-[#333] border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      {/* Left Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-4 space-y-4">
          {/* User Profile Card */}
          {user && (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] p-4">
              <NavLink to={`/profile/${user.id}`} className="flex items-center gap-3 mb-3 hover:opacity-80">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-[#252525] flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-lg">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{user.username}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">@{user.username?.toLowerCase()}</div>
                </div>
              </NavLink>
              <div className="flex gap-2">
                <NavLink to="/favorites" className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#252525] rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                  <Bookmark size={12} /> Saved
                </NavLink>
                <NavLink to="/settings" className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#252525] rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                  <Settings size={12} /> Settings
                </NavLink>
              </div>
            </div>
          )}

          {/* Trending Tech */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-emerald-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Trending Tech</span>
            </div>
            <div className="space-y-1">
              {trendingTech.slice(0, 6).map((tech, i) => {
                const icon = getTechIconUrl(tech.name)
                const colors = getTechColor(tech.name)
                return (
                  <NavLink
                    key={tech.name}
                    to={`/tech/${encodeURIComponent(tech.name)}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="w-5 text-xs font-medium text-gray-400">{i + 1}</span>
                    {icon ? (
                      <img src={icon} alt="" className="w-4 h-4" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center" style={{ background: colors.bg, color: colors.text }}>
                        {tech.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{tech.name}</span>
                    <span className="text-xs text-gray-400">{tech.posts}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Community</h1>
            {/* Tab Switcher */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg">
              <button
                onClick={() => setActiveTab('stacks')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition ${
                  activeTab === 'stacks' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Layers size={14} /> Stacks
              </button>
              <button
                onClick={() => setActiveTab('snippets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition ${
                  activeTab === 'snippets' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Code2 size={14} /> Snippets
              </button>
              <button
                onClick={() => setActiveTab('discussions')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition ${
                  activeTab === 'discussions' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <MessageSquare size={14} /> Discussions
              </button>
            </div>
          </div>
          <NavLink
            to={activeTab === 'stacks' ? '/create-post' : activeTab === 'snippets' ? '/create-snippet' : '/create-discussion'}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            <Plus size={16} /> {activeTab === 'stacks' ? 'New Stack' : activeTab === 'snippets' ? 'New Snippet' : 'New Thread'}
          </NavLink>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={activeTab === 'stacks' ? 'Search stacks...' : activeTab === 'snippets' ? 'Search snippets...' : 'Search discussions...'}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-gray-300 dark:focus:border-gray-600"
            />
          </div>
          {activeTab === 'snippets' ? (
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg">
              <button
                onClick={() => setSnippetSort('top-rated')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${snippetSort === 'top-rated' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <Star size={14} className="inline mr-1.5" />Top Rated
              </button>
              <button
                onClick={() => setSnippetSort('latest')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${snippetSort === 'latest' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <Clock size={14} className="inline mr-1.5" />Latest
              </button>
              <button
                onClick={() => setSnippetSort('popular')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${snippetSort === 'popular' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <Eye size={14} className="inline mr-1.5" />Popular
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg">
              <button
                onClick={() => setSort('latest')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${sort === 'latest' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <Clock size={14} className="inline mr-1.5" />Latest
              </button>
              <button
                onClick={() => setSort('popular')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${sort === 'popular' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <ChevronUp size={14} className="inline mr-1.5" />Popular
              </button>
            </div>
          )}
        </div>

        {/* Stacks Tab */}
        {activeTab === 'stacks' && (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-[#333] flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span className="w-12 text-center">Votes</span>
              <span className="flex-1">Stack</span>
              <span className="w-16 text-center hidden sm:block">Files</span>
              <span className="w-20 text-center hidden md:block">Views</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredPosts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">No stacks found</div>
              ) : (
                filteredPosts.map((post, i) => (
                  <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-12 flex flex-col items-center gap-1 pt-1 flex-shrink-0">
                      <button onClick={() => api.posts.like(post.id)} className="p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded transition-colors">
                        <ChevronUp size={18} />
                      </button>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{post.favorites}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <NavLink to={`/post/${post.id}`} className="block group">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">{post.title}</h3>
                      </NavLink>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{post.excerpt}</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {post.technologies.slice(0, 4).map(tech => {
                          const icon = getTechIconUrl(tech)
                          const colors = getTechColor(tech)
                          return (
                            <NavLink key={tech} to={`/tech/${encodeURIComponent(tech)}`} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-80" style={{ background: colors.bg + '20', color: colors.bg }}>
                              {icon && <img src={icon} alt="" className="w-3 h-3" loading="lazy" decoding="async" />}
                              {tech}
                            </NavLink>
                          )
                        })}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <NavLink to={`/profile/${post.author.id}`} className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-gray-100">
                          <img src={post.author.avatar} alt="" className="w-5 h-5 rounded-full" loading="lazy" decoding="async" />
                          <span className="font-medium">{post.author.username}</span>
                        </NavLink>
                        <span>·</span>
                        <span>{timeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                    <div className="w-16 text-center hidden sm:block flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{post.files?.length || 0}</span>
                      <div className="text-[10px] text-gray-400">files</div>
                    </div>
                    <div className="w-20 text-center hidden md:block flex-shrink-0">
                      <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-300 text-sm">
                        <Eye size={14} /><span>{post.viewCount}</span>
                      </div>
                    </div>
                    {post.coverImage && (
                      <NavLink to={`/post/${post.id}`} className="hidden lg:block w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={post.coverImage} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      </NavLink>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Snippets Tab */}
        {activeTab === 'snippets' && (
          <div>
            {filteredSnippets.length === 0 ? (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] p-8 text-center">
                <Code2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No snippets yet</p>
                <NavLink to="/create-snippet" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200">
                  <Plus size={16} /> Share a Snippet
                </NavLink>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSnippets.map((snippet) => (
                  <SnippetCard 
                    key={snippet.id} 
                    snippet={snippet}
                    onUpdate={(updated) => {
                      setSnippets(prev => prev.map(s => s.id === updated.id ? updated : s))
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-[#333] flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span className="w-16">Category</span>
              <span className="flex-1">Discussion</span>
              <span className="w-16 text-center hidden sm:block">Replies</span>
              <span className="w-16 text-center hidden md:block">Views</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredDiscussions.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p className="mb-4">No discussions yet</p>
                  <NavLink to="/create-discussion" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200">
                    <Plus size={16} /> Start a Discussion
                  </NavLink>
                </div>
              ) : (
                filteredDiscussions.map((discussion, i) => {
                  const catStyle = categoryStyles[discussion.category] || categoryStyles.general
                  const CatIcon = catStyle.icon
                  return (
                    <motion.div key={discussion.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {/* Category Badge */}
                      <div className={`w-16 flex-shrink-0 flex items-center justify-center`}>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${catStyle.bg} ${catStyle.text}`}>
                          <CatIcon size={10} />
                          {discussion.category}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {discussion.resolved && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-[10px] font-semibold">
                              <CheckCircle size={10} /> Resolved
                            </span>
                          )}
                          <NavLink to={`/discussion/${discussion.id}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1">
                            {discussion.title}
                          </NavLink>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2" dangerouslySetInnerHTML={{ __html: discussion.content.replace(/<[^>]*>/g, '').slice(0, 150) }} />

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {discussion.tags.map(tag => {
                            const icon = getTechIconUrl(tag)
                            return (
                              <NavLink key={tag} to={`/tech/${encodeURIComponent(tag)}`} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-80 bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-300">
                                {icon && <img src={icon} alt="" className="w-3 h-3" loading="lazy" decoding="async" />}
                                #{tag}
                              </NavLink>
                            )
                          })}
                        </div>

                        {/* Author */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <NavLink to={`/profile/${discussion.author.id}`} className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-gray-100">
                            <img src={discussion.author.avatar} alt="" className="w-5 h-5 rounded-full" loading="lazy" decoding="async" />
                            <span className="font-medium">{discussion.author.username}</span>
                          </NavLink>
                          <span>·</span>
                          <span>{timeAgo(discussion.createdAt)}</span>
                        </div>
                      </div>

                      {/* Replies */}
                      <div className="w-16 text-center hidden sm:flex flex-col items-center flex-shrink-0">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                          <MessageSquare size={14} />
                          <span className="font-semibold">{discussion.replies}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">replies</span>
                      </div>

                      {/* Views */}
                      <div className="w-16 text-center hidden md:flex flex-col items-center flex-shrink-0">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                          <Eye size={14} />
                          <span>{discussion.viewCount}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">views</span>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="hidden xl:block w-64 flex-shrink-0">
        <div className="sticky top-4 space-y-4">
          {/* Top Stackers */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={14} className="text-amber-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Top Stackers</span>
            </div>
            <div className="space-y-2">
              {topUsers.slice(0, 5).map((u) => (
                <NavLink key={u.id} to={`/profile/${u.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="relative">
                    <img src={u.avatar} alt="" className="w-8 h-8 rounded-full" loading="lazy" decoding="async" />
                    {u.rank <= 3 && (
                      <span className={`absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center ${
                        u.rank === 1 ? 'bg-amber-400 text-amber-900' : u.rank === 2 ? 'bg-gray-300 text-gray-700' : 'bg-orange-300 text-orange-800'
                      }`}>{u.rank}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{u.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{u.stacks} stacks</div>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Community Stats */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-amber-400" />
              <span className="text-sm font-semibold">Community Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-2xl font-bold">{posts.length}</div>
                <div className="text-xs text-gray-400">Stacks</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{snippets.length}</div>
                <div className="text-xs text-gray-400">Snippets</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{discussions.length}</div>
                <div className="text-xs text-gray-400">Discussions</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{topUsers.length}</div>
                <div className="text-xs text-gray-400">Builders</div>
              </div>
            </div>
          </div>

          {/* Discussion Categories */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] p-4">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Discussion Categories</div>
            <div className="space-y-2">
              {Object.entries(categoryStyles).map(([key, style]) => {
                const Icon = style.icon
                return (
                  <button key={key} className={`w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}>
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center ${style.bg}`}>
                      <Icon size={12} className={style.text} />
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{key}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Community
