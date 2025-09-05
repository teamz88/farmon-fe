import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ComprehensiveDashboard from './pages/ComprehensiveDashboard'
import Chat from './pages/Chat'
import Files from './pages/Files'
import Login from './pages/Login'
import Register from './pages/Register'
import UserManagement from './pages/UserManagement'
import Profile from './pages/Profile'
import ClientInfoModal from './components/ClientInfoModal'
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
  const { user, checkClientInfoStatus } = useAuth()
  const [showClientInfoModal, setShowClientInfoModal] = useState(false)
  const [isCheckingClientInfo, setIsCheckingClientInfo] = useState(true)

  useEffect(() => {
    const checkClientInfo = async () => {
      if (user) {
        try {
          // Skip company info modal for admin users
          if (user.role === 'admin') {
            setIsCheckingClientInfo(false)
            return
          }

          // Check if user has skipped the modal in this session
          const hasSkippedModal = sessionStorage.getItem(`client_info_skipped_${user.id}`)
          
          if (hasSkippedModal) {
            setIsCheckingClientInfo(false)
            return
          }

          const status = await checkClientInfoStatus()
          // Show modal only if user doesn't have client info or it's not completed
          if (!status.has_client_info || !status.is_completed) {
            setShowClientInfoModal(true)
          }
        } catch (error) {
          console.error('Error checking client info status:', error)
        } finally {
          setIsCheckingClientInfo(false)
        }
      } else {
        setIsCheckingClientInfo(false)
      }
    }

    checkClientInfo()
  }, [user, checkClientInfoStatus])

  const handleClientInfoComplete = () => {
    setShowClientInfoModal(false)
    // Clear the skip flag when user completes the form
    if (user) {
      sessionStorage.removeItem(`client_info_skipped_${user.id}`)
    }
  }

  const handleClientInfoClose = () => {
    setShowClientInfoModal(false)
    // Mark as skipped for this session
    if (user) {
      sessionStorage.setItem(`client_info_skipped_${user.id}`, 'true')
    }
  }

  if (isCheckingClientInfo) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ChatProvider>
      <Layout>{children}</Layout>
      <ClientInfoModal
        isOpen={showClientInfoModal}
        onClose={handleClientInfoClose}
        onComplete={handleClientInfoComplete}
      />
    </ChatProvider>
  )
}

function App() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
                  path="/profile" 
                  element={<Profile />} 
                />
                {isAdmin && <Route path="/files" element={<Files />} />}
                {isAdmin && <Route path="/users" element={<UserManagement />} />}
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