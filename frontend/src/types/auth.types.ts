// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

// Authentication request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// Authentication response types
export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface UserResponse {
  user: User;
}
