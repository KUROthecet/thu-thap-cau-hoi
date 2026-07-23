import { api } from '../lib/api'
import type { LoginResponse, UserResponse } from '../lib/types'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),
  me: () => api.get<UserResponse>('/auth/me'),
}
