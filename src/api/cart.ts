import api from '@/api'
import type { ApiResponse } from '@/types'

export const cartApi = {
  sync: (items: { product_id: number; quantity: number }[]) =>
    api.patch<ApiResponse<null>>('/cart/sync', { items }),
}
