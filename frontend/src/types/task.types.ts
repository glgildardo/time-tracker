import type { Project } from './project.types';

// Task types
export interface Task {
  _id: string;
  name: string;
  description?: string;
  projectId: string | Project;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Task request types
export interface CreateTaskRequest {
  name: string;
  description?: string;
  projectId: string;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
}

// Task response types
export interface TasksResponse {
  tasks: Task[];
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
