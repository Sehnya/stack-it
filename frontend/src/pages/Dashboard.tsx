import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Users,
  Zap,
  ArrowRight,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface Post {
  id: number
  title: string
  author: string
  avatar: string
  likes: number
  comments: number
  tags: string[]
  excerpt: string
  image?: string
}

const topPosts: Post[] = [
  {
    id: 1,
    title: 'Building a Full-Stack App with Bun & Elysia',
    author: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    likes: 234,
    comments: 45,
    tags: ['Bun', 'Elysia', 'TypeScript'],
    excerpt: 'Learn how to build blazing fast APIs with the new JavaScript runtime and framework combo.',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
  },
  {
    id: 2,
    title: 'React 19 Features You Need to Know',
    author: 'Mike Johnson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    likes: 189,
    comments: 32,
    tags: ['React', 'Frontend'],
    excerpt: 'Explore the exciting new features coming in React 19 and how they will change your workflow.',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600',
  },
  {
    id: 3,
    title: 'Prisma vs Drizzle: Which ORM to Choose?',
    author: 'Emma Wilson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    likes: 156,
    comments: 28,
    tags: ['Database', 'ORM'],
    excerpt: 'A comprehensive comparison of two popular TypeScript ORMs for your next project.',
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600',
  },
  {
    id: 4,
    title: 'Mastering Tailwind CSS in 2024',
    author: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    likes: 203,
    comments: 41,
    tags: ['CSS', 'Tailwind'],
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
    likes: 98,
    comments: 15,
    tags: ['Database', 'SQLite'],
    excerpt: 'Edge-ready SQLite for modern applications.',
  },
  {
    id: 6,
    title: 'The Art of Code Reviews',
    author: 'Taylor Swift',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    likes: 145,
    comments: 23,
    tags: ['Best Practices'],
    excerpt: 'How to give and receive feedback effectively.',
  },
  {
    id: 7,
    title: 'TypeScript 5.4 Deep Dive',
    author: 'Chris Park',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
    likes: 167,
    comments: 29,
    tags: ['TypeScript'],
    excerpt: 'New features and improvements in the latest release.',
  },
]

const PostCard = ({ post, index }: { post: Post; index: number }) => {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)

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
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
          >
            {tag}
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
      {/* Hero Section with Paginating Gallery */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 mb-8"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mb-2"
            >
              <Sparkles size={20} className="text-yellow-500" />
              <span className="text-sm font-medium text-gray-600">
                Welcome back!
              </span>
            </motion.div>
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

        {/* Gallery */}
        <div className="relative">
          <div className="overflow-hidden rounded-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.4 }}
                className="flex gap-6 bg-white rounded-2xl p-6"
              >
                {/* Featured Image */}
                <div className="w-1/2 relative overflow-hidden rounded-xl">
                  <img
                    src={topPosts[currentSlide].image}
                    alt={topPosts[currentSlide].title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                    <TrendingUp size={12} />
                    <span>#{currentSlide + 1} Today</span>
                  </div>
                </div>

                {/* Post Details */}
                <div className="w-1/2 flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      {topPosts[currentSlide].title}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {topPosts[currentSlide].excerpt}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {topPosts[currentSlide].tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={topPosts[currentSlide].avatar}
                        alt={topPosts[currentSlide].author}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {topPosts[currentSlide].author}
                        </div>
                        <div className="text-sm text-gray-500">
                          {topPosts[currentSlide].likes} likes · {topPosts[currentSlide].comments} comments
                        </div>
                      </div>
                    </div>
                    <NavLink
                      to={`/post/${topPosts[currentSlide].id}`}
                      className="flex items-center gap-1 text-gray-900 font-medium hover:text-gray-600 transition-colors"
                    >
                      Read more
                      <ArrowRight size={16} />
                    </NavLink>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <ChevronRight size={20} />
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
