import { useState } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Code2, Save } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { getTechIconUrl, getTechColor } from '../components/TechTag'
import { TechVersionInput, techsToStrings } from '../components/TechVersionInput'

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'rust', 'go', 'java', 'c', 'cpp', 
  'csharp', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css', 'sql', 'bash', 'json'
]

const CreateSnippet = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [tags, setTags] = useState<{ name: string; version?: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Code2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Sign in to share snippets</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">You need to be logged in to create snippets.</p>
        <NavLink to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Sign in</NavLink>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!code.trim()) {
      setError('Code is required')
      return
    }

    setSaving(true)
    const res = await api.snippets.create({
      title: title.trim(),
      description: description.trim() || undefined,
      code: code.trim(),
      language,
      tags: techsToStrings(tags),
    })

    if (res.error) {
      setError(res.error)
      setSaving(false)
      return
    }

    navigate('/community')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <NavLink
          to="/community"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Community</span>
        </NavLink>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#333] flex items-center gap-3">
          <Code2 size={24} className="text-gray-700 dark:text-gray-300" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Share a Code Snippet</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., React useDebounce hook"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description <span className="text-gray-400 dark:text-gray-500">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this snippet does..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 resize-none bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              maxLength={500}
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const icon = getTechIconUrl(lang)
                const colors = getTechColor(lang)
                const isSelected = language === lang
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'ring-2 ring-gray-900 dark:ring-gray-100 ring-offset-1 dark:ring-offset-[#1a1a1a]'
                        : 'hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-700 dark:text-gray-300'
                    }`}
                    style={isSelected ? {
                      backgroundColor: colors.bg + '20',
                      color: colors.bg,
                    } : {}}
                  >
                    {icon && <img src={icon} alt="" className="w-4 h-4" />}
                    {lang}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Code <span className="text-red-500">*</span>
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              rows={12}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 font-mono text-sm"
              style={{ backgroundColor: '#282a36', color: '#f8f8f2' }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags <span className="text-gray-400 dark:text-gray-500">(up to 5)</span>
            </label>
            <TechVersionInput
              technologies={tags}
              onChange={setTags}
              placeholder="Add a tag (e.g., react, hooks)"
              maxTags={5}
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#333]">
            <NavLink
              to="/community"
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Cancel
            </NavLink>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Share Snippet'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default CreateSnippet
