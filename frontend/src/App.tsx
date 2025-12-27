import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useState, lazy, Suspense } from 'react'
import Sidebar from './components/Sidebar'

// Eagerly loaded pages (critical path)
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'

// Lazy loaded pages (code-split)
const Community = lazy(() => import('./pages/Community'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Post = lazy(() => import('./pages/Post'))
const CreatePost = lazy(() => import('./pages/CreatePost'))
const CreateSnippet = lazy(() => import('./pages/CreateSnippet'))
const CreateDiscussion = lazy(() => import('./pages/CreateDiscussion'))
const Discussion = lazy(() => import('./pages/Discussion'))
const EditPost = lazy(() => import('./pages/EditPost'))
const Admin = lazy(() => import('./pages/Admin'))
const Settings = lazy(() => import('./pages/Settings'))
const Profile = lazy(() => import('./pages/Profile'))
const Tech = lazy(() => import('./pages/Tech'))

// Loading spinner
const LoadingScreen = () => (
  <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-8 h-8 border-3 border-gray-300 dark:border-[#333] border-t-gray-900 dark:border-t-gray-100 rounded-full"
    />
  </div>
)

// Page loading fallback (lighter than full screen)
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin" />
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
    <div className="flex min-h-screen bg-[var(--color-bg-primary)]">
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
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
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
        path="/create-discussion"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <CreateDiscussion />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-snippet"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <CreateSnippet />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-post/:postId"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <EditPost />
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
      <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Profile />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tech/:techName"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Tech />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/discussion/:discussionId"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Discussion />
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
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
