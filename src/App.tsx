import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ComprehensiveDashboard from './pages/ComprehensiveDashboard'
import Chat from './pages/Chat'
import Files from './pages/Files'
import Login from './pages/Login'
import Register from './pages/Register'
import MagicLinkRegister from './pages/MagicLinkRegister'
import MagicLinkSetPassword from './pages/MagicLinkSetPassword'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import UserManagement from './pages/UserManagement'
import QAManagement from './pages/QAManagement'
import Profile from './pages/Profile'
import { useAuth } from './hooks/useAuth'
import { ChatProvider } from './contexts/ChatContext'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// Layout Component for all users
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Removed ClientInfoModal logic - modal disabled for all users
  return (
    <ChatProvider>
      <Layout>{children}</Layout>
    </ChatProvider>
  )
}

function App() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/magic-link-register" element={<MagicLinkRegister />} />
      <Route path="/magic-link/set-password" element={<MagicLinkSetPassword />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to={isAdmin ? "/dashboard" : "/chat"} replace />} />
                {isAdmin && <Route path="/dashboard" element={<ComprehensiveDashboard />} />}
                <Route 
                  path="/chat" 
                  element={<Chat />} 
                />
                <Route 
                  path="/chat/:conversationId" 
                  element={<Chat />} 
                />
                <Route 
                  path="/profile" 
                  element={<Profile />} 
                />
                <Route path="/files" element={<Files />} />
                {isAdmin && <Route path="/users" element={<UserManagement />} />}
                {isAdmin && <Route path="/qa-management" element={<QAManagement />} />}
                {/* Redirect non-admin users away from admin-only routes */}
                {!isAdmin && <Route path="/dashboard" element={<Navigate to="/chat" replace />} />}
                {!isAdmin && <Route path="/files" element={<Navigate to="/chat" replace />} />}
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App