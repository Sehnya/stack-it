import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Trash2, User, Save, X, Palette } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { ThemeToggle } from '../components/ThemeToggle'

const Settings = () => {
  const { user, refreshUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [username, setUsername] = useState(user?.username || '')
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const currentAvatar = previewUrl || profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      // Convert to base64 for simple storage
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setPreviewUrl(base64)
        setProfilePhoto(base64)
        setUploading(false)
      }
      reader.onerror = () => {
        setMessage({ type: 'error', text: 'Failed to read image' })
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setMessage({ type: 'error', text: 'Failed to process image' })
      setUploading(false)
    }
  }

  const handleDeletePhoto = () => {
    setProfilePhoto('')
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    const { error } = await api.users.updateProfile({
      username: username !== user?.username ? username : undefined,
      profilePhoto: profilePhoto !== user?.profilePhoto ? profilePhoto : undefined,
    })

    if (error) {
      setMessage({ type: 'error', text: error })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully' })
      setPreviewUrl(null)
      await refreshUser()
    }

    setSaving(false)
  }

  const hasChanges = username !== user?.username || profilePhoto !== (user?.profilePhoto || '')

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your account and profile</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#333]/50 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <User size={20} />
          Profile
        </h2>

        {/* Profile Photo */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Profile Photo
          </label>
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={currentAvatar}
                alt="Profile"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-200 dark:border-[#333]"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <Camera size={16} />
                {profilePhoto ? 'Change Photo' : 'Upload Photo'}
              </button>
              {profilePhoto && (
                <button
                  onClick={handleDeletePhoto}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                  Remove Photo
                </button>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                JPG, PNG or GIF. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all text-gray-900 dark:text-gray-100"
            placeholder="Your username"
          />
        </div>

        {/* Email (read-only) */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-3 bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? <Save size={16} /> : <X size={16} />}
            {message.text}
          </motion.div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Appearance Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-[#333]/50 p-6 mt-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <Palette size={20} />
          Appearance
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Theme
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select your preferred color scheme
            </p>
          </div>
          <ThemeToggle variant="dropdown" />
        </div>
      </motion.div>
    </div>
  )
}

export default Settings
