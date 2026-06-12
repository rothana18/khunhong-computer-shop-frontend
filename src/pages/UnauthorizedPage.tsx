import React from 'react'
import { Link } from 'react-router-dom'
import { FiLock } from 'react-icons/fi'
import { usePageTitle } from '@/hooks/usePageTitle'

const UnauthorizedPage: React.FC = () => {
  usePageTitle('Access Denied')
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 overflow-y-auto text-center">
      <FiLock className="h-16 w-16 text-gray-300" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
      <p className="text-sm text-gray-500">You don&apos;t have permission to view this page.</p>
      <Link
        to="/"
        className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
      >
        Go home
      </Link>
    </div>
  )
}

export default UnauthorizedPage
