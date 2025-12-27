import { useState, useEffect } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Heart, Eye, MessageSquare, CheckCircle, HelpCircle, 
  Sparkles, MessageCircle, Code2, Layers, Users, UserPlus, UserMinus
} from 'lucide-react'
import { api, Post, Discussion, Snippet, FollowUser } from '../lib/api'
import { TechTag, getTechIconUrl } from '../components/TechTag'
import { SnippetCard } from '../components/SnippetCard'
import { useAuth } from '../context/AuthContext'

interface UserProfile {
  id: number
  username: string
  profilePhoto?: string
  bio?: string
  createdAt: string
  isFollowing?: boolean
  _count: {
    posts: number
    favorites: number
    followers: number
    following: number
  }
}

const categoryStyles: Record<string, { bg: string; text: string; icon: typeof HelpCircle }> = {
  help: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: HelpCircle },
  showcase: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', icon: Sparkles },
  feedback: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: MessageCircle },
  general: { bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-gray-700 dark:text-gray-400', icon: MessageSquare },
}

const Profile = () => {
  const { userId } = useParams<{ userId: string }>()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'stacks' | 'snippets' | 'discussions' | 'followers'>('stacks')
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return
      setLoading(true)

      const [profileRes, postsRes, snippetsRes, discussionsRes, followersRes, followingRes] = await Promise.all([
        api.users.getById(userId),
        api.users.getPosts(userId),
        api.snippets.getByUser(userId),
        api.discussions.getByUser(userId),
        api.users.getFollowers(userId),
        api.users.getFollowing(userId),
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
      if (snippetsRes.data) setSnippets(snippetsRes.data)
      if (discussionsRes.data) setDiscussions(discussionsRes.data)
      if (followersRes.data) setFollowers(followersRes.data)
      if (followingRes.data) setFollowing(followingRes.data)

      setLoading(false)
    }
    fetchProfile()
  }, [userId])

  const handleFollow = async () => {
    if (!userId || !currentUser || followLoading) return
    setFollowLoading(true)
    
    const res = await api.users.follow(userId)
    if (res.data) {
      setProfile(prev => prev ? {
        ...prev,
        isFollowing: res.data!.following,
        _count: {
          ...prev._count,
          followers: prev._count.followers + (res.data!.following ? 1 : -1)
        }
      } : null)
    }
    setFollowLoading(false)
  }

  const formatCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
    return count.toString()
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-gray-100 rounded-full mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">User Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">This user doesn't exist.</p>
          <NavLink to="/community" className="text-gray-900 dark:text-gray-100 hover:underline">
            Back to Community
          </NavLink>
        </div>
      </div>
    )
  }

  const avatar = profile.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`
  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
        <NavLink to="/community" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
          <ArrowLeft size={20} />
          <span>Back to Community</span>
        </NavLink>
      </motion.div>

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] overflow-hidden mb-6">
        {/* Colorful Header Banner */}
        <div className="h-32 relative overflow-hidden">
          <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a5f3fc" />
                <stop offset="50%" stopColor="#fda4af" />
                <stop offset="100%" stopColor="#fde68a" />
              </linearGradient>
            </defs>
            <rect fill="url(#grad1)" width="800" height="200" />
            <ellipse cx="150" cy="100" rx="200" ry="150" fill="#67e8f9" opacity="0.6" />
            <ellipse cx="650" cy="80" rx="180" ry="120" fill="#fcd34d" opacity="0.5" />
            <ellipse cx="400" cy="180" rx="250" ry="100" fill="#f9a8d4" opacity="0.4" />
            <path d="M0,150 Q200,50 400,120 T800,100" stroke="#1e293b" strokeWidth="3" fill="none" opacity="0.3" />
            <path d="M0,180 Q300,100 500,150 T800,130" stroke="#1e293b" strokeWidth="2" fill="none" opacity="0.2" />
          </svg>
        </div>

        {/* Avatar & Stats Row */}
        <div className="px-6 pb-6 relative">
          <div className="flex items-end gap-6 -mt-12">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-[#1a1a1a] bg-gradient-to-br from-pink-200 to-purple-200 p-0.5">
                <img src={avatar} alt={profile.username} className="w-full h-full rounded-full object-cover bg-white dark:bg-[#252525]" loading="lazy" />
              </div>
            </div>

            {/* Followers/Following Stats */}
            <div className="flex items-center gap-6 pb-2">
              <button
                onClick={() => setActiveTab('followers')}
                className="text-center hover:opacity-70 transition-opacity"
              >
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCount(profile._count.followers)}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">Followers</span>
              </button>
              <button
                onClick={() => setActiveTab('followers')}
                className="text-center hover:opacity-70 transition-opacity"
              >
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCount(profile._count.following)}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">Following</span>
              </button>
            </div>

            {/* Follow Button */}
            {!isOwnProfile && currentUser && (
              <div className="ml-auto pb-2">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium transition-all ${
                    profile.isFollowing
                      ? 'bg-gray-100 dark:bg-gray-100 text-gray-700 dark:text-gray-900 hover:bg-red-50 dark:hover:bg-red-100 hover:text-red-600 dark:hover:text-red-600'
                      : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200'
                  }`}
                >
                  {followLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : profile.isFollowing ? (
                    <>
                      <UserMinus size={16} />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Username & Bio */}
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.username}</h1>
            {profile.bio && (
              <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-xl">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-100 dark:border-[#333]">
          <div className="flex">
            {[
              { key: 'stacks', label: 'Stacks', icon: Layers, count: profile._count.posts },
              { key: 'snippets', label: 'Snippets', icon: Code2, count: snippets.length },
              { key: 'discussions', label: 'Discussions', icon: MessageSquare, count: discussions.length },
              { key: 'followers', label: 'Followers', icon: Users, count: profile._count.followers },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.count > 0 && (
                  <span className="text-xs bg-gray-100 dark:bg-[#252525] px-1.5 py-0.5 rounded-full">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {/* Stacks Tab */}
        {activeTab === 'stacks' && (
          posts.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] p-12 text-center">
              <Layers size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No stacks shared yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] overflow-hidden hover:shadow-lg transition-all group"
                >
                  <NavLink to={`/post/${post.id}`}>
                    <div className="h-36 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 dark:from-[#252525] dark:to-[#1a1a1a]">
                      {post.coverImage ? (
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Layers size={32} className="text-gray-300 dark:text-gray-600" />
                        </div>
                      )}
                    </div>
                  </NavLink>
                  <div className="p-4">
                    <NavLink to={`/post/${post.id}`}>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 mb-2 line-clamp-1">{post.title}</h3>
                    </NavLink>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{post.excerpt}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.technologies.slice(0, 3).map((tech) => (
                        <TechTag key={tech} tech={tech} size="sm" />
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1"><Heart size={14} /> {post.favorites}</span>
                      <span className="flex items-center gap-1"><Eye size={14} /> {post.viewCount}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}

        {/* Snippets Tab */}
        {activeTab === 'snippets' && (
          snippets.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] p-12 text-center">
              <Code2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No snippets shared yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {snippets.map((snippet) => (
                <SnippetCard 
                  key={snippet.id} 
                  snippet={snippet}
                  onUpdate={(updated) => setSnippets(prev => prev.map(s => s.id === updated.id ? updated : s))}
                />
              ))}
            </div>
          )
        )}

        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          discussions.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] p-12 text-center">
              <MessageSquare size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No discussions started yet</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-[#333]">
                {discussions.map((discussion, index) => {
                  const catStyle = categoryStyles[discussion.category] || categoryStyles.general
                  const CatIcon = catStyle.icon
                  return (
                    <motion.div
                      key={discussion.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                    >
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${catStyle.bg} ${catStyle.text}`}>
                        <CatIcon size={10} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {discussion.resolved && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-[10px] font-semibold">
                              <CheckCircle size={10} /> Resolved
                            </span>
                          )}
                          <NavLink to={`/discussion/${discussion.id}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1">
                            {discussion.title}
                          </NavLink>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {discussion.tags.slice(0, 4).map(tag => {
                            const icon = getTechIconUrl(tag)
                            return (
                              <NavLink key={tag} to={`/tech/${encodeURIComponent(tag)}`} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333]">
                                {icon && <img src={icon} alt="" className="w-3 h-3" loading="lazy" />}
                                #{tag}
                              </NavLink>
                            )
                          })}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>{timeAgo(discussion.createdAt)}</span>
                          <span className="flex items-center gap-1"><MessageSquare size={12} /> {discussion.replies}</span>
                          <span className="flex items-center gap-1"><Eye size={12} /> {discussion.viewCount}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )
        )}

        {/* Followers Tab */}
        {activeTab === 'followers' && (
          <div className="space-y-4">
            {/* Sub-tabs for Followers/Following */}
            <div className="flex gap-4 mb-4">
              <button className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-gray-100 pb-1">
                Followers ({followers.length})
              </button>
              <button
                onClick={() => {}}
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 pb-1"
              >
                Following ({following.length})
              </button>
            </div>

            {followers.length === 0 ? (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] p-12 text-center">
                <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No followers yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {followers.map((follower, index) => (
                  <motion.div
                    key={follower.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] p-4 hover:shadow-md transition-all"
                  >
                    <NavLink to={`/profile/${follower.id}`} className="flex items-center gap-3">
                      <img src={follower.avatar} alt={follower.username} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{follower.username}</h4>
                        {follower.bio && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{follower.bio}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-1">
                          <span>{follower.posts} stacks</span>
                          <span>{follower.followers} followers</span>
                        </div>
                      </div>
                    </NavLink>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Profile
