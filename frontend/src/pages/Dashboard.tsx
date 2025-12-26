import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Heart,
  Bookmark,
  Eye,
  Clock,
  Zap,
  ChevronRight,
  Sparkles,
  Star,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TechTag } from '../components/TechTag'
import { api, Post } from '../lib/api'

// Hero card - large featured post
const HeroCard = ({ post }: { post: Post }) => {
  const [liked, setLiked] = useState(false)

  return (
    <NavLink to={`/post/${post.id}`} className="block">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.01 }}
        className="relative h-[400px] rounded-3xl overflow-hidden group cursor-pointer"
      >
        <img
          src={post.coverImage}
          alt={post.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Featured Badge */}
        <div className="absolute top-6 left-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <Sparkles size={14} className="text-yellow-400" />
            <span className="text-white text-sm font-medium">Featured</span>
          </div>
        </div>

        {/* Actions */}
        <div className="absolute top-6 right-6 flex gap-2">
          <button
            onClick={(e) => { e.preventDefault(); setLiked(!liked) }}
            className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20"
          >
            <Heart size={18} className={liked ? 'text-red-500 fill-red-500' : 'text-white'} />
          </button>
          <button className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20">
            <Bookmark size={18} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.technologies.slice(0, 3).map((tech) => (
              <TechTag key={tech} tech={tech} size="sm" />
            ))}
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 line-clamp-2">{post.title}</h2>
          <p className="text-gray-300 text-sm mb-4 line-clamp-2 max-w-2xl">{post.excerpt}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={post.author.avatar} alt={post.author.username} className="w-8 h-8 rounded-full" />
              <span className="text-white text-sm font-medium">{post.author.username}</span>
            </div>
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <span className="flex items-center gap-1"><Heart size={14} /> {post.favorites}</span>
              <span className="flex items-center gap-1"><Eye size={14} /> {post.viewCount}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </NavLink>
  )
}

// Compact post card
const CompactCard = ({ post, index }: { post: Post; index: number }) => {
  return (
    <NavLink to={`/post/${post.id}`}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ x: 4 }}
        className="flex gap-4 p-3 rounded-xl hover:bg-white/60 transition-all cursor-pointer group"
      >
        <img
          src={post.coverImage}
          alt={post.title}
          loading="lazy"
          decoding="async"
          className="w-20 h-20 rounded-xl object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-gray-700 mb-1">
            {post.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{post.author.username}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Heart size={12} /> {post.favorites}</span>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-400 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
    </NavLink>
  )
}

// Grid post card
const GridCard = ({ post, index }: { post: Post; index: number }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <NavLink to={`/post/${post.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative rounded-2xl overflow-hidden cursor-pointer group"
      >
        <div className="aspect-[4/3] relative">
          <img
            src={post.coverImage}
            alt={post.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Hover overlay */}
          <motion.div
            initial={false}
            animate={{ opacity: hovered ? 1 : 0 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center"
          >
            <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-900">
              View Post
            </span>
          </motion.div>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex gap-1.5 mb-2">
            {post.technologies.slice(0, 2).map((tech) => (
              <span key={tech} className="text-[10px] px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white">
                {tech}
              </span>
            ))}
          </div>
          <h3 className="font-semibold text-white text-sm line-clamp-2 mb-2">{post.title}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={post.author.avatar} alt="" loading="lazy" className="w-5 h-5 rounded-full" />
              <span className="text-xs text-gray-300">{post.author.username}</span>
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Heart size={12} /> {post.favorites}
            </span>
          </div>
        </div>
      </motion.div>
    </NavLink>
  )
}

const Dashboard = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      // Fetch posts
      const { data: postsData } = await api.posts.getAll('latest', 10)
      if (postsData) {
        setPosts(postsData)
      }
      
      setLoading(false)
    }
    fetchData()
  }, [])

  const featuredPost = posts[0]
  const trendingPosts = posts.slice(1, 4)
  const recentPosts = posts.slice(0, 6)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Welcome back, {user?.username || 'Developer'}
          </h1>
          <p className="text-gray-500">Here's what's happening in your dev world</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-gray-500">Today</div>
            <div className="font-semibold text-gray-900">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Featured + Grid */}
        <div className="col-span-2 space-y-6">
          {/* Featured Post */}
          {featuredPost && <HeroCard post={featuredPost} />}

          {/* Recent Posts Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock size={20} /> Recent Posts
              </h2>
              <NavLink to="/community" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
                View all <ChevronRight size={16} />
              </NavLink>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {recentPosts.map((post, index) => (
                <GridCard key={post.id} post={post} index={index} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Trending Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/40"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Zap size={18} className="text-yellow-500" /> Trending
              </h3>
              <span className="text-xs text-gray-500">This week</span>
            </div>
            <div className="space-y-1">
              {trendingPosts.map((post, index) => (
                <CompactCard key={post.id} post={post} index={index} />
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold">Share Your Stack</h3>
                <p className="text-sm text-gray-400">Create a new post</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Share your latest project, tech stack, or coding insights with the community.
            </p>
            <NavLink
              to="/create-post"
              className="block w-full py-3 bg-white text-gray-900 rounded-xl font-medium text-center hover:bg-gray-100 transition-colors"
            >
              Create Post
            </NavLink>
          </motion.div>

          {/* Top Technologies */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/40"
          >
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Star size={18} className="text-orange-500" /> Popular Tech
            </h3>
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Node.js', 'Tailwind', 'Prisma', 'Bun'].map((tech) => (
                <TechTag key={tech} tech={tech} size="md" />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
