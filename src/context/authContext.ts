import { createContext } from 'react'
import type { User } from '@/types'

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  error: string | null
}

export type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' }

export const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
}

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, isAuthenticated: true, user: action.payload, loading: false, error: null }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'LOGOUT':
      return { ...initialState, loading: false }
  }
}

export interface AuthContextValue {
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    password: string
    password_confirmation: string
  }) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
