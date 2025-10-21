import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '@/services';
import type { CreateProjectRequest, UpdateProjectRequest } from '@/types';

// Projects hooks
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectsService.getProjects();
      return response.projects;
    },
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const response = await projectsService.getProject(id);
      return response.project;
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateProjectRequest) => {
      const response = await projectsService.createProject(data);
      return response.project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectRequest }) => {
      const response = await projectsService.updateProject(id, data);
      return response.project;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await projectsService.deleteProject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });
};
