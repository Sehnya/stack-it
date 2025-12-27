import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  Home,
  Users,
  Heart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PenSquare,
  Hash,
  ChevronDown,
  UserCheck,
} from 'lucide-react'
import { api, PinnedTech, FollowingFeedUser } from '../lib/api'
import { getTechColor, getTechIconUrl } from './TechTag'
import './Sidebar.css'

interface User {
  id: number
  username: string
  email: string
  avatar?: string
  isOnline?: boolean
  isAdmin?: boolean
}

interface SidebarProps {
  user?: User | null
  onLogout?: () => void
  isExpanded: boolean
  onToggle: () => void
}

const Sidebar = ({ user, onLogout, isExpanded, onToggle }: SidebarProps) => {
  const location = useLocation()
  const [pinnedTechs, setPinnedTechs] = useState<PinnedTech[]>([])
  const [followingUsers, setFollowingUsers] = useState<FollowingFeedUser[]>([])
  const [sectionsExpanded, setSectionsExpanded] = useState(true)
  const [followingExpanded, setFollowingExpanded] = useState(true)

  useEffect(() => {
    const fetchPinnedTechs = async () => {
      const { data, error } = await api.pinnedTech.getAll()
      if (data) {
        setPinnedTechs(data)
      }
      if (error) {
        console.error('Failed to fetch pinned techs:', error)
      }
    }
    fetchPinnedTechs()
    // Refresh every 30 seconds
    const interval = setInterval(fetchPinnedTechs, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch following users with unread counts
  useEffect(() => {
    const fetchFollowing = async () => {
      if (!user) return
      const { data } = await api.users.getFollowingFeed()
      if (data) {
        setFollowingUsers(data)
      }
    }
    fetchFollowing()
    // Refresh every 60 seconds
    const interval = setInterval(fetchFollowing, 60000)
    return () => clearInterval(interval)
  }, [user])

  // Refresh pinned techs when route changes (e.g., after pinning from Tech page)
  useEffect(() => {
    const fetchPinnedTechs = async () => {
      const { data } = await api.pinnedTech.getAll()
      if (data) setPinnedTechs(data)
    }
    fetchPinnedTechs()
  }, [location.pathname])

  // Refresh following when route changes (e.g., after viewing a profile)
  useEffect(() => {
    const fetchFollowing = async () => {
      if (!user) return
      const { data } = await api.users.getFollowingFeed()
      if (data) setFollowingUsers(data)
    }
    fetchFollowing()
  }, [location.pathname, user])

  // Listen for custom event when tech is pinned/unpinned
  useEffect(() => {
    const handlePinnedUpdate = () => {
      api.pinnedTech.getAll().then(({ data }) => {
        if (data) setPinnedTechs(data)
      })
    }
    window.addEventListener('pinnedTechUpdated', handlePinnedUpdate)
    return () => window.removeEventListener('pinnedTechUpdated', handlePinnedUpdate)
  }, [])

  const navItems = [
    { icon: Home, path: '/dashboard', label: 'Home' },
    { icon: Users, path: '/community', label: 'Community' },
    { icon: Heart, path: '/favorites', label: 'Favorites' },
    { icon: PenSquare, path: '/create-post', label: 'Create Post' },
    { icon: Settings, path: '/settings', label: 'Settings' },
  ]

  const isActive = (path: string) => location.pathname === path
  const isTechActive = (tech: string) => 
    location.pathname === `/tech/${encodeURIComponent(tech)}`
  const isProfileActive = (userId: number) =>
    location.pathname === `/profile/${userId}`

  const totalUnread = pinnedTechs.reduce((sum, pt) => sum + pt.unreadCount, 0)
  const totalFollowingUnread = followingUsers.reduce((sum, u) => sum + u.unreadCount, 0)

  const handleTechClick = async (techName: string) => {
    // Mark as read when clicking
    await api.pinnedTech.markAsRead(techName)
    setPinnedTechs(prev => 
      prev.map(pt => pt.techName === techName ? { ...pt, unreadCount: 0 } : pt)
    )
  }

  return (
    <motion.div
      className="sidebar-container"
      initial={false}
      animate={{ width: isExpanded ? 280 : 80 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex h-full relative overflow-hidden">
        {/* Collapsed View - Icon Rail */}
        <motion.aside
          className="sidebar-rail"
          initial={false}
          animate={{
            opacity: isExpanded ? 0 : 1,
            scale: isExpanded ? 0.95 : 1,
            x: isExpanded ? -20 : 0,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            pointerEvents: isExpanded ? 'none' : 'auto',
          }}
        >
          <div className="sidebar-rail-logo">
            <img
              src="/images/black-logo.png"
              alt="Logo"
              className="w-14 h-14 object-contain"
            />
          </div>

          <nav className="sidebar-rail-nav">
            {navItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                className={`sidebar-rail-item ${isActive(item.path) ? 'active' : ''}`}
                title={item.label}
              >
                <item.icon size={22} strokeWidth={1.5} />
              </NavLink>
            ))}
          </nav>

          {/* Following Users - Collapsed */}
          {followingUsers.length > 0 && (
            <div className="sidebar-rail-sections">
              <div className="sidebar-rail-divider" />
              {followingUsers.slice(0, 5).map((followedUser) => (
                <NavLink
                  key={followedUser.id}
                  to={`/profile/${followedUser.id}`}
                  className={`sidebar-rail-item relative ${isProfileActive(followedUser.id) ? 'active' : ''}`}
                  title={followedUser.username}
                >
                  <img
                    src={followedUser.avatar}
                    alt={followedUser.username}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  {followedUser.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {followedUser.unreadCount > 9 ? '9+' : followedUser.unreadCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          )}

          {/* Pinned Sections - Collapsed */}
          {pinnedTechs.length > 0 && (
            <div className="sidebar-rail-sections">
              <div className="sidebar-rail-divider" />
              {pinnedTechs.slice(0, 5).map((pt) => {
                const colors = getTechColor(pt.techName)
                const iconUrl = getTechIconUrl(pt.techName)
                return (
                  <NavLink
                    key={pt.techName}
                    to={`/tech/${encodeURIComponent(pt.techName)}`}
                    onClick={() => handleTechClick(pt.techName)}
                    className={`sidebar-rail-item relative ${isTechActive(pt.techName) ? 'active' : ''}`}
                    title={pt.techName}
                  >
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: colors.bg + '20' }}
                    >
                      {iconUrl ? (
                        <img 
                          src={iconUrl} 
                          alt={pt.techName}
                          className="w-5 h-5"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                            const parent = (e.target as HTMLImageElement).parentElement
                            if (parent) {
                              parent.innerHTML = `<span style="color: ${colors.text}; font-weight: bold; font-size: 12px;">${pt.techName.charAt(0).toUpperCase()}</span>`
                              parent.style.backgroundColor = colors.bg
                            }
                          }}
                        />
                      ) : (
                        <span 
                          className="text-xs font-bold"
                          style={{ color: colors.text, backgroundColor: colors.bg }}
                        >
                          {pt.techName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {pt.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {pt.unreadCount > 9 ? '9+' : pt.unreadCount}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          )}

          {/* Bottom section - Avatar and Logout */}
          <div className="sidebar-rail-bottom">
            <div className="sidebar-rail-avatar">
              <img
                src={user?.avatar || '/images/Ellipse-2.png'}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
              />
            </div>
            <button
              className="sidebar-rail-item"
              onClick={onLogout}
              title="Logout"
            >
              <LogOut size={22} strokeWidth={1.5} />
            </button>
          </div>
        </motion.aside>

        {/* Expanded View - Full Menu Panel */}
        <motion.aside
          className="sidebar-menu-expanded"
          initial={false}
          animate={{
            opacity: isExpanded ? 1 : 0,
            scale: isExpanded ? 1 : 0.95,
            x: isExpanded ? 0 : 20,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{
            pointerEvents: isExpanded ? 'auto' : 'none',
          }}
        >
          <div className="sidebar-menu-header">
            <img
              src="/images/black-logo.png"
              alt="Logo"
              className="w-12 h-12 object-contain"
            />
            <span className="text-lg font-semibold text-gray-900">Stack-it</span>
          </div>

          <nav className="sidebar-menu-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-menu-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <div className="sidebar-menu-item-left">
                  <item.icon size={20} strokeWidth={1.5} />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            ))}
          </nav>

          {/* Following Users - Expanded */}
          {user && (
            <div className="sidebar-menu-sections">
              <button 
                onClick={() => setFollowingExpanded(!followingExpanded)}
                className="sidebar-sections-header"
              >
                <div className="flex items-center gap-2">
                  <UserCheck size={16} strokeWidth={1.5} />
                  <span>Following</span>
                  {totalFollowingUnread > 0 && (
                    <span className="ml-auto mr-2 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
                      {totalFollowingUnread > 99 ? '99+' : totalFollowingUnread}
                    </span>
                  )}
                </div>
                <motion.div
                  animate={{ rotate: followingExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={16} />
                </motion.div>
              </button>
              <AnimatePresence>
                {followingExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {followingUsers.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-gray-400 text-center">
                        Follow developers to see them here
                      </div>
                    ) : (
                      followingUsers.map((followedUser) => (
                        <NavLink
                          key={followedUser.id}
                          to={`/profile/${followedUser.id}`}
                          className={`sidebar-section-item ${isProfileActive(followedUser.id) ? 'active' : ''}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={followedUser.avatar}
                              alt={followedUser.username}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <span className="truncate">{followedUser.username}</span>
                          </div>
                          {followedUser.unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                              {followedUser.unreadCount > 99 ? '99+' : followedUser.unreadCount}
                            </span>
                          )}
                        </NavLink>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Pinned Sections - Expanded */}
          <div className="sidebar-menu-sections">
            <button 
              onClick={() => setSectionsExpanded(!sectionsExpanded)}
              className="sidebar-sections-header"
            >
              <div className="flex items-center gap-2">
                <Hash size={16} strokeWidth={1.5} />
                <span>Sections</span>
                {totalUnread > 0 && (
                  <span className="ml-auto mr-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </div>
              <motion.div
                animate={{ rotate: sectionsExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={16} />
              </motion.div>
            </button>
            <AnimatePresence>
              {sectionsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {pinnedTechs.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-gray-400 text-center">
                      Pin technologies from tech pages to see them here
                    </div>
                  ) : (
                    pinnedTechs.map((pt) => {
                      const colors = getTechColor(pt.techName)
                      const iconUrl = getTechIconUrl(pt.techName)
                      return (
                        <NavLink
                          key={pt.techName}
                          to={`/tech/${encodeURIComponent(pt.techName)}`}
                          onClick={() => handleTechClick(pt.techName)}
                          className={`sidebar-section-item ${isTechActive(pt.techName) ? 'active' : ''}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: colors.bg + '20' }}
                            >
                              {iconUrl ? (
                                <img 
                                  src={iconUrl} 
                                  alt={pt.techName}
                                  className="w-4 h-4"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                              ) : (
                                <span 
                                  className="text-xs font-bold"
                                  style={{ color: colors.bg }}
                                >
                                  {pt.techName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="truncate">{pt.techName}</span>
                          </div>
                          {pt.unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                              {pt.unreadCount > 99 ? '99+' : pt.unreadCount}
                            </span>
                          )}
                        </NavLink>
                      )
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom section - User info and Logout */}
          <div className="sidebar-menu-bottom">
            <div className="sidebar-menu-user">
              <img
                src={user?.avatar || '/images/Ellipse-2.png'}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
              />
              <div className="sidebar-menu-user-info">
                <span className="sidebar-menu-user-name">
                  {user?.username || 'Guest'}
                </span>
                <span className="sidebar-menu-user-email">
                  {user?.email || ''}
                </span>
              </div>
            </div>
            <button className="sidebar-menu-logout" onClick={onLogout}>
              <LogOut size={18} strokeWidth={1.5} />
              <span>Logout</span>
            </button>
          </div>
        </motion.aside>
      </div>

      {/* Toggle Button */}
      <motion.button
        className="sidebar-toggle"
        onClick={onToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ 
          right: isExpanded ? -12 : -12,
        }}
        transition={{ duration: 0.3 }}
      >
        {isExpanded ? (
          <ChevronLeft size={16} strokeWidth={2} />
        ) : (
          <ChevronRight size={16} strokeWidth={2} />
        )}
      </motion.button>
    </motion.div>
  )
}

export default Sidebar
