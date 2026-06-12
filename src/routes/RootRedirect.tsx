import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Loading from '@/components/common/Loading'
import HomePage from '@/pages/HomePage'

const RootRedirect: React.FC = () => {
  const { state } = useAuth()

  if (state.loading) return <Loading fullPage />

  const role = state.user?.role
  if (role === 'admin' || role === 'staff') return <Navigate to="/admin" replace />

  return <HomePage />
}

export default RootRedirect
