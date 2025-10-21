import { api } from '@/lib/api';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserResponse,
} from '@/types';

export const authService = {
  /**
   * Register a new user account
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  /**
   * Authenticate user and get access token
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  /**
   * Get current authenticated user information
   */
  async getCurrentUser(): Promise<UserResponse> {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
