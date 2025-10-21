// Common API response types
export interface ApiError {
  error: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
}

// Health check response
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  database: string;
  environment: string;
}
