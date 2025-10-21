// Project types
export interface Project {
  _id: string;
  name: string;
  description?: string;
  color: string;
  client?: string;
  status: 'active' | 'archived';
  budget?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Project request types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  color?: string;
  client?: string;
  status?: 'active' | 'archived';
  budget?: number;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  color?: string;
  client?: string;
  status?: 'active' | 'archived';
  budget?: number;
}

// Project response types
export interface ProjectsResponse {
  projects: Project[];
}

export interface ProjectResponse {
  project: Project;
}

export interface CreateProjectResponse {
  message: string;
  project: Project;
}

export interface UpdateProjectResponse {
  message: string;
  project: Project;
}

export interface DeleteProjectResponse {
  message: string;
}
