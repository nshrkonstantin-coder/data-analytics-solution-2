const AUTH_API_URL = 'https://functions.poehali.dev/c2f5fe05-0d0b-4667-96f1-ea3664c6b0c4'

export interface User {
  id: number
  email: string
  full_name?: string
  phone?: string
  role: string
}

export interface AuthResponse {
  message: string
  token: string
  user: User
}

export const authService = {
  async register(email: string, password: string, full_name?: string, phone?: string): Promise<AuthResponse> {
    const response = await fetch(`${AUTH_API_URL}?action=register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, full_name, phone }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка регистрации')
    }

    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))

    return data
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    console.log('[AUTH] Attempting login:', email)
    console.log('[AUTH] API URL:', `${AUTH_API_URL}?action=login`)
    
    const response = await fetch(`${AUTH_API_URL}?action=login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    console.log('[AUTH] Response status:', response.status)
    const data = await response.json()
    console.log('[AUTH] Response data:', data)

    if (!response.ok) {
      console.error('[AUTH] Login failed:', data.error)
      throw new Error(data.error || 'Ошибка входа')
    }

    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    console.log('[AUTH] Login successful, token saved')

    return data
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('auth_token')

    if (token) {
      await fetch(`${AUTH_API_URL}?action=logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
    }

    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
  },

  async verifySession(): Promise<{ valid: boolean; user?: User }> {
    const token = localStorage.getItem('auth_token')

    if (!token) {
      return { valid: false }
    }

    try {
      const response = await fetch(`${AUTH_API_URL}?action=verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        return { valid: false }
      }

      return data
    } catch {
      return { valid: false }
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const token = localStorage.getItem('auth_token')

    if (!token) {
      throw new Error('Требуется авторизация')
    }

    const response = await fetch(`${AUTH_API_URL}?action=change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка смены пароля')
    }
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token')
  },

  isAdmin(): boolean {
    const user = this.getUser()
    return user?.role === 'admin'
  },
}