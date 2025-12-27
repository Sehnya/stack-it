import { useParams, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Bookmark, ArrowLeft, Calendar, Share2, Edit, Trash2, Repeat2, Quote } from 'lucide-react'
import { useState, useEffect } from 'react'
import { FilesSidebar, FileModal } from '../components/CodeBlock'
import { TechTag } from '../components/TechTag'
import { PostContent } from '../components/PostContent'
import { CommentSection } from '../components/CommentSection'
import { api, Post as PostType } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const Post = () => {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bookmarked, setBookmarked] = useState(false)
  const [liked, setLiked] = useState(false)
  const [reposted, setReposted] = useState(false)
  const [repostCount, setRepostCount] = useState(0)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [repostQuote, setRepostQuote] = useState('')
  const [reposting, setReposting] = useState(false)
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [post, setPost] = useState<PostType | null>(null)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  // Check if current user can edit/delete
  const canEdit = post && user && (
    String(user.id) === post.author.id || user.role === 'admin'
  )

  useEffect(() => {
    const fetchPost = async () => {
      if (postId) {
        setLoading(true)
        const [postRes, repostStatusRes, repostCountRes] = await Promise.all([
          api.posts.getById(postId),
          user ? api.reposts.getStatus(postId) : Promise.resolve({ data: null }),
          api.reposts.getCount(postId),
        ])
        
        if (postRes.data) {
          setPost(postRes.data)
          setLikeCount(postRes.data.favorites)
        }
        if (repostStatusRes.data) {
          setReposted(repostStatusRes.data.reposted)
          setRepostQuote(repostStatusRes.data.quote || '')
        }
        if (repostCountRes.data) {
          setRepostCount(repostCountRes.data.count)
        }
        setLoading(false)
      }
    }
    fetchPost()
  }, [postId, user])

  const handleDelete = async () => {
    if (!postId || !confirm('Are you sure you want to delete this post?')) return
    setDeleting(true)
    const { error } = await api.posts.delete(postId)
    if (!error) {
      navigate('/community')
    } else {
      alert('Failed to delete post')
      setDeleting(false)
    }
  }

  // Get the selected file for the modal
  const selectedFile = activeFile && post
    ? post.files.find((f) => f.name === activeFile) || null
    : null

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveFile(null)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const handleLike = async () => {
    if (postId) {
      const { data } = await api.posts.like(postId)
      if (data) {
        setLiked(data.liked)
        setLikeCount(data.liked ? likeCount + 1 : likeCount - 1)
      }
    }
  }

  const handleRepost = async (withQuote: boolean) => {
    if (!postId || !user) return
    setReposting(true)
    
    const { data } = await api.reposts.toggle(postId, withQuote ? repostQuote : undefined)
    if (data) {
      setReposted(data.reposted)
      setRepostCount(data.reposted ? repostCount + 1 : repostCount - 1)
      if (!data.reposted) {
        setRepostQuote('')
      }
    }
    
    setReposting(false)
    setShowRepostModal(false)
  }

  const handleRemoveRepost = async () => {
    if (!postId || !user || !reposted) return
    setReposting(true)
    
    const { data } = await api.reposts.toggle(postId)
    if (data) {
      setReposted(false)
      setRepostCount(repostCount - 1)
      setRepostQuote('')
    }
    
    setReposting(false)
    setShowRepostModal(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading post...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h1>
          <p className="text-gray-600 mb-4">The post you're looking for doesn't exist.</p>
          <NavLink to="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </NavLink>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <NavLink
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </NavLink>
      </motion.div>

      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-[400px] rounded-3xl overflow-hidden mb-8"
      >
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {canEdit && (
            <>
              <NavLink
                to={`/edit-post/${post.id}`}
                className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Edit size={20} className="text-white" />
              </NavLink>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-12 h-12 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-600/80 transition-colors disabled:opacity-50"
              >
                <Trash2 size={20} className="text-white" />
              </button>
            </>
          )}
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <Bookmark
              size={22}
              className={bookmarked ? 'text-white fill-white' : 'text-white'}
            />
          </button>
          <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <Share2 size={22} className="text-white" />
          </button>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.technologies.map((tech) => (
              <NavLink key={tech} to={`/tech/${encodeURIComponent(tech)}`}>
                <TechTag tech={tech} size="md" />
              </NavLink>
            ))}
          </div>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            {post.title}
          </h1>
        </div>
      </motion.div>

      {/* Main content area with sidebar */}
      <div className="flex gap-8">
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 bg-white/60 dark:bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl p-8 shadow-sm"
        >
          {/* Meta Info */}
          <div className="flex items-center gap-6 mb-8 text-gray-600 dark:text-gray-400 pb-6 border-b border-gray-200 dark:border-[#333]">
            <NavLink to={`/profile/${post.author.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src={post.author.avatar}
                alt={post.author.username}
                className="w-10 h-10 rounded-full"
              />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {post.author.username}
              </span>
            </NavLink>
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Excerpt */}
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Content - render HTML from TipTap with IDE code blocks */}
          <PostContent html={post.content} />

          {/* Like & Repost Section */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-[#333]">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${
                  liked
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333]'
                }`}
              >
                <Heart size={22} className={liked ? 'fill-white' : ''} />
                <span className="font-medium">{likeCount} likes</span>
              </button>

              <button
                onClick={() => user && setShowRepostModal(true)}
                disabled={!user}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${
                  reposted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333]'
                } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Repeat2 size={22} className={reposted ? 'fill-white' : ''} />
                <span className="font-medium">{repostCount} reposts</span>
              </button>

              <div className="ml-auto text-gray-500 dark:text-gray-400 text-sm">
                Share this stack with your community
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <CommentSection postId={post.id} />
        </motion.div>

        {/* Files Sidebar */}
        {post.files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-64 shrink-0"
          >
            <FilesSidebar
              files={post.files}
              activeFile={activeFile}
              onSelectFile={setActiveFile}
            />
          </motion.div>
        )}
      </div>

      {/* File Modal */}
      {selectedFile && (
        <FileModal file={selectedFile} onClose={() => setActiveFile(null)} />
      )}

      {/* Repost Modal */}
      {showRepostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRepostModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md mx-4 border border-gray-200 dark:border-[#333]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {reposted ? 'Manage Repost' : 'Repost'}
            </h3>
            
            <div className="space-y-4">
              {reposted ? (
                // Already reposted - show remove option
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Repeat2 size={18} />
                      <span className="font-medium">You reposted this</span>
                    </div>
                    {repostQuote && (
                      <p className="mt-2 text-sm text-green-600 dark:text-green-500 italic">"{repostQuote}"</p>
                    )}
                  </div>
                  <button
                    onClick={handleRemoveRepost}
                    disabled={reposting}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    {reposting ? (
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={18} />
                        <span>Remove Repost</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                // Not reposted - show repost options
                <>
                  <button
                    onClick={() => handleRepost(false)}
                    disabled={reposting}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors text-left"
                  >
                    <Repeat2 size={20} className="text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Repost</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Share instantly to your followers</p>
                    </div>
                  </button>

                  <div className="border border-gray-200 dark:border-[#333] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Quote size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">Quote Repost</span>
                    </div>
                    <textarea
                      value={repostQuote}
                      onChange={(e) => setRepostQuote(e.target.value)}
                      placeholder="Add your thoughts..."
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500/20 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                      rows={3}
                      maxLength={280}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{repostQuote.length}/280</span>
                      <button
                        onClick={() => handleRepost(true)}
                        disabled={reposting || !repostQuote.trim()}
                        className="px-4 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        {reposting ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowRepostModal(false)}
              className="w-full mt-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Post
