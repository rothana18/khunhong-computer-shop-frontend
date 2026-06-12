import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Loading from '@/components/common/Loading'

interface ProtectedRouteProps {
  roles?: string[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles = [] }) => {
  const { state } = useAuth()
  const location = useLocation()

  if (state.loading) return <Loading size="large" className="h-screen" />

  if (!state.isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  if (roles.length && !roles.some((r) => state.user?.role === r)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
