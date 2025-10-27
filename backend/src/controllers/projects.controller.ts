import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { TimeEntry } from '../models/TimeEntry';
import { ValidationError, NotFoundError } from '../utils/errorHandler';

interface CreateProjectData {
  name: string;
  description?: string | undefined;
  color: string;
  client?: string | undefined;
  status: 'active' | 'archived';
  budget?: number | undefined;
}

interface UpdateProjectData {
  name?: string | undefined;
  description?: string | undefined;
  color?: string | undefined;
  client?: string | undefined;
  status?: 'active' | 'archived' | undefined;
  budget?: number | undefined;
}

class ProjectsController {
  async getAllProjects(userId: string) {
    const projects = await Project.find({ userId }).sort({ createdAt: -1 });

    return { projects };
  }

  async createProject(userId: string, data: CreateProjectData) {
    const { name, description, color, client, status, budget } = data;

    // Check if project with same name already exists
    const existingProject = await Project.findOne({ userId, name });
    if (existingProject) {
      throw new ValidationError('A project with this name already exists');
    }

    const project = new Project({
      name,
      description,
      color,
      client,
      status,
      budget,
      userId,
    });

    await project.save();

    return {
      message: 'Project created successfully',
      project,
    };
  }

  async getProjectById(userId: string, projectId: string) {
    const project = await Project.findOne({
      _id: projectId,
      userId,
    });

    if (!project) {
      throw new NotFoundError('Project does not exist or you do not have access to it');
    }

    return { project };
  }

  async updateProject(userId: string, projectId: string, data: UpdateProjectData) {
    const project = await Project.findOne({
      _id: projectId,
      userId,
    });

    if (!project) {
      throw new NotFoundError('Project does not exist or you do not have access to it');
    }

    // Check if name is being updated and conflicts with existing project
    if (data.name && data.name !== project.name) {
      const existingProject = await Project.findOne({
        userId,
        name: data.name,
        _id: { $ne: projectId },
      });

      if (existingProject) {
        throw new ValidationError('A project with this name already exists');
      }
    }

    Object.assign(project, data);
    await project.save();

    return {
      message: 'Project updated successfully',
      project,
    };
  }

  async deleteProject(userId: string, projectId: string) {
    const project = await Project.findOne({
      _id: projectId,
      userId,
    });

    if (!project) {
      throw new NotFoundError('Project does not exist or you do not have access to it');
    }

    // Get all task IDs for this project
    const taskIds = await Task.find({ projectId }).distinct('_id');

    // Delete all associated tasks and time entries
    await Task.deleteMany({ projectId });
    await TimeEntry.deleteMany({
      taskId: { $in: taskIds },
    });
    await Project.deleteOne({ _id: projectId });

    return {
      message: 'Project deleted successfully',
    };
  }
}

export const projectsController = new ProjectsController();

