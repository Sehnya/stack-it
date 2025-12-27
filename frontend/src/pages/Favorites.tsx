import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bookmark,
  Heart,
  Eye,
  Clock,
  Trash2,
  ExternalLink,
  Search,
  Grid3X3,
  List,
  SortAsc,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { TechTag } from '../components/TechTag'
import { api, Post } from '../lib/api'

// Grid view card
const GridCard = ({ post, onRemove }: { post: Post; onRemove: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#333]/50 overflow-hidden group hover:shadow-lg transition-all"
    >
      <NavLink to={`/post/${post.id}`}>
        <div className="relative h-40 overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-3 right-3">
            <button
              onClick={(e) => { e.preventDefault(); onRemove() }}
              className="w-8 h-8 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-[#1a1a1a] transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </NavLink>

      <div className="p-4">
        <NavLink to={`/post/${post.id}`}>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 mb-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            {post.title}
          </h3>
        </NavLink>

        <div className="flex flex-wrap gap-1 mb-3">
          {post.technologies.slice(0, 2).map((tech) => (
            <TechTag key={tech} tech={tech} size="sm" />
          ))}
          {post.technologies.length > 2 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">+{post.technologies.length - 2}</span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Heart size={12} /> {post.favorites}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={12} /> {post.viewCount}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// List view card
const ListCard = ({ post, onRemove }: { post: Post; onRemove: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-[#333]/50 p-4 flex gap-4 group hover:shadow-md transition-all"
    >
      <NavLink to={`/post/${post.id}`} className="shrink-0">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-32 h-24 rounded-xl object-cover"
        />
      </NavLink>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <NavLink to={`/post/${post.id}`}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                {post.title}
              </h3>
            </NavLink>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">{post.excerpt}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <NavLink
              to={`/post/${post.id}`}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg transition-colors"
            >
              <ExternalLink size={16} />
            </NavLink>
            <button
              onClick={onRemove}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-wrap gap-1.5">
            {post.technologies.slice(0, 3).map((tech) => (
              <TechTag key={tech} tech={tech} size="sm" />
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Heart size={12} /> {post.favorites}
            </span>
            <span>{post.author.username}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const Favorites = () => {
  const [favorites, setFavorites] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent')

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true)
      const { data } = await api.posts.getFavorites()
      if (data) {
        setFavorites(data)
      }
      setLoading(false)
    }
    fetchFavorites()
  }, [])

  const handleRemove = async (postId: string) => {
    await api.posts.favorite(postId)
    setFavorites(favorites.filter(p => p.id !== postId))
  }

  // Filter and sort
  const filteredFavorites = favorites
    .filter(post => 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.technologies.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'popular') return b.favorites - a.favorites
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Bookmark size={20} className="text-yellow-600 dark:text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Saved Stacks</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{favorites.length} saved items</p>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between gap-4 mb-6"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search saved stacks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-[#333]/50 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none pl-9 pr-8 py-2.5 bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-[#333]/50 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
            <SortAsc size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-[#333]/50 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-gray-100 rounded-full mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading saved stacks...</p>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-white/50 dark:bg-[#1a1a1a]/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#333]/50"
        >
          <Bookmark size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {searchQuery ? 'No matching stacks' : 'No saved stacks yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchQuery
              ? 'Try a different search term'
              : 'Save stacks you want to revisit later'
            }
          </p>
          {!searchQuery && (
            <NavLink
              to="/community"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Explore Community
            </NavLink>
          )}
        </motion.div>
      ) : viewMode === 'grid' ? (
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {filteredFavorites.map((post) => (
            <GridCard key={post.id} post={post} onRemove={() => handleRemove(post.id)} />
          ))}
        </motion.div>
      ) : (
        <motion.div layout className="space-y-3">
          {filteredFavorites.map((post) => (
            <ListCard key={post.id} post={post} onRemove={() => handleRemove(post.id)} />
          ))}
        </motion.div>
      )}

      {/* Stats Footer */}
      {filteredFavorites.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 bg-white/50 dark:bg-[#1a1a1a]/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-[#333]/50"
        >
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            <span>
              <strong className="text-gray-900 dark:text-gray-100">{filteredFavorites.length}</strong> saved stacks
            </span>
            <span>
              <strong className="text-gray-900 dark:text-gray-100">
                {[...new Set(filteredFavorites.flatMap(p => p.technologies))].length}
              </strong> technologies
            </span>
            <span>
              <strong className="text-gray-900 dark:text-gray-100">
                {filteredFavorites.reduce((acc, p) => acc + p.favorites, 0)}
              </strong> total likes
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Favorites
