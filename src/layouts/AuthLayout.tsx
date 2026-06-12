import React from 'react'
import { Outlet } from 'react-router-dom'

const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary-700">Khunhong Computer Shop</h1>
        </div>
        <div className="rounded-lg bg-white px-8 py-10 shadow">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
