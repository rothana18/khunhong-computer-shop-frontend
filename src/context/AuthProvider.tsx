import React, { useCallback, useEffect, useReducer } from 'react'
import { authApi } from '@/api/auth'
import { apiMessage } from '@/utils/axiosError'
import { AuthContext, authReducer, initialState } from './authContext'
import type { AuthContextValue } from './authContext'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      dispatch({ type: 'LOGOUT' })
      return
    }
    let cancelled = false
    authApi
      .getUser()
      .then((res) => {
        if (!cancelled) dispatch({ type: 'SET_USER', payload: res.data.data })
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem('auth_token')
          dispatch({ type: 'LOGOUT' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('auth_token')
      dispatch({ type: 'LOGOUT' })
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      const res = await authApi.login(email, password)
      localStorage.setItem('auth_token', res.data.data.token)
      dispatch({ type: 'SET_USER', payload: res.data.data.user })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: apiMessage(err, 'Login failed') })
      throw err
    }
  }

  const register = async (data: Parameters<AuthContextValue['register']>[0]) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      const res = await authApi.register(data)
      localStorage.setItem('auth_token', res.data.data.token)
      dispatch({ type: 'SET_USER', payload: res.data.data.user })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: apiMessage(err, 'Registration failed') })
      throw err
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Token may already be invalid; proceed regardless
    } finally {
      localStorage.removeItem('auth_token')
      dispatch({ type: 'LOGOUT' })
    }
  }

  const clearError = useCallback(() => dispatch({ type: 'SET_ERROR', payload: null }), [])
  const updateUser = useCallback(
    (user: Parameters<AuthContextValue['updateUser']>[0]) =>
      dispatch({ type: 'SET_USER', payload: user }),
    []
  )

  return (
    <AuthContext.Provider value={{ state, login, register, logout, clearError, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
