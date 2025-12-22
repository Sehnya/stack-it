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
  GitBranch,
  Terminal,
  Code2,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, Post, UserStats } from '../lib/api'
import { TechTag } from '../components/TechTag'

// Dev-focused post card
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
      {/* Preview Image */}
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
        {/* Author & Meta */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={post.author.avatar}
            alt={post.author.username}
            className="w-9 h-9 rounded-full ring-2 ring-gray-100"
          />
          <div className="flex-1">
            <span className="font-medium text-gray-900 text-sm">{post.author.username}</span>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{timeAgo()}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Code2 size={12} /> {post.files?.length || 0} files
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <NavLink to={`/post/${post.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-gray-700 mb-2 line-clamp-2 transition-colors">
            {post.title}
          </h3>
        </NavLink>

        {/* Excerpt */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{post.excerpt}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.technologies.slice(0, 4).map((tech) => (
            <TechTag key={tech} tech={tech} size="sm" />
          ))}
          {post.technologies.length > 4 && (
            <span className="text-xs text-gray-400 self-center">+{post.technologies.length - 4}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                liked 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
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
              <span>{Math.floor(Math.random() * 30) + 5}</span>
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

// Right sidebar - dev focused
const RightSidebar = ({ user, stats }: { user: { username?: string } | null; stats: UserStats }) => {
  const topDevs = [
    { name: 'Alex Chen', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', stacks: 24, rank: 1 },
    { name: 'Sarah M.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', stacks: 19, rank: 2 },
    { name: 'Mike J.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', stacks: 15, rank: 3 },
    { name: 'Emma W.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', stacks: 12, rank: 4 },
    { name: 'Jordan', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', stacks: 9, rank: 5 },
  ]

  const hotTopics = [
    { name: 'React 19 Features', posts: 234, hot: true },
    { name: 'Bun Runtime', posts: 189, hot: true },
    { name: 'TypeScript Tips', posts: 156, hot: false },
    { name: 'AI Dev Tools', posts: 142, hot: true },
    { name: 'Rust for Web', posts: 98, hot: false },
  ]

  const techChannels = [
    { name: 'Frontend', icon: '🎨', members: '12.4k', following: true },
    { name: 'Backend', icon: '⚙️', members: '8.9k', following: true },
    { name: 'DevOps', icon: '🚀', members: '5.2k', following: false },
    { name: 'Mobile', icon: '📱', members: '4.1k', following: false },
  ]

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
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4"
        >
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Zap size={16} className="text-yellow-500" /> Hot Topics
          </h3>
          <div className="space-y-1">
            {hotTopics.map((topic, i) => (
              <div key={topic.name} className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-400 bg-gray-100 rounded-lg">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{topic.name}</span>
                  {topic.hot && <Zap size={12} className="text-yellow-500" />}
                </div>
                <span className="text-xs text-gray-500">{topic.posts}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Developers */}
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
            {topDevs.map((dev) => (
              <div key={dev.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
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
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tech Channels */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4"
        >
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <GitBranch size={16} className="text-gray-600" /> Channels
          </h3>
          <div className="space-y-2">
            {techChannels.map((channel) => (
              <div key={channel.name} className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{channel.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{channel.name}</div>
                    <div className="text-xs text-gray-500">{channel.members} devs</div>
                  </div>
                </div>
                <button className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  channel.following
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}>
                  {channel.following ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

const Community = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'top'>('trending')
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<UserStats>({ posts: 0, likes: 0, views: 0, followers: 0, following: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const sort = activeTab === 'latest' ? 'latest' : 'popular'
      const { data: postsData } = await api.posts.getAll(sort, 20)
      if (postsData) {
        setPosts(postsData)
      }

      // Fetch user stats
      const { data: statsData } = await api.posts.getStats()
      if (statsData) {
        setStats(statsData)
      }
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
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Community Feed</h1>
          <p className="text-gray-500 text-sm">Discover stacks shared by developers worldwide</p>
        </motion.div>

        {/* Sort Tabs */}
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

        {/* Posts Grid */}
        <div className="grid grid-cols-2 gap-5">
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50">
            <Terminal size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No stacks yet. Be the first to share!</p>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <RightSidebar user={user} stats={stats} />
    </div>
  )
}

export default Community
