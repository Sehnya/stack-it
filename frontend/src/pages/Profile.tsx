import { useState, useEffect } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, FileCode, Heart, Eye } from 'lucide-react'
import { api, Post } from '../lib/api'
import { TechTag } from '../components/TechTag'

interface UserProfile {
  id: number
  username: string
  profilePhoto?: string
  createdAt: string
  _count: {
    posts: number
    favorites: number
  }
}

const Profile = () => {
  const { userId } = useParams<{ userId: string }>()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return
      setLoading(true)

      const [profileRes, postsRes] = await Promise.all([
        api.users.getById(userId),
        api.users.getPosts(userId),
      ])

      if (profileRes.data?.user) {
        setProfile(profileRes.data.user)
      }
      if (postsRes.data?.posts) {
        setPosts(postsRes.data.posts.map((p: any) => ({
          ...p,
          id: String(p.id),
          technologies: JSON.parse(p.technologies || '[]'),
          author: {
            id: String(p.author.id),
            username: p.author.username,
            avatar: p.author.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${p.author.username}`,
          },
          files: p.files || [],
          likes: p._count?.favorites || 0,
          favorites: p._count?.favorites || 0,
        })))
      }

      setLoading(false)
    }
    fetchProfile()
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
          <p className="text-gray-600 mb-4">This user doesn't exist.</p>
          <NavLink to="/community" className="text-gray-900 hover:underline">
            Back to Community
          </NavLink>
        </div>
      </div>
    )
  }

  const avatar = profile.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`
  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <NavLink
          to="/community"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Community</span>
        </NavLink>
      </motion.div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden mb-6"
      >
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 h-32" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12">
            <img
              src={avatar}
              alt={profile.username}
              className="w-24 h-24 rounded-2xl border-4 border-white object-cover"
            />
            <div className="pb-2">
              <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
              <p className="text-gray-500 text-sm flex items-center gap-1">
                <Calendar size={14} />
                Joined {joinDate}
              </p>
            </div>
          </div>

          <div className="flex gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{profile._count.posts}</div>
              <div className="text-sm text-gray-500">Stacks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{profile._count.favorites}</div>
              <div className="text-sm text-gray-500">Favorites</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* User's Posts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileCode size={20} />
          Stacks by {profile.username}
        </h2>

        {posts.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 text-center">
            <FileCode size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No stacks shared yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden hover:shadow-lg transition-all"
              >
                {post.coverImage && (
                  <NavLink to={`/post/${post.id}`}>
                    <div className="h-36 overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </NavLink>
                )}
                <div className="p-4">
                  <NavLink to={`/post/${post.id}`}>
                    <h3 className="font-semibold text-gray-900 hover:text-gray-700 mb-2 line-clamp-1">
                      {post.title}
                    </h3>
                  </NavLink>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.excerpt}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.technologies.slice(0, 3).map((tech) => (
                      <TechTag key={tech} tech={tech} size="sm" />
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Heart size={14} /> {post.favorites}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={14} /> {post.viewCount}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Profile
