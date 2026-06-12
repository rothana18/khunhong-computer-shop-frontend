import api from '@/api'
import type {
  ApiResponse,
  Invoice,
  InvoiceAnalytics,
  PaginatedApiResponse,
  PaymentMethod,
} from '@/types'

export interface InvoiceListParams {
  page?: number
  per_page?: number
  search?: string
  from_date?: string
  to_date?: string
  payment_method?: PaymentMethod
  is_refunded?: boolean
}

export interface GenerateInvoiceData {
  discount_amount?: number
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  shipping_address?: string
}

export const invoicesApi = {
  analyticsSummary: (from_date?: string, to_date?: string) =>
    api.get<ApiResponse<InvoiceAnalytics>>('/invoices/analytics/summary', {
      params: { from_date, to_date },
    }),

  list: (params?: InvoiceListParams) =>
    api.get<PaginatedApiResponse<Invoice>>('/invoices', { params }),

  getById: (id: number) => api.get<ApiResponse<Invoice>>(`/invoices/${id}`),

  generate: (orderId: number, data?: GenerateInvoiceData) =>
    api.post<ApiResponse<Invoice>>(`/invoices/order/${orderId}`, data),

  void: (id: number, data: { reason: string; restore_stock?: boolean }) =>
    api.post<ApiResponse<null>>(`/invoices/${id}/void`, {
      reason: data.reason,
      restore_stock: data.restore_stock ? '1' : '0',
    }),
}
