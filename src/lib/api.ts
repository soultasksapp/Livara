"use client"

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private token: string | null = null
  private baseURL: string = ''

  constructor() {
    // Base URL is handled by Next.js, so we use relative paths
    this.baseURL = ''
    
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  private getHeaders(contentType: string = 'application/json'): HeadersInit {
    const headers: HeadersInit = {}

    if (contentType !== 'multipart/form-data') {
      headers['Content-Type'] = contentType
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const responseText = await response.text()
    
    try {
      const data = JSON.parse(responseText)
      
      if (response.ok) {
        return {
          success: true,
          data: data
        }
      } else {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}: ${response.statusText}`,
          data: data
        }
      }
    } catch (error) {
      console.error('Failed to parse response as JSON:', responseText)
      return {
        success: false,
        error: `Failed to parse response (${response.status}): ${responseText.substring(0, 200)}...`
      }
    }
  }

  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include'
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      }
    }
  }

  async post<T = any>(url: string, data?: any, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      let body: any = undefined
      let contentType = 'application/json'

      if (data instanceof FormData) {
        body = data
        contentType = 'multipart/form-data'
      } else if (data) {
        body = JSON.stringify(data)
      }

      const headers = { ...this.getHeaders(contentType), ...customHeaders }

      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      }
    }
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      }
    }
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        credentials: 'include'
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      }
    }
  }
}

export const apiClient = new ApiClient()
export { type ApiResponse }