import { api } from '@/lib/api';
import type {
  CreateTaskRequest,
  UpdateTaskRequest,
  TasksResponse,
  TaskResponse,
  CreateTaskResponse,
  UpdateTaskResponse,
  DeleteTaskResponse,
} from '@/types';

export const tasksService = {
  /**
   * Get all tasks for the authenticated user, optionally filtered by project and date
   */
  async getTasks(projectId?: string, dateFilter?: 'day' | 'week' | 'month' | 'all'): Promise<TasksResponse> {
    const params: Record<string, string> = {};
    if (projectId) params.projectId = projectId;
    if (dateFilter) params.dateFilter = dateFilter;
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  /**
   * Get a specific task by ID
   */
  async getTask(id: string): Promise<TaskResponse> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskRequest): Promise<CreateTaskResponse> {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  /**
   * Update a task
   */
  async updateTask(id: string, data: UpdateTaskRequest): Promise<UpdateTaskResponse> {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  /**
   * Delete a task and all associated time entries
   */
  async deleteTask(id: string): Promise<DeleteTaskResponse> {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};
