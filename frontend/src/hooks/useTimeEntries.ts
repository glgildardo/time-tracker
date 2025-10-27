import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { timeEntriesService } from '@/services';
import type { 
  TimeEntriesFilters, 
  StartTimerRequest, 
  StopTimerRequest, 
  UpdateTimeEntryRequest 
} from '@/types';
import { REFRESH_INTERVAL } from '@/lib/constants';

const timeEntriesQueryKey = {
  all: ['timeEntries'],
  lists: () => [...timeEntriesQueryKey.all, 'list'],
  list: (filters: TimeEntriesFilters) => [...timeEntriesQueryKey.lists(), filters],
  activeTimer: () => [...timeEntriesQueryKey.all, 'activeTimer'],
};

// Time Entries hooks
export const useTimeEntries = (filters?: TimeEntriesFilters) => {
  return useQuery({
    queryKey: timeEntriesQueryKey.list(filters ?? {}),
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
  const [isVisible, setIsVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    // Handle page visibility
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    // Handle window focus/blur
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const query = useQuery({
    queryKey: timeEntriesQueryKey.activeTimer(),
    queryFn: async () => {
      const response = await timeEntriesService.getActiveTimer();
      return response.timeEntry;
    },
    refetchInterval: (query) => {
      // No active timer - don't poll
      if (!query.state.data) return REFRESH_INTERVAL.FOCUSED;
      
      // Page hidden - poll every 15 seconds
      if (!isVisible) return REFRESH_INTERVAL.HIDDEN;
      
      // Page visible but not focused - poll every 5 seconds
      if (!isFocused) return REFRESH_INTERVAL.NOT_FOCUSED;
      
      // Page visible and focused - poll every second
      return 60000;
    },
  });

  return query;
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
