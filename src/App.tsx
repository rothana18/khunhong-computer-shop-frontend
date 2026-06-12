import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthProvider'
import { CartProvider } from '@/context/CartProvider'
import { router } from '@/routes'

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  )
}

export default App
