import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TimeEntry } from './useProjects';

// Time Entries hooks
export const useTimeEntries = (filters?: {
  projectId?: string;
  taskId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['timeEntries', filters],
    queryFn: async () => {
      const response = await api.get('/time-entries', { params: filters });
      return {
        timeEntries: response.data.timeEntries as TimeEntry[],
        total: response.data.total as number,
        limit: response.data.limit as number,
        offset: response.data.offset as number,
      };
    },
  });
};

export const useActiveTimer = () => {
  return useQuery({
    queryKey: ['activeTimer'],
    queryFn: async () => {
      const response = await api.get('/time-entries/active');
      return response.data.timeEntry as TimeEntry | null;
    },
    refetchInterval: 1000, // Poll every second for active timer
  });
};

export const useStartTimer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { taskId: string; description?: string }) => {
      const response = await api.post('/time-entries/start', data);
      return response.data.timeEntry as TimeEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });
};

export const useStopTimer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data?: { description?: string }) => {
      const response = await api.post('/time-entries/stop', data || {});
      return response.data.timeEntry as TimeEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });
};

export const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TimeEntry> }) => {
      const response = await api.put(`/time-entries/${id}`, data);
      return response.data.timeEntry as TimeEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
    },
  });
};

export const useDeleteTimeEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/time-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
    },
  });
};
