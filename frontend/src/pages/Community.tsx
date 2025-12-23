import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
  MoreHorizontal,
  TrendingUp,
  Clock,
  Zap,
  Award,
  Terminal,
  Code2,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, Post, UserStats, TopUser, TrendingTech } from '../lib/api'
import { TechTag } from '../components/TechTag'

const PostCard = ({ post, index }: { post: Post; index: number }) => {
  const [likes, setLikes] = useState(post.favorites)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleLike = () => {
    setLiked(!liked)
    setLikes(liked ? likes - 1 : likes + 1)
  }

  const timeAgo = () => {
    const diff = Date.now() - new Date(post.createdAt).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:border-gray-300 hover:shadow-lg transition-all overflow-hidden"
    >
      {post.coverImage && (
        <NavLink to={`/post/${post.id}`}>
          <div className="relative h-48 overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {index < 3 && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500 rounded-full">
                <Zap size={12} className="text-white" />
                <span className="text-xs font-semibold text-white">Trending</span>
              </div>
            )}
          </div>
        </NavLink>
      )}

      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <NavLink to={`/profile/${post.author.id}`}>
            <img
              src={post.author.avatar}
              alt={post.author.username}
              className="w-9 h-9 rounded-full ring-2 ring-gray-100 hover:ring-gray-300 transition-all"
            />
          </NavLink>
          <div className="flex-1">
            <NavLink 
              to={`/profile/${post.author.id}`}
              className="font-medium text-gray-900 text-sm hover:text-gray-700 transition-colors"
            >
              {post.author.username}
            </NavLink>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{timeAgo()}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Code2 size={12} /> {post.files?.length || 0} files
              </span>
            </div>
          </div>
        </div>

        <NavLink to={`/post/${post.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-gray-700 mb-2 line-clamp-2 transition-colors">
            {post.title}
          </h3>
        </NavLink>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{post.excerpt}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.technologies.slice(0, 4).map((tech) => (
            <NavLink key={tech} to={`/tech/${encodeURIComponent(tech)}`}>
              <TechTag tech={tech} size="sm" />
            </NavLink>
          ))}
          {post.technologies.length > 4 && (
            <span className="text-xs text-gray-400 self-center">+{post.technologies.length - 4}</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                liked ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ThumbsUp size={16} fill={liked ? 'currentColor' : 'none'} />
              <span>{likes}</span>
            </button>
            <NavLink
              to={`/post/${post.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <MessageSquare size={16} />
              <span>{post.comments || 0}</span>
            </NavLink>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <Share2 size={16} />
            </button>
            <button
              onClick={() => setSaved(!saved)}
              className={`p-2 rounded-lg transition-colors ${
                saved ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}


interface RightSidebarProps {
  user: { username?: string } | null
  stats: UserStats
  topUsers: TopUser[]
  trendingTech: TrendingTech[]
}

const RightSidebar = ({ user, stats, topUsers, trendingTech }: RightSidebarProps) => {
  return (
    <div className="w-80 shrink-0">
      <div className="sticky top-4 space-y-4">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden"
        >
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-white text-xl font-bold border border-white/20">
                {user?.username?.charAt(0).toUpperCase() || 'D'}
              </div>
              <div>
                <h3 className="font-semibold text-white">{user?.username || 'Developer'}</h3>
                <p className="text-sm text-gray-400">@{user?.username?.toLowerCase() || 'dev'}</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 bg-gray-50 rounded-xl">
                <div className="text-lg font-bold text-gray-900">{stats.posts}</div>
                <div className="text-xs text-gray-500">Stacks</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-xl">
                <div className="text-lg font-bold text-gray-900">{stats.likes.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Likes</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-xl">
                <div className="text-lg font-bold text-gray-900">{stats.following}</div>
                <div className="text-xs text-gray-500">Following</div>
              </div>
            </div>
            <NavLink
              to="/create-post"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Terminal size={16} />
              Share Stack
            </NavLink>
          </div>
        </motion.div>

        {/* Hot Topics */}
        {trendingTech.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4"
          >
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Zap size={16} className="text-yellow-500" /> Trending Tech
            </h3>
            <div className="space-y-1">
              {trendingTech.map((topic, i) => (
                <NavLink 
                  key={topic.name} 
                  to={`/tech/${encodeURIComponent(topic.name)}`}
                  className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-400 bg-gray-100 rounded-lg">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{topic.name}</span>
                    {topic.hot && <Zap size={12} className="text-yellow-500" />}
                  </div>
                  <span className="text-xs text-gray-500">{topic.posts} posts</span>
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top Developers */}
        {topUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4"
          >
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Award size={16} className="text-orange-500" /> Top Stackers
            </h3>
            <div className="space-y-1">
              {topUsers.map((dev) => (
                <NavLink 
                  key={dev.id} 
                  to={`/profile/${dev.id}`}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-lg ${
                      dev.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      dev.rank === 2 ? 'bg-gray-200 text-gray-600' :
                      dev.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {dev.rank}
                    </span>
                    <img src={dev.avatar} alt={dev.name} className="w-8 h-8 rounded-full" />
                    <span className="text-sm font-medium text-gray-700">{dev.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{dev.stacks} stacks</span>
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state when no data */}
        {topUsers.length === 0 && trendingTech.length === 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 text-center"
          >
            <Terminal size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Be the first to share a stack!</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}


const Community = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'top'>('trending')
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<UserStats>({ posts: 0, likes: 0, views: 0, followers: 0, following: 0 })
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [trendingTech, setTrendingTech] = useState<TrendingTech[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const sort = activeTab === 'latest' ? 'latest' : 'popular'
      const [postsRes, statsRes, topUsersRes, trendingRes] = await Promise.all([
        api.posts.getAll(sort, 20),
        api.posts.getStats(),
        api.posts.getTopUsers(),
        api.posts.getTrendingTech(),
      ])

      if (postsRes.data) setPosts(postsRes.data)
      if (statsRes.data) setStats(statsRes.data)
      if (topUsersRes.data) setTopUsers(topUsersRes.data)
      if (trendingRes.data) setTrendingTech(trendingRes.data)

      setLoading(false)
    }
    fetchData()
  }, [activeTab])

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading community feed...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex gap-6">
      <div className="flex-1 min-w-0">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Community Feed</h1>
          <p className="text-gray-500 text-sm">Discover stacks shared by developers worldwide</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-1.5 mb-5 flex items-center gap-1 w-fit"
        >
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'trending' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Zap size={16} /> Trending
          </button>
          <button
            onClick={() => setActiveTab('latest')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'latest' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock size={16} /> Latest
          </button>
          <button
            onClick={() => setActiveTab('top')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'top' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TrendingUp size={16} /> Top
          </button>
        </motion.div>

        <div className="grid grid-cols-2 gap-5">
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50">
            <Terminal size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No stacks yet. Be the first to share!</p>
            <NavLink
              to="/create-post"
              className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Terminal size={16} />
              Share Your Stack
            </NavLink>
          </div>
        )}
      </div>

      <RightSidebar user={user} stats={stats} topUsers={topUsers} trendingTech={trendingTech} />
    </div>
  )
}

export default Community
