import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) {
          return false; // Don't retry on auth errors
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
