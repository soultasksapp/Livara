"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'

interface User {
  id: number
  name: string
  email: string
  role: string
  team_id?: number
  widget_access?: boolean
  created_at: string
  profile_color?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      apiClient.setToken(token)
      const response = await apiClient.get<User>('/api/auth/profile')
      
      if (response.success && response.data) {
        setUser(response.data)
      } else {
        localStorage.removeItem('auth_token')
        apiClient.clearToken()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('auth_token')
      apiClient.clearToken()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await apiClient.post<{ token: string; user: User }>('/api/auth/login', {
        email,
        password,
      })

      if (response.success && response.data) {
        const { token, user: userData } = response.data
        apiClient.setToken(token)
        setUser(userData)
        router.push('/dashboard')
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return
      
      const response = await apiClient.get<User>('/api/auth/profile')
      if (response.success && response.data) {
        setUser(response.data)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  const logout = () => {
    setUser(null)
    apiClient.clearToken()
    localStorage.removeItem('auth_token')
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refreshUser,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}