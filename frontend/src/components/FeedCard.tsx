import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, MessageSquare, Repeat2, Bookmark } from 'lucide-react'
import { TechTag } from './TechTag'
import { FeedItem, api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface FeedCardProps {
  item: FeedItem
  onRepost?: (postId: string, reposted: boolean) => void
}

export const FeedCard = ({ item, onRepost }: FeedCardProps) => {
  const { user } = useAuth()
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [quote, setQuote] = useState('')
  const [reposting, setReposting] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(item.favorites)
  const [saved, setSaved] = useState(false)

  const handleLike = async () => {
    if (!user) return
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
    const res = await api.posts.like(item.id)
    if (res.data) {
      setLiked(res.data.liked)
    }
  }

  const handleRepost = async (withQuote: boolean) => {
    if (!user) return
    setReposting(true)
    const res = await api.reposts.toggle(item.id, withQuote ? quote : undefined)
    if (res.data) onRepost?.(item.id, res.data.reposted)
    setReposting(false)
    setShowRepostModal(false)
    setQuote('')
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  const formatCount = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toString()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
    >
      {/* Repost indicator */}
      {item.type === 'repost' && item.repostedBy && (
        <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 mb-2 ml-6">
          <Repeat2 size={12} />
          <NavLink to={`/profile/${item.repostedBy.id}`} className="hover:underline font-medium">
            {item.repostedBy.username}
          </NavLink>
          <span>reposted</span>
        </div>
      )}

      <div className="flex gap-2">
        {/* Avatar */}
        <NavLink to={`/profile/${item.author.id}`} className="shrink-0">
          <img src={item.author.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
        </NavLink>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1 text-[13px]">
            <NavLink to={`/profile/${item.author.id}`} className="font-semibold text-gray-900 dark:text-white hover:underline truncate">
              {item.author.username}
            </NavLink>
            <span className="text-gray-500 dark:text-gray-400">·</span>
            <span className="text-gray-500 dark:text-gray-400">{timeAgo(item.createdAt)}</span>
          </div>

          {/* Quote */}
          {item.type === 'repost' && item.quote && (
            <p className="text-[13px] text-gray-600 dark:text-gray-300 mt-1 italic">"{item.quote}"</p>
          )}

          {/* Title & Content */}
          <NavLink to={`/post/${item.id}`} className="block group">
            <h3 className="text-[13px] font-medium text-gray-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
              {item.title}
            </h3>
            
            {/* Thumbnail */}
            {item.coverImage && (
              <div className="mt-2 rounded-lg overflow-hidden h-32">
                <img src={item.coverImage} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </NavLink>

          {/* Tech tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {item.technologies.slice(0, 3).map((tech) => (
              <TechTag key={tech} tech={tech} size="sm" />
            ))}
            {item.technologies.length > 3 && (
              <span className="text-[11px] text-gray-400">+{item.technologies.length - 3}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <button onClick={handleLike} className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
              <Heart size={14} className={liked ? 'text-red-500 fill-red-500' : ''} />
              <span className="text-[11px]">{formatCount(likeCount)}</span>
            </button>
            <NavLink to={`/post/${item.id}#comments`} className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
              <MessageSquare size={14} />
              <span className="text-[11px]">{formatCount(item.comments)}</span>
            </NavLink>
            <button onClick={() => user && setShowRepostModal(true)} className="flex items-center gap-1 text-gray-500 hover:text-green-500 transition-colors">
              <Repeat2 size={14} />
              <span className="text-[11px]">{formatCount(item.reposts)}</span>
            </button>
            <button onClick={() => setSaved(!saved)} className="text-gray-500 hover:text-yellow-500 transition-colors ml-auto">
              <Bookmark size={14} className={saved ? 'fill-yellow-500 text-yellow-500' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Repost Modal */}
      {showRepostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRepostModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1a1a1a] rounded-xl w-full max-w-xs mx-4 overflow-hidden border border-gray-200 dark:border-[#333]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 space-y-2">
              <button
                onClick={() => handleRepost(false)}
                disabled={reposting}
                className="w-full py-2 text-left px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors flex items-center gap-2 text-sm"
              >
                <Repeat2 size={16} className="text-green-500" />
                <span className="text-gray-900 dark:text-white">Repost</span>
              </button>
              <div className="border-t border-gray-200 dark:border-[#333] pt-2">
                <textarea
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-[#252525] rounded-lg text-xs resize-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-500"
                  rows={2}
                  maxLength={280}
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-400">{quote.length}/280</span>
                  <button
                    onClick={() => handleRepost(true)}
                    disabled={reposting || !quote.trim()}
                    className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    Quote
                  </button>
                </div>
              </div>
            </div>
            <button onClick={() => setShowRepostModal(false)} className="w-full py-2 border-t border-gray-200 dark:border-[#333] text-gray-500 text-xs hover:bg-gray-50 dark:hover:bg-[#252525]">
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

export default FeedCard
