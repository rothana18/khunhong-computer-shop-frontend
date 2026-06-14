import api from '@/api'
import type { ApiResponse, User } from '@/types'

export const profileApi = {
  changePassword: (data: {
    current_password: string
    password: string
    password_confirmation: string
  }) => api.patch<ApiResponse<null>>('/profile/change-password', data),

  updateProfile: (data: {
    first_name?: string
    last_name?: string
    email?: string
    phone?: string | null
  }) => api.put<ApiResponse<User>>('/profile', data),

  updateAvatar: (file: File) => {
    const form = new FormData()
    form.append('profile_image', file)
    return api.post<ApiResponse<User>>('/profile/update-avatar', form)
  },
}
