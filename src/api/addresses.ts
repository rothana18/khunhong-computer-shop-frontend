import api from '@/api'
import type { Address, ApiResponse } from '@/types'

export interface CreateAddressData {
  full_name: string
  phone: string
  province: string
  district_khan: string
  commune_sangkat: string
  street_house: string
  is_default?: boolean
}

export const addressesApi = {
  list: () => api.get<ApiResponse<Address[]>>('/addresses'),

  getById: (id: number) => api.get<ApiResponse<Address>>(`/addresses/${id}`),

  create: (data: CreateAddressData) => api.post<ApiResponse<Address>>('/addresses', data),

  update: (id: number, data: Partial<CreateAddressData>) =>
    api.put<ApiResponse<Address>>(`/addresses/${id}`, data),

  delete: (id: number) => api.delete<ApiResponse<null>>(`/addresses/${id}`),
}
