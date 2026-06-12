import React from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'

const NotFoundPage: React.FC = () => {
  usePageTitle('Page Not Found')
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 overflow-y-auto text-center">
      <p className="text-6xl font-extrabold text-primary-600">404</p>
      <h1 className="text-2xl font-bold text-gray-800">Page not found</h1>
      <p className="text-sm text-gray-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        to="/"
        className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
      >
        Go home
      </Link>
    </div>
  )
}

export default NotFoundPage
