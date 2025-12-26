import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Heart, Eye, Copy, Check, Code2 } from 'lucide-react'
import { Snippet, api } from '../lib/api'
import { getTechIconUrl, getTechColor } from './TechTag'
import { useAuth } from '../context/AuthContext'

interface SnippetCardProps {
  snippet: Snippet
  onUpdate?: (snippet: Snippet) => void
  compact?: boolean
}

export const SnippetCard = ({ snippet, onUpdate, compact = false }: SnippetCardProps) => {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isRating, setIsRating] = useState(false)
  const [isFavoriting, setIsFavoriting] = useState(false)
  const [localSnippet, setLocalSnippet] = useState(snippet)

  const langColor = getTechColor(snippet.language)
  const langIcon = getTechIconUrl(snippet.language)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(snippet.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRate = async (rating: number) => {
    if (!user || isRating) return
    setIsRating(true)
    const res = await api.snippets.rate(snippet.id, rating)
    if (res.data) {
      const updated = {
        ...localSnippet,
        rating: {
          average: res.data.average,
          count: res.data.count,
          userRating: rating,
        },
      }
      setLocalSnippet(updated)
      onUpdate?.(updated)
    }
    setIsRating(false)
  }

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user || isFavoriting) return
    setIsFavoriting(true)
    const res = await api.snippets.favorite(snippet.id)
    if (res.data) {
      const updated = {
        ...localSnippet,
        isFavorited: res.data.favorited,
        favorites: res.data.favorited ? localSnippet.favorites + 1 : localSnippet.favorites - 1,
      }
      setLocalSnippet(updated)
      onUpdate?.(updated)
    }
    setIsFavoriting(false)
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const codePreview = snippet.code.split('\n').slice(0, compact ? 4 : 6).join('\n')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
    >
      {/* Code Preview */}
      <div className="relative">
        <pre 
          className="p-4 text-xs overflow-hidden"
          style={{ 
            backgroundColor: '#282a36',
            maxHeight: compact ? '100px' : '140px',
            fontFamily: "'Fira Code', monospace",
          }}
        >
          <code className="text-[#f8f8f2]">{codePreview}</code>
        </pre>
        <div className="absolute inset-0 bg-gradient-to-t from-[#282a36] to-transparent pointer-events-none" />
        
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors opacity-0 group-hover:opacity-100"
          title="Copy code"
        >
          {copied ? (
            <Check size={14} className="text-green-400" />
          ) : (
            <Copy size={14} className="text-white" />
          )}
        </button>

        {/* Language Badge */}
        <div 
          className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold"
          style={{ backgroundColor: langColor.bg + '30', color: langColor.bg }}
        >
          {langIcon ? (
            <img src={langIcon} alt="" className="w-3.5 h-3.5" />
          ) : (
            <Code2 size={12} />
          )}
          {snippet.language}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <NavLink to={`/snippet/${snippet.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1 mb-1">
            {snippet.title}
          </h3>
        </NavLink>
        
        {snippet.description && !compact && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">{snippet.description}</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {snippet.tags.slice(0, 3).map(tag => {
            const tagIcon = getTechIconUrl(tag)
            return (
              <NavLink
                key={tag}
                to={`/tech/${encodeURIComponent(tag)}`}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                {tagIcon && <img src={tagIcon} alt="" className="w-3 h-3" />}
                {tag}
              </NavLink>
            )
          })}
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-2 mb-3">
          <div 
            className="flex items-center gap-0.5"
            onMouseLeave={() => setHoveredRating(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRate(star)}
                onMouseEnter={() => user && setHoveredRating(star)}
                disabled={!user || isRating}
                className={`transition-colors ${user ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <Star
                  size={16}
                  className={`${
                    star <= (hoveredRating || localSnippet.rating.userRating || 0)
                      ? 'text-yellow-400 fill-yellow-400'
                      : star <= localSnippet.rating.average
                      ? 'text-yellow-400 fill-yellow-400/50'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {localSnippet.rating.average.toFixed(1)}
          </span>
          <span className="text-xs text-gray-400">
            ({localSnippet.rating.count})
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <NavLink 
            to={`/profile/${snippet.author.id}`}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900"
          >
            <img src={snippet.author.avatar} alt="" className="w-5 h-5 rounded-full" />
            <span className="font-medium">{snippet.author.username}</span>
            <span>·</span>
            <span>{timeAgo(snippet.createdAt)}</span>
          </NavLink>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <button
              onClick={handleFavorite}
              disabled={!user || isFavoriting}
              className={`flex items-center gap-1 transition-colors ${
                localSnippet.isFavorited ? 'text-red-500' : 'hover:text-red-500'
              } ${!user ? 'cursor-default' : ''}`}
            >
              <Heart size={14} className={localSnippet.isFavorited ? 'fill-current' : ''} />
              {localSnippet.favorites}
            </button>
            <span className="flex items-center gap-1">
              <Eye size={14} />
              {localSnippet.viewCount}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default SnippetCard
