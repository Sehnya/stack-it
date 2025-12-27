import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import {
  Bold, Italic, Underline as UnderlineIcon, Code, List, ListOrdered,
  Quote, Undo, Redo, Link as LinkIcon, ArrowLeft, Send, X,
  HelpCircle, Sparkles, MessageCircle, MessageSquare,
} from 'lucide-react'
import { TechVersionInput, techsToStrings } from '../components/TechVersionInput'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const lowlight = createLowlight(common)

const categories = [
  { id: 'help', name: 'Help', icon: HelpCircle, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  { id: 'showcase', name: 'Showcase', icon: Sparkles, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
  { id: 'feedback', name: 'Feedback', icon: MessageCircle, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  { id: 'general', name: 'General', icon: MessageSquare, color: 'bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400' },
]

const MenuButton = ({ onClick, isActive = false, disabled = false, title, children }: {
  onClick: () => void; isActive?: boolean; disabled?: boolean; title: string; children: React.ReactNode
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-all ${isActive ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333]'} ${disabled ? 'opacity-40' : ''}`}
  >
    {children}
  </button>
)

const CreateDiscussion = () => {
  const navigate = useNavigate()
  useAuth()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('general')
  const [tags, setTags] = useState<{ name: string; version?: string }[]>([])
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline' } }),
      Placeholder.configure({ placeholder: 'Describe your question or topic in detail...' }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: '',
    editorProps: {
      attributes: { class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] p-4' },
    },
  })

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setShowLinkModal(false)
    }
  }, [editor, linkUrl])

  const handleSubmit = async () => {
    if (!title.trim()) return alert('Please add a title')
    if (!editor) return

    setIsSubmitting(true)
    const content = editor.getHTML()

    const { data, error } = await api.discussions.create({
      title: title.trim(),
      content,
      category,
      tags: techsToStrings(tags),
    })

    setIsSubmitting(false)

    if (data && !error) {
      navigate(`/community`)
    } else {
      alert(error || 'Failed to create discussion')
    }
  }

  if (!editor) return null

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/community')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft size={20} /> Back to Community
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
        >
          <Send size={18} /> {isSubmitting ? 'Posting...' : 'Post Discussion'}
        </button>
      </motion.div>

      {/* Category Selection */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                  category === cat.id
                    ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'border-gray-200 dark:border-[#333] hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Icon size={16} />
                {cat.name}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
        <input
          type="text"
          placeholder="What's your question or topic?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-bold bg-transparent border-0 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
        />
      </motion.div>

      {/* Tags */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Related Technologies</label>
        <TechVersionInput
          technologies={tags}
          onChange={setTags}
          placeholder="Add technology (press Enter)..."
          maxTags={10}
        />
      </motion.div>

      {/* Editor */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-3 border-b border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#252525]">
          <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={18} /></MenuButton>
          <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={18} /></MenuButton>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><Bold size={18} /></MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><Italic size={18} /></MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline"><UnderlineIcon size={18} /></MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Code"><Code size={18} /></MenuButton>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List"><List size={18} /></MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={18} /></MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote"><Quote size={18} /></MenuButton>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <MenuButton onClick={() => setShowLinkModal(true)} isActive={editor.isActive('link')} title="Link"><LinkIcon size={18} /></MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block"><Code size={18} /></MenuButton>
        </div>

        {/* Editor Content */}
        <EditorContent editor={editor} className="dark:text-gray-100" />
      </motion.div>

      {/* Tips */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Tips for a great discussion</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Be specific about your question or topic</li>
          <li>• Include relevant code snippets or error messages</li>
          <li>• Tag related technologies so others can find it</li>
          <li>• Check if a similar discussion already exists</li>
        </ul>
      </motion.div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLinkModal(false)}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-96 border border-gray-200 dark:border-[#333]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Add Link</h3>
              <button onClick={() => setShowLinkModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><X size={20} /></button>
            </div>
            <input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-xl mb-4 bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setShowLinkModal(false)} className="flex-1 py-2 border border-gray-200 dark:border-[#333] rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]">Cancel</button>
              <button onClick={addLink} className="flex-1 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200">Add Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateDiscussion
