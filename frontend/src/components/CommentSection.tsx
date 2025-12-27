import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, MoreHorizontal, ChevronDown, ChevronUp, Send, Trash2, Edit2, X } from 'lucide-react'
import { api, Comment } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface CommentItemProps {
  comment: Comment
  postId: string
  depth?: number
  onDelete: (id: string) => void
  onUpdate: (comment: Comment) => void
}

const CommentItem = ({ comment, postId, depth = 0, onDelete, onUpdate }: CommentItemProps) => {
  const { user } = useAuth()
  const [liked, setLiked] = useState(comment.liked)
  const [likeCount, setLikeCount] = useState(comment.likes)
  const [showReplies, setShowReplies] = useState(depth === 0 && (comment.replies?.length || 0) > 0)
  const [replies, setReplies] = useState<Comment[]>(comment.replies || [])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [replying, setReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [showMenu, setShowMenu] = useState(false)
  const replyInputRef = useRef<HTMLTextAreaElement>(null)

  const canModify = user && (String(user.id) === comment.author.id || user.role === 'admin')
  const maxDepth = 3

  const handleLike = async () => {
    if (!user) return
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
    const res = await api.comments.like(comment.id)
    if (res.data) setLiked(res.data.liked)
  }

  const loadMoreReplies = async () => {
    if (loadingReplies) return
    setLoadingReplies(true)
    const res = await api.comments.getReplies(comment.id, 20, replies.length)
    if (res.data) setReplies([...replies, ...res.data])
    setLoadingReplies(false)
  }

  const handleReply = async () => {
    if (!replyContent.trim() || submitting) return
    setSubmitting(true)
    const res = await api.comments.create(postId, replyContent, Number(comment.id))
    if (res.data) {
      setReplies([...replies, res.data])
      setReplyContent('')
      setReplying(false)
      setShowReplies(true)
    }
    setSubmitting(false)
  }

  const handleEdit = async () => {
    if (!editContent.trim() || submitting) return
    setSubmitting(true)
    const res = await api.comments.update(comment.id, editContent)
    if (res.data) {
      onUpdate(res.data)
      setEditing(false)
    }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return
    const res = await api.comments.delete(comment.id)
    if (!res.error) onDelete(comment.id)
    setShowMenu(false)
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d`
    return `${Math.floor(days / 7)}w`
  }

  useEffect(() => {
    if (replying && replyInputRef.current) {
      replyInputRef.current.focus()
    }
  }, [replying])

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-gray-100 dark:border-[#333]' : ''}`}>
      <div className="flex gap-3 py-3">
        {/* Avatar */}
        <NavLink to={`/profile/${comment.author.id}`} className="shrink-0">
          <img 
            src={comment.author.avatar} 
            alt="" 
            className="w-8 h-8 rounded-full object-cover hover:opacity-80 transition-opacity" 
          />
        </NavLink>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <NavLink 
              to={`/profile/${comment.author.id}`} 
              className="font-semibold text-[13px] text-gray-900 dark:text-white hover:underline"
            >
              {comment.author.username}
            </NavLink>
            <span className="text-[11px] text-gray-400">{timeAgo(comment.createdAt)}</span>
            {comment.createdAt !== comment.updatedAt && (
              <span className="text-[10px] text-gray-400 italic">(edited)</span>
            )}
          </div>

          {/* Content */}
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#444] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-900 dark:text-white"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  disabled={submitting || !editContent.trim()}
                  className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setEditContent(comment.content) }}
                  className="px-3 py-1 text-gray-500 text-xs font-medium hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}

          {/* Actions */}
          {!editing && (
            <div className="flex items-center gap-4 mt-2">
              <button 
                onClick={handleLike}
                className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
              >
                <Heart size={14} className={liked ? 'text-red-500 fill-red-500' : ''} />
                {likeCount > 0 && <span className="text-[11px] font-medium">{likeCount}</span>}
              </button>

              {depth < maxDepth && (
                <button 
                  onClick={() => setReplying(!replying)}
                  className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors text-[11px] font-medium"
                >
                  Reply
                </button>
              )}

              {canModify && (
                <div className="relative ml-auto">
                  <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-[#333]"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-6 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg shadow-lg py-1 z-10 min-w-[100px]"
                      >
                        <button
                          onClick={() => { setEditing(true); setShowMenu(false) }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* Reply Input */}
          <AnimatePresence>
            {replying && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex gap-2"
              >
                <img 
                  src={user?.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`} 
                  alt="" 
                  className="w-6 h-6 rounded-full shrink-0" 
                />
                <div className="flex-1 flex gap-2">
                  <textarea
                    ref={replyInputRef}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.author.username}...`}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#444] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-900 dark:text-white placeholder-gray-400"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleReply()
                      }
                    }}
                  />
                  <button
                    onClick={handleReply}
                    disabled={submitting || !replyContent.trim()}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                  </button>
                  <button
                    onClick={() => { setReplying(false); setReplyContent('') }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Replies */}
          {comment.replyCount > 0 && (
            <div className="mt-2">
              {!showReplies ? (
                <button
                  onClick={() => { setShowReplies(true); if (replies.length === 0) loadMoreReplies() }}
                  className="flex items-center gap-1 text-[12px] font-medium text-blue-500 hover:text-blue-600"
                >
                  <ChevronDown size={14} />
                  View {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowReplies(false)}
                    className="flex items-center gap-1 text-[12px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
                  >
                    <ChevronUp size={14} />
                    Hide replies
                  </button>
                  
                  <AnimatePresence>
                    {replies.map((reply) => (
                      <motion.div
                        key={reply.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <CommentItem
                          comment={reply}
                          postId={postId}
                          depth={depth + 1}
                          onDelete={(id) => setReplies(replies.filter(r => r.id !== id))}
                          onUpdate={(updated) => setReplies(replies.map(r => r.id === updated.id ? updated : r))}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {replies.length < comment.replyCount && (
                    <button
                      onClick={loadMoreReplies}
                      disabled={loadingReplies}
                      className="text-[12px] font-medium text-blue-500 hover:text-blue-600 ml-11"
                    >
                      {loadingReplies ? 'Loading...' : `Load more replies`}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface CommentSectionProps {
  postId: string
}

export const CommentSection = ({ postId }: CommentSectionProps) => {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'top' | 'newest' | 'oldest'>('top')
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true)
      const res = await api.comments.getForPost(postId, sort)
      if (res.data) setComments(res.data)
      setLoading(false)
    }
    fetchComments()
  }, [postId, sort])

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return
    setSubmitting(true)
    const res = await api.comments.create(postId, newComment)
    if (res.data) {
      setComments([res.data, ...comments])
      setNewComment('')
    }
    setSubmitting(false)
  }

  return (
    <div id="comments" className="mt-8 pt-8 border-t border-gray-200 dark:border-[#333]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} className="text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Comments
            {comments.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">({comments.length})</span>
            )}
          </h2>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#252525] rounded-lg">
          {(['top', 'newest', 'oldest'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                sort === s 
                  ? 'bg-white dark:bg-[#333] text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* New Comment Input */}
      {user ? (
        <div className="flex gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-[#333]">
          <img 
            src={user.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} 
            alt="" 
            className="w-10 h-10 rounded-full shrink-0" 
          />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#444] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-900 dark:text-white placeholder-gray-400"
              rows={2}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSubmit}
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Post
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 pb-6 border-b border-gray-100 dark:border-[#333] text-center py-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            <NavLink to="/login" className="text-blue-500 hover:underline">Sign in</NavLink> to join the conversation
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-gray-200 dark:border-[#333] border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-[#333]">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onDelete={(id) => setComments(comments.filter(c => c.id !== id))}
              onUpdate={(updated) => setComments(comments.map(c => c.id === updated.id ? updated : c))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentSection
