import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/services';
import type { CreateTaskRequest, UpdateTaskRequest } from '@/types';

const tasksQueryKey = {
  all: ['tasks'],
  byId: (id: string) => [...tasksQueryKey.all, id],
  byProjectId: (projectId: string) => [...tasksQueryKey.all, 'project', projectId],
  infinite: (projectId?: string, search?: string) => [
    ...tasksQueryKey.all, 
    'infinite', 
    projectId || 'all',
    search || '',
  ],
};

// Tasks hooks
export const useTasks = (projectId?: string, dateFilter?: 'day' | 'week' | 'month' | 'all') => {
  return useQuery({
    queryKey: projectId 
      ? [...tasksQueryKey.byProjectId(projectId), dateFilter || 'all']
      : [...tasksQueryKey.all, dateFilter || 'all'],
    queryFn: async () => {
      const response = await tasksService.getTasks(projectId);
      return response.tasks;
    },
  });
};

// Infinite scroll hook for tasks
export const useInfiniteTasks = (
  projectId?: string, 
  search?: string, 
  pageSize: number = 10
) => {
  return useInfiniteQuery({
    queryKey: tasksQueryKey.infinite(projectId, search),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await tasksService.getTasks(
        projectId,
        search,
        pageSize,
        pageParam
      );
      return {
        tasks: response.tasks,
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        nextOffset: response.offset + response.limit < response.total 
          ? response.offset + response.limit 
          : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: tasksQueryKey.byId(id),
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
