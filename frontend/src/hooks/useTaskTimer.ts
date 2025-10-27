import { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskTimerService } from '@/services/taskTimerService';
import { tasksService } from '@/services';
import { useTaskTimer as useTaskTimerStore } from '@/stores/useTaskTimer';
import type { Task } from '@/types';
import { REFRESH_INTERVAL } from '@/lib/constants';

const taskTimerQueryKey = {
  all: ['taskTimer'],
  byId: (id: string) => [...taskTimerQueryKey.all, id],
  active: () => [...taskTimerQueryKey.all, 'active'],
};

export const useTaskTimerView = (taskId?: string) => {
  const setFromView = useTaskTimerStore((state) => state.setFromView);

  const query = useQuery({
    queryKey: taskTimerQueryKey.byId(taskId || ''),
    queryFn: () => taskTimerService.getTaskTimerView(taskId!),
    enabled: !!taskId,
    staleTime: 60000, // 60 seconds
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) {
      setFromView(query.data.taskView);
    }
  }, [query.data, setFromView]);

  return query;
};

export const useStartTask = () => {
  const queryClient = useQueryClient();
  const setFromView = useTaskTimerStore((state) => state.setFromView);

  return useMutation({
    mutationFn: async (id: string) => {
      return taskTimerService.startTask(id);
    },
    onSuccess: (data, id) => {
      setFromView(data.taskView);
      queryClient.invalidateQueries({ queryKey: taskTimerQueryKey.byId(id) });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const usePauseTask = () => {
  const queryClient = useQueryClient();
  const setFromView = useTaskTimerStore((state) => state.setFromView);

  return useMutation({
    mutationFn: async (id: string) => {
      return taskTimerService.pauseTask(id);
    },
    onSuccess: (data, id) => {
      setFromView(data.taskView);
      queryClient.invalidateQueries({ queryKey: taskTimerQueryKey.byId(id) });
    },
  });
};

export const useResumeTask = () => {
  const queryClient = useQueryClient();
  const setFromView = useTaskTimerStore((state) => state.setFromView);

  return useMutation({
    mutationFn: async (id: string) => {
      return taskTimerService.resumeTask(id);
    },
    onSuccess: (data, id) => {
      setFromView(data.taskView);
      queryClient.invalidateQueries({ queryKey: taskTimerQueryKey.byId(id) });
    },
  });
};

export const useStopTask = () => {
  const queryClient = useQueryClient();
  const setFromView = useTaskTimerStore((state) => state.setFromView);

  return useMutation({
    mutationFn: async (id: string) => {
      return taskTimerService.stopTask(id);
    },
    onSuccess: (data, id) => {
      setFromView(data.taskView);
      queryClient.invalidateQueries({ queryKey: taskTimerQueryKey.byId(id) });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Hook to find the currently active timer across all tasks
export const useActiveTaskTimer = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
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

  // Fetch all tasks to find the active one
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await tasksService.getTasks();
      return response.tasks;
    },
  });

  // Find task with active timer
  const activeTask = tasks.find((task: Task) => 
    task.timerStatus === 'running' || task.timerStatus === 'paused'
  );

  // Fetch timer view for the active task if found
  const { data: timerData, isLoading: timerLoading, refetch } = useTaskTimerView(
    activeTask?._id
  );

  const refetchInterval = useMemo(() => {
    if (!activeTask) return REFRESH_INTERVAL.FOCUSED; // No active timer
    if (!isVisible) return REFRESH_INTERVAL.HIDDEN; // Page hidden
    if (!isFocused) return REFRESH_INTERVAL.NOT_FOCUSED; // Page visible but not focused
    return 1000; // Page visible and focused
  }, [activeTask, isVisible, isFocused]);

  useEffect(() => {
    if (refetchInterval > 0 && activeTask) {
      const interval = setInterval(() => {
        refetch();
      }, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval, activeTask, refetch]);

  return {
    data: timerData?.taskView || null,
    isLoading: tasksLoading || timerLoading,
    refetch,
  };
};


