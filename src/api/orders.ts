import api from '@/api'
import type {
  ApiResponse,
  Order,
  OrderStatus,
  PaginatedApiResponse,
  PaymentMethod,
  ShippingMethod,
} from '@/types'

export interface OrderListParams {
  page?: number
  per_page?: number
  search?: string
  status?: OrderStatus
  date?: string
}

export interface CreateOrderData {
  items: { product_id: number; quantity: number }[]
  address_id: number
  payment_method: PaymentMethod
  shipping_method: ShippingMethod
  order_notes?: string
}

export const ordersApi = {
  list: (params?: OrderListParams) => api.get<PaginatedApiResponse<Order>>('/orders', { params }),

  getStatuses: () => api.get<ApiResponse<Record<string, string>>>('/orders/statuses'),

  getById: (id: number) => api.get<ApiResponse<Order>>(`/orders/${id}`),

  create: (data: CreateOrderData) => api.post<ApiResponse<Order>>('/orders', data),

  checkout: (data: Omit<CreateOrderData, 'items'>) =>
    api.post<ApiResponse<Order>>('/checkout', data),

  update: (id: number, data: { customer_phone?: string; order_notes?: string }) =>
    api.put<ApiResponse<Order>>(`/orders/${id}`, data),

  cancel: (id: number) => api.post<ApiResponse<Order>>(`/orders/${id}/cancel`),
}
