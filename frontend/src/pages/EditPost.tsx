import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Code, Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Undo, Redo, AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Image as ImageIcon, Highlighter,
  ArrowLeft, Save, X, Upload, File,
} from 'lucide-react'
import { TechTag } from '../components/TechTag'
import { useAuth } from '../context/AuthContext'
import { getLanguageFromFilename } from '../lib/postStore'
import { api, PostFile, Post } from '../lib/api'

type CodeFile = PostFile
const lowlight = createLowlight(common)

const ToolbarButton = ({ onClick, active, disabled, children, title }: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-colors ${
      active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
)

const Divider = () => <div className="w-px h-6 bg-gray-300 mx-1" />

const EditPost = () => {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [technologies, setTechnologies] = useState<string[]>([])
  const [techInput, setTechInput] = useState('')
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([])
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [originalPost, setOriginalPost] = useState<Post | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      Image.configure({ allowBase64: true, inline: true }),
      TextStyle,
      Color,
      FontFamily,
      Placeholder.configure({ placeholder: 'Write your post content...' }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
    },
  })

  // Load existing post
  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return
      setLoading(true)
      const { data, error } = await api.posts.getById(postId)
      if (data) {
        setOriginalPost(data)
        setTitle(data.title)
        setCoverImage(data.coverImage || '')
        setTechnologies(data.technologies)
        setCodeFiles(data.files || [])
        editor?.commands.setContent(data.content)
      }
      if (error) {
        alert('Failed to load post')
        navigate('/community')
      }
      setLoading(false)
    }
    if (editor) loadPost()
  }, [postId, editor, navigate])

  // Check authorization
  useEffect(() => {
    if (!loading && originalPost && user) {
      const canEdit = String(user.id) === originalPost.author.id || user.role === 'admin'
      if (!canEdit) {
        alert('Not authorized to edit this post')
        navigate(`/post/${postId}`)
      }
    }
  }, [loading, originalPost, user, navigate, postId])

  const addTech = () => {
    if (techInput.trim() && !technologies.includes(techInput.trim())) {
      setTechnologies([...technologies, techInput.trim()])
      setTechInput('')
    }
  }

  const removeTech = (tech: string) => {
    setTechnologies(technologies.filter((t) => t !== tech))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setCodeFiles((prev) => [
          ...prev,
          { name: file.name, language: getLanguageFromFilename(file.name), code: content },
        ])
      }
      reader.readAsText(file)
    })
  }

  const removeCodeFile = (index: number) => {
    setCodeFiles(codeFiles.filter((_, i) => i !== index))
  }

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      editor.chain().focus().setImage({ src: base64 }).run()
    }
    reader.readAsDataURL(file)
  }, [editor])

  const insertLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setShowLinkModal(false)
    }
  }

  const insertImage = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl('')
      setShowImageModal(false)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim() || !editor || !postId) return
    setIsSubmitting(true)
    const content = editor.getHTML()
    const excerpt = editor.getText().slice(0, 200) + (editor.getText().length > 200 ? '...' : '')

    const { data, error } = await api.posts.update(postId, {
      title,
      excerpt,
      content,
      coverImage: coverImage || undefined,
      technologies,
      files: codeFiles,
    })

    if (error) {
      alert('Failed to update post: ' + error)
      setIsSubmitting(false)
      return
    }

    if (data) {
      navigate(`/post/${data.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full" />
      </div>
    )
  }

  if (!editor) return null


  return (
    <div className="min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-gray-400 focus:outline-none text-lg"
            />
          </motion.div>

          {/* Editor */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
            <div className="flex flex-wrap items-center gap-1 p-3 border-b border-gray-200 bg-gray-50/50">
              <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={18} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={18} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon size={18} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={18} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter size={18} /></ToolbarButton>
              <Divider />
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={18} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={18} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={18} /></ToolbarButton>
              <Divider />
              <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List size={18} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={18} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote"><Quote size={18} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block"><Code size={18} /></ToolbarButton>
              <Divider />
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={18} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={18} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={18} /></ToolbarButton>
              <Divider />
              <ToolbarButton onClick={() => setShowLinkModal(true)} active={editor.isActive('link')} title="Insert Link"><LinkIcon size={18} /></ToolbarButton>
              <ToolbarButton onClick={() => setShowImageModal(true)} title="Insert Image"><ImageIcon size={18} /></ToolbarButton>
              <Divider />
              <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={18} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={18} /></ToolbarButton>
            </div>
            <EditorContent editor={editor} />
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cover Image */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image URL</label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 focus:border-gray-400 focus:outline-none text-sm"
            />
            {coverImage && <img src={coverImage} alt="Cover" className="mt-3 rounded-xl w-full h-32 object-cover" />}
          </motion.div>

          {/* Technologies */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Technologies</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
                placeholder="Add tech..."
                className="flex-1 px-3 py-2 bg-white rounded-xl border border-gray-200 focus:border-gray-400 focus:outline-none text-sm"
              />
              <button onClick={addTech} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech) => (
                <div key={tech} className="flex items-center gap-1">
                  <TechTag tech={tech} size="sm" />
                  <button onClick={() => removeTech(tech)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Code Files */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Code Files</label>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept=".js,.ts,.tsx,.jsx,.py,.css,.html,.json,.md" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors">
              <Upload size={18} /> Upload Files
            </button>
            {codeFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {codeFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2"><File size={16} className="text-gray-500" /><span className="text-sm">{file.name}</span></div>
                    <button onClick={() => removeCodeFile(i)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Submit */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
          </motion.button>
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLinkModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-2 border rounded-xl mb-4" autoFocus />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowLinkModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={insertLink} className="px-4 py-2 bg-gray-900 text-white rounded-xl">Insert</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Insert Image</h3>
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL..." className="w-full px-4 py-2 border rounded-xl mb-3" autoFocus />
            <div className="text-center text-gray-400 text-sm mb-3">or</div>
            <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <button onClick={() => imageInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-xl text-gray-600 hover:border-gray-400 mb-4">
              <Upload size={18} /> Upload from device
            </button>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowImageModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={insertImage} disabled={!imageUrl} className="px-4 py-2 bg-gray-900 text-white rounded-xl disabled:opacity-50">Insert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditPost
