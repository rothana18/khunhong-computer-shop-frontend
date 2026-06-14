import api from '@/api'
import type { ApiResponse, PaginatedApiResponse, ManagedUser } from '@/types'

export interface UserListParams {
  page?: number
  per_page?: number
  search?: string
}

export interface CreateUserData {
  first_name: string
  last_name: string
  email: string
  password: string
  role_id: number
  phone?: string
  /** Optional initial address fields */
  province?: string
  district_khan?: string
  commune_sangkat?: string
  street_house?: string
}

export interface UpdateUserData {
  first_name?: string
  last_name?: string
  email?: string
  role_id?: number
  phone?: string
  status?: string
}

export const usersApi = {
  /** GET /users - returns active users (now paginated) */
  list: (params?: UserListParams) =>
    api.get<PaginatedApiResponse<ManagedUser>>('/users', { params }),

  /** GET /users/{id} */
  getById: (id: number) => api.get<ApiResponse<ManagedUser>>(`/users/${id}`),

  /** GET /users/trashed - returns soft-deleted users (now paginated) */
  listTrashed: (params?: UserListParams) =>
    api.get<PaginatedApiResponse<ManagedUser>>('/users/trashed', { params }),

  /**
   * POST /users — always send as FormData so an optional profile image can
   * be included without changing the call site.
   */
  create: (data: FormData) => api.post<ApiResponse<ManagedUser>>('/users', data),

  /**
   * POST /users/{id} with _method=PUT (multipart/form-data method-spoofing).
   * Required because the endpoint may receive a profile image upload.
   */
  update: (id: number, data: FormData) => api.post<ApiResponse<ManagedUser>>(`/users/${id}`, data),

  /** DELETE /users/{id} — soft-deletes the user (moves to deleted list, restorable) */
  delete: (id: number) => api.delete<ApiResponse<null>>(`/users/${id}`),

  /** PATCH /users/{id}/restore */
  restore: (id: number) => api.patch<ApiResponse<ManagedUser>>(`/users/${id}/restore`),

  /** DELETE /users/{id}/force-delete — permanent removal (user must already be soft-deleted) */
  forceDelete: (id: number) => api.delete<ApiResponse<null>>(`/users/${id}/force-delete`),

  /** PATCH /users/{id}/toggle-status — toggles between active ↔ inactive */
  toggleStatus: (id: number) => api.patch<ApiResponse<ManagedUser>>(`/users/${id}/toggle-status`),

  /** PATCH /users/{id}/assign-role */
  assignRole: (id: number, role_id: number) =>
    api.patch<ApiResponse<ManagedUser>>(`/users/${id}/assign-role`, { role_id }),

  /** PATCH /users/{id}/change-password */
  changePassword: (id: number, data: { password: string; password_confirmation: string }) =>
    api.patch<ApiResponse<null>>(`/users/${id}/change-password`, data),

  /** POST /users/bulk-delete — soft-deletes multiple users */
  bulkDelete: (ids: number[]) => api.post<ApiResponse<null>>('/users/bulk-delete', { ids }),
}
