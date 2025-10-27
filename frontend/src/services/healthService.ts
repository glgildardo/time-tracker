import axios from 'axios';
import { api } from '@/lib/api';
import type { HealthCheckResponse } from '@/types';

// The health endpoint is not under /api. It lives at the server root.
// Derive the base server URL from the existing axios instance's baseURL.
const RAW_API_URL = api.defaults.baseURL || 'http://localhost:3001/api';
const BASE_SERVER_URL = RAW_API_URL.replace(/\/?api\/?$/, '');

export const healthService = {
  async getHealth(): Promise<HealthCheckResponse> {
    const response = await axios.get(`${BASE_SERVER_URL}/health`, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data as HealthCheckResponse;
  },
};


