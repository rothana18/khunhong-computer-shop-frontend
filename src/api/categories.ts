import api from '@/api'
import type { ApiResponse, Category, PaginatedApiResponse } from '@/types'

export interface CategoryListParams {
  page?: number
  per_page?: number
  search?: string
}

export interface CreateCategoryData {
  parent_id?: number
  name: string
  description?: string
  status: 'active' | 'inactive'
}

export const categoriesApi = {
  list: (params?: CategoryListParams) =>
    api.get<PaginatedApiResponse<Category>>('/categories', { params }),

  /**
   * Fetches every category across all pages (100 per request).
   * Use this for dropdowns/selects that need the full set; `list` is for
   * paginated UIs where the total count is unknown up front.
   */
  listAll: async (): Promise<Category[]> => {
    const first = await api.get<PaginatedApiResponse<Category>>('/categories', {
      params: { per_page: 100, page: 1 },
    })
    const { data: items, meta } = first.data
    if (meta.last_page <= 1) return items
    const rest = await Promise.all(
      Array.from({ length: meta.last_page - 1 }, (_, i) =>
        api
          .get<PaginatedApiResponse<Category>>('/categories', {
            params: { per_page: 100, page: i + 2 },
          })
          .then((r) => r.data.data)
      )
    )
    return [...items, ...rest.flat()]
  },

  getById: (id: number) => api.get<ApiResponse<Category>>(`/categories/${id}`),

  listTrashed: (params?: CategoryListParams) =>
    api.get<PaginatedApiResponse<Category>>('/categories/trashed', { params }),

  create: (data: FormData | CreateCategoryData) =>
    api.post<ApiResponse<Category>>('/categories', data),

  update: (id: number, data: FormData | Partial<CreateCategoryData>) =>
    api.post<ApiResponse<Category>>(`/categories/${id}`, data),

  delete: (id: number) => api.delete<ApiResponse<null>>(`/categories/${id}`),

  restore: (id: number) => api.post<ApiResponse<Category>>(`/categories/${id}/restore`),

  forceDelete: (id: number) => api.delete<ApiResponse<null>>(`/categories/${id}/force`),
}
