import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'

const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-dvh flex-col bg-stone-100">
      <Navbar />
      <main className="flex-grow py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainLayout
