import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MessageCircle,
  Heart,
  Share2,
  TrendingUp,
  Clock,
  Hash,
  Users,
  Flame,
  ArrowUp,
  MoreHorizontal,
  Bookmark,
  Eye,
  Atom,
  FileCode,
  Box,
  Palette,
  Database,
} from 'lucide-react'

interface Thread {
  id: number
  title: string
  content: string
  author: {
    name: string
    avatar: string
  }
  likes: number
  comments: number
  views: number
  tags: string[]
  timeAgo: string
  isHot?: boolean
}

interface Technology {
  name: string
  icon: React.ReactNode
  posts: number
  trend: number
}

interface Activity {
  id: number
  user: {
    name: string
    avatar: string
  }
  action: string
  target: string
  timeAgo: string
}

interface Tag {
  name: string
  count: number
  trending: boolean
}

const threads: Thread[] = [
  {
    id: 1,
    title: 'What\'s your go-to state management solution in 2024?',
    content: 'I\'ve been using Redux for years but considering switching to Zustand or Jotai. What are your experiences with modern state management?',
    author: { name: 'Alex Chen', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' },
    likes: 89,
    comments: 47,
    views: 1240,
    tags: ['React', 'State Management'],
    timeAgo: '2h ago',
    isHot: true,
  },
  {
    id: 2,
    title: 'Bun vs Node.js - Real world performance comparison',
    content: 'I ran extensive benchmarks comparing Bun and Node.js in production scenarios. Here are my findings...',
    author: { name: 'Sarah Miller', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    likes: 156,
    comments: 63,
    views: 2890,
    tags: ['Bun', 'Node.js', 'Performance'],
    timeAgo: '4h ago',
    isHot: true,
  },
  {
    id: 3,
    title: 'How do you handle authentication in your projects?',
    content: 'Looking for best practices on implementing auth. JWT vs sessions? What about OAuth providers?',
    author: { name: 'Mike Johnson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    likes: 45,
    comments: 32,
    views: 890,
    tags: ['Authentication', 'Security'],
    timeAgo: '6h ago',
  },
  {
    id: 4,
    title: 'TypeScript 5.4 - Hidden gems you might have missed',
    content: 'The latest TypeScript release has some amazing features that didn\'t get much attention. Let me share...',
    author: { name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
    likes: 78,
    comments: 21,
    views: 1560,
    tags: ['TypeScript'],
    timeAgo: '8h ago',
  },
]

const technologies: Technology[] = [
  { name: 'React', icon: <Atom size={18} className="text-gray-600" />, posts: 1234, trend: 12 },
  { name: 'TypeScript', icon: <FileCode size={18} className="text-gray-600" />, posts: 987, trend: 8 },
  { name: 'Bun', icon: <Box size={18} className="text-gray-600" />, posts: 456, trend: 45 },
  { name: 'Tailwind', icon: <Palette size={18} className="text-gray-600" />, posts: 789, trend: 15 },
  { name: 'Prisma', icon: <Database size={18} className="text-gray-600" />, posts: 345, trend: 22 },
]

const activities: Activity[] = [
  { id: 1, user: { name: 'Jordan', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' }, action: 'commented on', target: 'Bun vs Node.js comparison', timeAgo: '2m ago' },
  { id: 2, user: { name: 'Taylor', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }, action: 'liked', target: 'State management discussion', timeAgo: '5m ago' },
  { id: 3, user: { name: 'Chris', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100' }, action: 'started a thread', target: 'Docker best practices', timeAgo: '12m ago' },
  { id: 4, user: { name: 'Morgan', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' }, action: 'replied to', target: 'Authentication thread', timeAgo: '18m ago' },
  { id: 5, user: { name: 'Casey', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100' }, action: 'shared', target: 'TypeScript 5.4 features', timeAgo: '25m ago' },
]

const trendingTags: Tag[] = [
  { name: 'react', count: 2341, trending: true },
  { name: 'typescript', count: 1892, trending: true },
  { name: 'bun', count: 1456, trending: true },
  { name: 'nextjs', count: 1234, trending: false },
  { name: 'tailwindcss', count: 1123, trending: true },
  { name: 'prisma', count: 987, trending: false },
  { name: 'elysia', count: 756, trending: true },
  { name: 'docker', count: 654, trending: false },
]

const ThreadCard = ({ thread, index }: { thread: Thread; index: number }) => {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(thread.likes)

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={thread.author.avatar}
            alt={thread.author.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="font-medium text-gray-900">{thread.author.name}</div>
            <div className="text-sm text-gray-500">{thread.timeAgo}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {thread.isHot && (
            <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
              <Flame size={12} />
              Hot
            </span>
          )}
          <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreHorizontal size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 text-lg mb-2">{thread.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{thread.content}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {thread.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm ${liked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>{likeCount}</span>
          </motion.button>
          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <MessageCircle size={18} />
            <span>{thread.comments}</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <Eye size={18} />
            <span>{thread.views}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); setSaved(!saved) }}
            className={`p-1.5 rounded-lg transition-colors ${saved ? 'text-gray-900 bg-gray-200' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
          </motion.button>
          <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const Community = () => {
  const [activeTab, setActiveTab] = useState<'latest' | 'popular' | 'following'>('latest')

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Users size={28} className="text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Community</h1>
        </div>
        <p className="text-gray-600">Join discussions, share knowledge, and connect with developers</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - Threads */}
        <div className="col-span-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
            {(['latest', 'popular', 'following'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Thread List */}
          <div className="space-y-4">
            {threads.map((thread, index) => (
              <ThreadCard key={thread.id} thread={thread} index={index} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Technologies */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-orange-500" />
              <h3 className="font-semibold text-gray-900">Hot Technologies</h3>
            </div>
            <div className="space-y-3">
              {technologies.map((tech, index) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      {tech.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{tech.name}</div>
                      <div className="text-xs text-gray-500">{tech.posts} posts</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-green-500 text-sm">
                    <ArrowUp size={14} />
                    <span>{tech.trend}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <img
                    src={activity.user.avatar}
                    alt={activity.user.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{activity.user.name}</span>
                      {' '}{activity.action}{' '}
                      <span className="text-gray-900 hover:underline cursor-pointer">{activity.target}</span>
                    </p>
                    <span className="text-xs text-gray-400">{activity.timeAgo}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trending Tags */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Hash size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-900">Trending Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag, index) => (
                <motion.span
                  key={tag.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.03 }}
                  whileHover={{ scale: 1.05 }}
                  className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${
                    tag.trending
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  #{tag.name}
                  {tag.trending && (
                    <TrendingUp size={12} className="inline ml-1" />
                  )}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Community
