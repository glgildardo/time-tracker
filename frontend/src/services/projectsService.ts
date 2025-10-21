import { api } from '@/lib/api';
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectsResponse,
  ProjectResponse,
  CreateProjectResponse,
  UpdateProjectResponse,
  DeleteProjectResponse,
} from '@/types';

export const projectsService = {
  /**
   * Get all projects for the authenticated user
   */
  async getProjects(): Promise<ProjectsResponse> {
    const response = await api.get('/projects');
    return response.data;
  },

  /**
   * Get a specific project by ID
   */
  async getProject(id: string): Promise<ProjectResponse> {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectRequest): Promise<CreateProjectResponse> {
    const response = await api.post('/projects', data);
    return response.data;
  },

  /**
   * Update a project
   */
  async updateProject(id: string, data: UpdateProjectRequest): Promise<UpdateProjectResponse> {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  /**
   * Delete a project and all associated tasks and time entries
   */
  async deleteProject(id: string): Promise<DeleteProjectResponse> {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
};
