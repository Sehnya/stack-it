import { useParams, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Bookmark, ArrowLeft, Calendar, Share2, Edit, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { FilesSidebar, FileModal } from '../components/CodeBlock'
import { TechTag } from '../components/TechTag'
import { PostContent } from '../components/PostContent'
import { api, Post as PostType } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const Post = () => {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bookmarked, setBookmarked] = useState(false)
  const [liked, setLiked] = useState(false)
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
        const { data } = await api.posts.getById(postId)
        if (data) {
          setPost(data)
          setLikeCount(data.favorites)
        }
        setLoading(false)
      }
    }
    fetchPost()
  }, [postId])

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
              <TechTag key={tech} tech={tech} size="md" />
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
          className="flex-1 bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-sm"
        >
          {/* Meta Info */}
          <div className="flex items-center gap-6 mb-8 text-gray-600 pb-6 border-b border-gray-200">
            <NavLink to={`/profile/${post.author.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src={post.author.avatar}
                alt={post.author.username}
                className="w-10 h-10 rounded-full"
              />
              <span className="font-medium text-gray-900">
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
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Content - render HTML from TipTap with IDE code blocks */}
          <PostContent html={post.content} />

          {/* Like Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={handleLike}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${
                  liked
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart size={22} className={liked ? 'fill-white' : ''} />
                <span className="font-medium">{likeCount} likes</span>
              </button>

              <div className="text-gray-500 text-sm">
                Share this stack with your community
              </div>
            </div>
          </div>
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
    </div>
  )
}

export default Post
