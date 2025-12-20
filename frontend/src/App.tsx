import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Community from './pages/Community'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'

// Placeholder pages
const Favorites = () => (
  <div className="text-gray-800 text-2xl">Favorites</div>
)
const CreatePost = () => (
  <div className="text-gray-800 text-2xl">Create Post</div>
)
const Settings = () => <div className="text-gray-800 text-2xl">Settings</div>
const Admin = () => <div className="text-gray-800 text-2xl">Admin Panel</div>

// Protected Route wrapper
const ProtectedRoute = ({
  children,
  isAuthenticated,
}: {
  children: React.ReactNode
  isAuthenticated: boolean
}) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{
    id: number
    username: string
    email: string
    avatar: string
    isOnline: boolean
    isAdmin: boolean
  } | null>(null)

  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  const handleLogin = () => {
    setIsAuthenticated(true)
    setUser({
      id: 1,
      username: 'Todd Smith',
      email: 'todd@example.com',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      isOnline: true,
      isAdmin: true,
    })
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
  }

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded)
  }

  // Authenticated layout with sidebar
  const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen bg-[#e5e7eb]">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isExpanded={sidebarExpanded}
        onToggle={toggleSidebar}
      />
      <motion.main
        className="flex-1 p-8"
        initial={false}
        animate={{
          marginLeft: sidebarExpanded ? 280 : 80,
        }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.main>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register onRegister={handleLogin} />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AuthenticatedLayout>
                <Community />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites/*"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AuthenticatedLayout>
                <Favorites />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-post"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AuthenticatedLayout>
                <CreatePost />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AuthenticatedLayout>
                <Settings />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AuthenticatedLayout>
                <Admin />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
