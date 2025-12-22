import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Users,
  Zap,
  ArrowRight,
  Plus,
  ChevronLeft,
  ChevronRight,
  Bookmark,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import LetterGlitch from '../components/LetterGlitch'
import { useAuth } from '../context/AuthContext'

interface Post {
  id: number
  title: string
  author: string
  avatar: string
  favorites: number
  comments: number
  technologies: string[]
  excerpt: string
  image?: string
}

const topPosts: Post[] = [
  {
    id: 1,
    title: 'Building a Full-Stack App with Bun & Elysia',
    author: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    favorites: 234,
    comments: 45,
    technologies: ['Bun', 'Elysia', 'TypeScript'],
    excerpt: 'Learn how to build blazing fast APIs with the new JavaScript runtime and framework combo.',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
  },
  {
    id: 2,
    title: 'React 19 Features You Need to Know',
    author: 'Mike Johnson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    favorites: 189,
    comments: 32,
    technologies: ['React', 'Frontend'],
    excerpt: 'Explore the exciting new features coming in React 19 and how they will change your workflow.',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600',
  },
  {
    id: 3,
    title: 'Prisma vs Drizzle: Which ORM to Choose?',
    author: 'Emma Wilson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    favorites: 156,
    comments: 28,
    technologies: ['Prisma', 'Drizzle', 'Database'],
    excerpt: 'A comprehensive comparison of two popular TypeScript ORMs for your next project.',
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600',
  },
  {
    id: 4,
    title: 'Mastering Tailwind CSS in 2024',
    author: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    favorites: 203,
    comments: 41,
    technologies: ['CSS', 'Tailwind'],
    excerpt: 'Tips and tricks to level up your Tailwind CSS skills and build beautiful UIs faster.',
    image: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=600',
  },
]

const trendingPosts: Post[] = [
  {
    id: 5,
    title: 'Getting Started with Turso Database',
    author: 'Jordan Lee',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    favorites: 98,
    comments: 15,
    technologies: ['Turso', 'SQLite'],
    excerpt: 'Edge-ready SQLite for modern applications.',
  },
  {
    id: 6,
    title: 'The Art of Code Reviews',
    author: 'Taylor Swift',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    favorites: 145,
    comments: 23,
    technologies: ['Best Practices'],
    excerpt: 'How to give and receive feedback effectively.',
  },
  {
    id: 7,
    title: 'TypeScript 5.4 Deep Dive',
    author: 'Chris Park',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
    favorites: 167,
    comments: 29,
    technologies: ['TypeScript'],
    excerpt: 'New features and improvements in the latest release.',
  },
]

const PostCard = ({ post, index }: { post: Post; index: number }) => {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.favorites)

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">
        {post.title}
      </h3>

      <div className="flex items-center gap-2 mb-4">
        <img
          src={post.avatar}
          alt={post.author}
          className="w-6 h-6 rounded-full object-cover"
        />
        <span className="text-sm text-gray-600">{post.author}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {post.technologies.map((tech) => (
          <span
            key={tech}
            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
          >
            {tech}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
          className={`flex items-center gap-1 text-sm ${
            liked ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          <span>{likeCount}</span>
        </motion.button>
        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <MessageCircle size={16} />
          <span>{post.comments}</span>
        </button>
        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 ml-auto">
          <Share2 size={16} />
        </button>
      </div>
    </motion.div>
  )
}

const Dashboard = () => {
  const { user } = useAuth()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % topPosts.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isAutoPlaying])

  const nextSlide = () => {
    setIsAutoPlaying(false)
    setCurrentSlide((prev) => (prev + 1) % topPosts.length)
  }

  const prevSlide = () => {
    setIsAutoPlaying(false)
    setCurrentSlide((prev) => (prev - 1 + topPosts.length) % topPosts.length)
  }

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentSlide(index)
  }

  return (
    <div className="min-h-screen">
      {/* Welcome Header with LetterGlitch */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-48 rounded-3xl overflow-hidden mb-8"
      >
        <div className="absolute inset-0">
          <LetterGlitch
            glitchColors={['#ffffff', '#d1d5db', '#9ca3af', '#6b7280']}
            glitchSpeed={75}
            centerVignette={true}
            outerVignette={true}
            smooth={true}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center z-10">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-white mb-2 drop-shadow-lg"
            >
              Welcome back, {user?.username || 'Developer'}!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-gray-300 text-lg drop-shadow-md"
            >
              Ready to share your stack today?
            </motion.p>
          </div>
        </div>
      </motion.div>
      {/* Hero Section with Paginating Gallery */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-900 mb-2"
            >
              Top Posts of the Day
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <NavLink
              to="/create-post"
              className="flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus size={18} />
              Create Post
            </NavLink>
          </motion.div>
        </div>

        {/* Gallery - Full Image Card Style */}
        <div className="relative">
          <div className="overflow-hidden rounded-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.4 }}
                className="relative h-[420px] rounded-3xl overflow-hidden"
              >
                {/* Full Background Image */}
                <img
                  src={topPosts[currentSlide].image}
                  alt={topPosts[currentSlide].title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Gradient Overlay - transparent to dark gray */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/95" />
                
                {/* Bookmark Icon - Top Right */}
                <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Bookmark size={20} className="text-white" />
                </button>
                
                {/* Trending Badge - Top Left */}
                <div className="absolute top-4 left-4 flex items-center gap-1 bg-orange-500 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                  <TrendingUp size={12} />
                  <span>#{currentSlide + 1} Today</span>
                </div>

                {/* Content Overlay - Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {/* Title and Favorites */}
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-2xl font-bold text-white flex-1 pr-4">
                      {topPosts[currentSlide].title}
                    </h2>
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <Heart size={14} className="text-white" />
                      <span className="text-white text-sm font-medium">
                        {topPosts[currentSlide].favorites}
                      </span>
                    </div>
                  </div>
                  
                  {/* Excerpt */}
                  <p className="text-gray-200 mb-4 line-clamp-2">
                    {topPosts[currentSlide].excerpt}
                  </p>
                  
                  {/* Technologies */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {topPosts[currentSlide].technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  
                  {/* View Post Button */}
                  <NavLink
                    to={`/post/${topPosts[currentSlide].id}`}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-800/80 backdrop-blur-sm text-white rounded-2xl font-medium hover:bg-gray-700/80 transition-colors"
                  >
                    View Post
                  </NavLink>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronRight size={20} className="text-white" />
          </button>

          {/* Pagination Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {topPosts.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-6 bg-gray-900'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Trending Posts Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              More Trending
            </h2>
          </div>
          <NavLink
            to="/community"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            View all
            <ArrowRight size={16} />
          </NavLink>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingPosts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>
      </div>

      {/* Community CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Join the Community Discussion
            </h2>
            <p className="text-gray-300 max-w-md">
              Share your projects, ask questions, and help others grow. Your
              contribution matters!
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <NavLink
              to="/community"
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              <Users size={18} />
              Explore Community
            </NavLink>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
            <Zap size={24} className="text-gray-700" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Quick Post</h3>
          <p className="text-sm text-gray-500">
            Share a quick thought or code snippet with the community
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
            <Heart size={24} className="text-gray-700" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Your Favorites</h3>
          <p className="text-sm text-gray-500">
            Access your saved posts and bookmarked content
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard
