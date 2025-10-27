import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { TimeEntry } from '../models/TimeEntry';
import { taskTimerService, TaskView } from '../services/taskTimer.service';
import { ValidationError, NotFoundError, BadRequestError } from '../utils/errorHandler';

interface CreateTaskData {
  name: string;
  description?: string | undefined;
  projectId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed';
  estimatedHours?: number | undefined;
}

interface UpdateTaskData {
  name?: string | undefined;
  description?: string | undefined;
  priority?: 'low' | 'medium' | 'high' | 'critical' | undefined;
  status?: 'pending' | 'in-progress' | 'completed' | undefined;
  estimatedHours?: number | undefined;
}

class TasksController {
  // Task CRUD operations
  async getAllTasks(userId: string, projectId?: string) {
    const filter: { userId: string; projectId?: string } = { userId };

    if (projectId) {
      // Verify the project belongs to the user
      const project = await Project.findOne({ _id: projectId, userId });
      if (!project) {
        throw new NotFoundError('Project does not exist or you do not have access to it');
      }
      filter.projectId = projectId;
    }

    const tasks = await Task.find(filter)
      .populate('projectId', 'name color')
      .sort({ createdAt: -1 })
      .lean();

    return { tasks };
  }

  async createTask(userId: string, data: CreateTaskData) {
    const { name, description, projectId, priority, status, estimatedHours } = data;

    // Verify the project belongs to the user
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw new NotFoundError('Project does not exist or you do not have access to it');
    }

    // Check if task with same name already exists in this project
    const existingTask = await Task.findOne({ userId, projectId, name });
    if (existingTask) {
      throw new ValidationError('A task with this name already exists in this project');
    }

    const task = new Task({
      name,
      description,
      projectId,
      priority,
      status,
      estimatedHours,
      userId,
    });

    await task.save();
    await task.populate('projectId', 'name color');

    return {
      message: 'Task created successfully',
      task: task.toObject(),
    };
  }

  async getTaskById(userId: string, taskId: string) {
    const task = await Task.findOne({ _id: taskId, userId })
      .populate('projectId', 'name color')
      .lean();

    if (!task) {
      throw new NotFoundError('Task does not exist or you do not have access to it');
    }

    return { task };
  }

  async updateTask(userId: string, taskId: string, data: UpdateTaskData) {
    const task = await Task.findOne({ _id: taskId, userId });

    if (!task) {
      throw new NotFoundError('Task does not exist or you do not have access to it');
    }

    // Check if name is being updated and conflicts with existing task
    if (data.name && data.name !== task.name) {
      const existingTask = await Task.findOne({
        userId,
        projectId: task.projectId,
        name: data.name,
        _id: { $ne: taskId },
      });

      if (existingTask) {
        throw new ValidationError('A task with this name already exists in this project');
      }
    }

    Object.assign(task, data);
    await task.save();
    await task.populate('projectId', 'name color');

    return {
      message: 'Task updated successfully',
      task: task.toObject(),
    };
  }

  async deleteTask(userId: string, taskId: string) {
    const task = await Task.findOne({ _id: taskId, userId });

    if (!task) {
      throw new NotFoundError('Task does not exist or you do not have access to it');
    }

    // Delete all associated time entries
    await TimeEntry.deleteMany({ taskId });
    await Task.deleteOne({ _id: taskId });

    return {
      message: 'Task deleted successfully',
    };
  }

  // Timer operations
  async getTaskTimer(userId: string, taskId: string): Promise<TaskView> {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw new NotFoundError('Task not found or access denied');
    }
    return taskTimerService.getTaskView(taskId, userId);
  }

  async startTaskTimer(userId: string, taskId: string): Promise<TaskView> {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw new NotFoundError('Task not found or access denied');
    }
    return taskTimerService.startTask(taskId, userId);
  }

  async pauseTaskTimer(userId: string, taskId: string): Promise<TaskView> {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw new NotFoundError('Task not found or access denied');
    }

    const currentStatus = task.timerStatus;
    if (currentStatus !== 'running') {
      throw new BadRequestError('Task is not running');
    }

    return taskTimerService.pauseTask(taskId, userId);
  }

  async resumeTaskTimer(userId: string, taskId: string): Promise<TaskView> {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw new NotFoundError('Task not found or access denied');
    }

    const currentStatus = task.timerStatus;
    if (currentStatus !== 'paused') {
      throw new BadRequestError('Task is not paused');
    }

    return taskTimerService.resumeTask(taskId, userId);
  }

  async stopTaskTimer(userId: string, taskId: string): Promise<TaskView> {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw new NotFoundError('Task not found or access denied');
    }
    return taskTimerService.stopTask(taskId, userId);
  }
}

export const tasksController = new TasksController();

