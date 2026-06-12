import api from '@/api'
import type { ApiResponse, PaginatedApiResponse, Shipment, ShipmentSummary } from '@/types'

export interface ShipmentListParams {
  page?: number
  per_page?: number
  search?: string
}

export interface CreateShipmentData {
  tracking_number: string
  carrier: string
  ship_date: string
}

export interface UpdateShipmentData {
  tracking_number?: string
  carrier?: string
  ship_date?: string
  status?: 'in_transit' | 'delivered'
  delivery_notes?: string
}

export const shipmentsApi = {
  summary: () => api.get<ApiResponse<ShipmentSummary>>('/shipments/summary'),

  list: (params?: ShipmentListParams) =>
    api.get<PaginatedApiResponse<Shipment>>('/shipments', { params }),

  getById: (id: number) => api.get<ApiResponse<Shipment>>(`/shipments/${id}`),

  create: (orderId: number, data: CreateShipmentData) =>
    api.post<ApiResponse<Shipment>>(`/shipments/order/${orderId}`, data),

  update: (id: number, data: FormData | UpdateShipmentData) =>
    api.post<ApiResponse<Shipment>>(`/shipments/${id}`, data),

  markDelivered: (
    id: number,
    data?: { delivery_notes?: string; delivered_at?: string; proof_of_delivery?: File }
  ) => {
    if (data?.proof_of_delivery) {
      const form = new FormData()
      form.append('_method', 'PATCH')
      form.append('proof_of_delivery', data.proof_of_delivery)
      if (data.delivery_notes) form.append('delivery_notes', data.delivery_notes)
      if (data.delivered_at) form.append('delivered_at', data.delivered_at)
      return api.post<ApiResponse<Shipment>>(`/shipments/${id}/deliver`, form)
    }
    return api.patch<ApiResponse<Shipment>>(`/shipments/${id}/deliver`, data)
  },
}
