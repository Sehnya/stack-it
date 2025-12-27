import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  ArrowLeft, MessageSquare, Eye, Clock, CheckCircle, Send,
  HelpCircle, Sparkles, MessageCircle, MoreHorizontal, Trash2, Edit2
} from 'lucide-react'
import { api, Discussion as DiscussionType } from '../lib/api'
import { getTechIconUrl } from '../components/TechTag'
import { useAuth } from '../context/AuthContext'

const categoryStyles: Record<string, { bg: string; text: string; icon: typeof HelpCircle }> = {
  help: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: HelpCircle },
  showcase: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', icon: Sparkles },
  feedback: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: MessageCircle },
  general: { bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-gray-700 dark:text-gray-400', icon: MessageSquare },
}

const Discussion = () => {
  const { discussionId } = useParams<{ discussionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [discussion, setDiscussion] = useState<DiscussionType | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  const replyEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write your reply...' }),
    ],
    content: '',
    editorProps: {
      attributes: { class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3' },
    },
  })

  useEffect(() => {
    const fetchDiscussion = async () => {
      if (!discussionId) return
      setLoading(true)
      const { data } = await api.discussions.getById(discussionId)
      if (data) setDiscussion(data)
      setLoading(false)
    }
    fetchDiscussion()
  }, [discussionId])

  const handleDelete = async () => {
    if (!discussionId || !confirm('Delete this discussion?')) return
    const { error } = await api.discussions.delete(discussionId)
    if (!error) navigate('/community')
  }

  const handleMarkResolved = async () => {
    if (!discussionId || !discussion) return
    const { data } = await api.discussions.update(discussionId, { resolved: !discussion.resolved })
    if (data) setDiscussion(data)
  }

  const handleSubmitReply = useCallback(async () => {
    if (!replyEditor || !discussionId) return
    const content = replyEditor.getHTML()
    if (!content.trim() || content === '<p></p>') return

    setIsSubmittingReply(true)
    // For now, just show a message since replies endpoint needs more work
    alert('Reply functionality coming soon!')
    replyEditor.commands.clearContent()
    setIsSubmittingReply(false)
  }, [replyEditor, discussionId])

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-100 rounded-full animate-spin" />
      </div>
    )
  }

  if (!discussion) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Discussion not found</p>
        <button onClick={() => navigate('/community')} className="text-blue-600 dark:text-blue-400 hover:underline">
          Back to Community
        </button>
      </div>
    )
  }

  const catStyle = categoryStyles[discussion.category] || categoryStyles.general
  const CatIcon = catStyle.icon
  const isAuthor = user?.id === Number(discussion.author.id)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/community')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft size={20} /> Back to Community
        </button>
        {isAuthor && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg text-gray-600 dark:text-gray-400">
              <MoreHorizontal size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-200 dark:border-[#333] py-1 min-w-[160px] z-10">
                <button onClick={handleMarkResolved} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]">
                  <CheckCircle size={16} /> {discussion.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                </button>
                <button onClick={() => navigate(`/edit-discussion/${discussionId}`)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]">
                  <Edit2 size={16} /> Edit
                </button>
                <button onClick={handleDelete} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Discussion Content */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] overflow-hidden mb-6">
        {/* Category & Status */}
        <div className="flex items-center gap-3 px-6 pt-6">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${catStyle.bg} ${catStyle.text}`}>
            <CatIcon size={12} />
            {discussion.category}
          </span>
          {discussion.resolved && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <CheckCircle size={12} /> Resolved
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 px-6 pt-4 pb-2">{discussion.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-4 px-6 pb-4 text-sm text-gray-500 dark:text-gray-400">
          <NavLink to={`/profile/${discussion.author.id}`} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-gray-100">
            <img src={discussion.author.avatar} alt="" className="w-6 h-6 rounded-full" />
            <span className="font-medium">{discussion.author.username}</span>
          </NavLink>
          <span className="flex items-center gap-1"><Clock size={14} /> {timeAgo(discussion.createdAt)}</span>
          <span className="flex items-center gap-1"><Eye size={14} /> {discussion.viewCount} views</span>
          <span className="flex items-center gap-1"><MessageSquare size={14} /> {discussion.replies} replies</span>
        </div>

        {/* Tags */}
        {discussion.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 px-6 pb-4">
            {discussion.tags.map(tag => {
              const icon = getTechIconUrl(tag)
              return (
                <NavLink key={tag} to={`/tech/${encodeURIComponent(tag)}`} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333]">
                  {icon && <img src={icon} alt="" className="w-3.5 h-3.5" />}
                  #{tag}
                </NavLink>
              )
            })}
          </div>
        )}

        {/* Content */}
        <div className="px-6 pb-6 border-t border-gray-100 dark:border-[#333] pt-4">
          <div className="prose prose-gray dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: discussion.content }} />
        </div>
      </motion.div>

      {/* Reply Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#333]">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Leave a Reply</h3>
        </div>
        <EditorContent editor={replyEditor} className="dark:text-gray-100" />
        <div className="px-6 py-3 bg-gray-50 dark:bg-[#252525] flex justify-end">
          <button
            onClick={handleSubmitReply}
            disabled={isSubmittingReply}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
          >
            <Send size={16} /> {isSubmittingReply ? 'Posting...' : 'Post Reply'}
          </button>
        </div>
      </motion.div>

      {/* Replies placeholder */}
      {discussion.replies > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 p-6 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] text-center text-gray-500 dark:text-gray-400">
          <MessageSquare size={24} className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
          <p>{discussion.replies} replies - full reply thread coming soon</p>
        </motion.div>
      )}
    </div>
  )
}

export default Discussion
