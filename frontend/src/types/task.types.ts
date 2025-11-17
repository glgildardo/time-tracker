import type { Project } from './project.types';

// Task types
export interface Task {
  _id: string;
  name: string;
  description?: string;
  projectId: string | Project;
  userId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed';
  timerStatus?: 'idle' | 'running' | 'paused' | 'stopped';
  estimatedHours?: number;
  createdAt: string;
  updatedAt: string;
}

// Task request types
export interface CreateTaskRequest {
  name: string;
  description?: string;
  projectId: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'pending' | 'in-progress' | 'completed';
  estimatedHours?: number;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'pending' | 'in-progress' | 'completed';
  estimatedHours?: number;
}

// Task response types
export interface TasksResponse {
  tasks: Task[];
  total: number;
  limit: number;
  offset: number;
}

export interface TaskResponse {
  task: Task;
}

export interface CreateTaskResponse {
  message: string;
  task: Task;
}

export interface UpdateTaskResponse {
  message: string;
  task: Task;
}

export interface DeleteTaskResponse {
  message: string;
}
