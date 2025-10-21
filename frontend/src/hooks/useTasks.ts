import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/services';
import type { CreateTaskRequest, UpdateTaskRequest } from '@/types';

// Tasks hooks
export const useTasks = (projectId?: string) => {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const response = await tasksService.getTasks(projectId);
      return response.tasks;
    },
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const response = await tasksService.getTask(id);
      return response.task;
    },
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateTaskRequest) => {
      const response = await tasksService.createTask(data);
      return response.task;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.projectId] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskRequest }) => {
      const response = await tasksService.updateTask(id, data);
      return response.task;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await tasksService.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });
};
