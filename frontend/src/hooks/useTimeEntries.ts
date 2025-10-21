import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntriesService } from '@/services';
import type { 
  TimeEntriesFilters, 
  StartTimerRequest, 
  StopTimerRequest, 
  UpdateTimeEntryRequest 
} from '@/types';

// Time Entries hooks
export const useTimeEntries = (filters?: TimeEntriesFilters) => {
  return useQuery({
    queryKey: ['timeEntries', filters],
    queryFn: async () => {
      const response = await timeEntriesService.getTimeEntries(filters);
      return {
        timeEntries: response.timeEntries,
        total: response.total,
        limit: response.limit,
        offset: response.offset,
      };
    },
  });
};

export const useActiveTimer = () => {
  return useQuery({
    queryKey: ['activeTimer'],
    queryFn: async () => {
      const response = await timeEntriesService.getActiveTimer();
      return response.timeEntry;
    },
    refetchInterval: 1000, // Poll every second for active timer
  });
};

export const useStartTimer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: StartTimerRequest) => {
      const response = await timeEntriesService.startTimer(data);
      return response.timeEntry;
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
    mutationFn: async (data?: StopTimerRequest) => {
      const response = await timeEntriesService.stopTimer(data);
      return response.timeEntry;
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
    mutationFn: async ({ id, data }: { id: string; data: UpdateTimeEntryRequest }) => {
      const response = await timeEntriesService.updateTimeEntry(id, data);
      return response.timeEntry;
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
      await timeEntriesService.deleteTimeEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
    },
  });
};
