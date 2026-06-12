import api from '@/api'
import type { ApiResponse, Payment } from '@/types'

export interface UpdatePaymentStatusData {
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  transaction_id?: string
  payment_date?: string
  is_refunded?: boolean
  refund_reason?: string
}

export const paymentsApi = {
  getById: (id: number) => api.get<ApiResponse<Payment>>(`/payments/${id}`),

  uploadProof: (id: number, file: File) => {
    const form = new FormData()
    form.append('payment_proof', file)
    return api.post<ApiResponse<Payment>>(`/payments/${id}/upload-proof`, form)
  },

  updateStatus: (id: number, data: UpdatePaymentStatusData) =>
    api.put<ApiResponse<Payment>>(`/payments/${id}`, data),

  refund: (id: number, refund_reason: string) =>
    api.post<ApiResponse<Payment>>(`/payments/${id}/refund`, { refund_reason }),
}
