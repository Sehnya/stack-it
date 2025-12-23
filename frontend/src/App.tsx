import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Community from './pages/Community'
import Favorites from './pages/Favorites'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Post from './pages/Post'
import CreatePost from './pages/CreatePost'
import Admin from './pages/Admin'

// Placeholder pages
const Settings = () => <div className="text-gray-800 text-2xl">Settings</div>

// Loading spinner
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-8 h-8 border-3 border-gray-300 border-t-gray-900 rounded-full"
    />
  </div>
)

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public route - redirects to dashboard if authenticated
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Authenticated layout with sidebar
const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth()
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  const sidebarUser = user
    ? {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`,
        isOnline: true,
        isAdmin: user.role === 'admin',
      }
    : null

  return (
    <div className="flex min-h-screen bg-[#e5e7eb]">
      <Sidebar
        user={sidebarUser}
        onLogout={logout}
        isExpanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
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
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Community />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorites/*"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Favorites />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-post"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <CreatePost />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Settings />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Admin />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/post/:postId"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Post />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
