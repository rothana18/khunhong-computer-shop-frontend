import React, { useCallback, useEffect, useState } from 'react'
import type { CartItem } from '@/types'
import { CartContext } from './cartContext'

const STORAGE_KEY = 'khunhong_cart'

/**
 * Migrates legacy cart entries that stored a full `product` object to the slim
 * `{ productId, quantity }` shape. Safe to remove after one release cycle.
 */
function migrateItems(raw: unknown[]): CartItem[] {
  return raw
    .map((item) => {
      const i = item as Record<string, unknown>
      if (typeof i.productId === 'number') return i as unknown as CartItem
      // Legacy shape: { product: { id: number }, quantity: number }
      const legacyId = (i.product as Record<string, unknown> | undefined)?.id
      if (typeof legacyId === 'number')
        return { productId: legacyId, quantity: Number(i.quantity) || 1 }
      return null
    })
    .filter(Boolean) as CartItem[]
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? migrateItems(parsed) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((productId: number, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [...prev, { productId, quantity }]
    })
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) =>
      quantity < 1
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, clearCart, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}
