import api from '@/api'
import type { ApiResponse, User } from '@/types'

interface AuthResponse {
  user: User
  token: string
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/login', { email, password }),

  register: (data: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    password: string
    password_confirmation: string
  }) => api.post<ApiResponse<AuthResponse>>('/register', data),

  logout: () => api.post<ApiResponse<null>>('/auth/logout'),

  getUser: () => api.get<ApiResponse<User>>('/auth/user-details'),
}
