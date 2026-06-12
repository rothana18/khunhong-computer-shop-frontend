import api from '@/api'
import type { ApiResponse } from '@/types'

export const profileApi = {
  changePassword: (data: {
    current_password: string
    password: string
    password_confirmation: string
  }) => api.patch<ApiResponse<null>>('/profile/change-password', data),
}
