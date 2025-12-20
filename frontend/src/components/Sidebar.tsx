import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  Users,
  Heart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
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

  const navItems = [
    { icon: Home, path: '/dashboard', label: 'Home' },
    { icon: Users, path: '/community', label: 'Community' },
    { icon: Heart, path: '/favorites', label: 'Favorites' },
    { icon: Settings, path: '/settings', label: 'Settings' },
  ]

  const isActive = (path: string) => location.pathname === path

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
