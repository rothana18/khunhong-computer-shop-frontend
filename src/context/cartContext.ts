import { createContext } from 'react'
import type { CartItem } from '@/types'

export interface CartContextValue {
  items: CartItem[]
  /** Add a product to the cart by ID. Fresh product data is fetched at checkout. */
  addItem: (productId: number, quantity?: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  itemCount: number
}

export const CartContext = createContext<CartContextValue | null>(null)
