import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskTimerService } from '@/services/taskTimerService';
import { useTaskTimer as useTaskTimerStore } from '@/stores/useTaskTimer';

const taskTimerQueryKey = {
  all: ['taskTimer'],
  byId: (id: string) => [...taskTimerQueryKey.all, id],
};

export const useTaskTimerView = (taskId?: string) => {
  const setFromView = useTaskTimerStore((state) => state.setFromView);

  return useQuery({
    queryKey: taskTimerQueryKey.byId(taskId || ''),
    queryFn: () => taskTimerService.getTaskTimerView(taskId!),
    enabled: !!taskId,
    staleTime: 60000, // 60 seconds
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      setFromView(data.taskView);
    },
  });
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


