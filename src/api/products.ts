import api from '@/api'
import type { ApiResponse, PaginatedApiResponse, Product } from '@/types'

export interface ProductListParams {
  page?: number
  per_page?: number
  search?: string
  category_id?: number
}

export interface CreateProductData {
  category_id: number
  name: string
  brand: string
  sku: string
  price: number
  discount_price?: number
  stock: number
  short_description?: string
  description?: string
  is_featured?: boolean
  status: 'active' | 'inactive'
}

export const productsApi = {
  list: (params?: ProductListParams) =>
    api.get<PaginatedApiResponse<Product>>('/products', { params }),

  getById: (id: number) => api.get<ApiResponse<Product>>(`/products/${id}`),

  listTrashed: (params?: ProductListParams) =>
    api.get<PaginatedApiResponse<Product>>('/products/trashed', { params }),

  create: (data: FormData | CreateProductData) => api.post<ApiResponse<Product>>('/products', data),

  update: (id: number, data: FormData | Partial<CreateProductData>) =>
    api.post<ApiResponse<Product>>(`/products/${id}`, data),

  delete: (id: number) => api.delete<ApiResponse<null>>(`/products/${id}`),

  restore: (id: number) => api.post<ApiResponse<Product>>(`/products/${id}/restore`),

  forceDelete: (id: number) => api.delete<ApiResponse<null>>(`/products/${id}/force`),
}
