import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { TimeEntry } from '../models/TimeEntry';
import { authenticateToken } from '../middleware/auth';

// Validation schemas
const createTaskSchema = z.object({
  name: z
    .string()
    .min(1, 'Task name is required')
    .max(100, 'Task name cannot exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  priority: z
    .enum(['low', 'medium', 'high', 'critical'], {
      errorMap: () => ({ message: 'Priority must be low, medium, high, or critical' }),
    })
    .default('medium'),
  status: z
    .enum(['pending', 'in-progress', 'completed'], {
      errorMap: () => ({ message: 'Status must be pending, in-progress, or completed' }),
    })
    .default('pending'),
  estimatedHours: z
    .number()
    .min(0, 'Estimated hours cannot be negative')
    .optional(),
});

const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });

const getTasksQuerySchema = z.object({
  projectId: z.string().optional(),
});

export default async (fastify: FastifyInstance): Promise<void> => {
  // Get all tasks for the authenticated user
  fastify.get(
    '/tasks',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Get all tasks for the authenticated user, optionally filtered by project',
        tags: ['Tasks'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            projectId: { type: 'string'},
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              tasks: {
                type: 'array',
                items: { $ref: 'TaskPopulated#' },
              },
            },
          },
          401: { $ref: 'Error#' },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const { projectId } = request.query as z.infer<
          typeof getTasksQuerySchema
        >;

        const filter: { userId: string; projectId?: string } = {
          userId: request.user.id,
        };
        if (projectId) {
          // Verify the project belongs to the user
          const project = await Project.findOne({
            _id: projectId,
            userId: request.user.id,
          });

          if (!project) {
            return reply.status(404).send({
              error: 'Project not found',
              message: 'Project does not exist or you do not have access to it',
            });
          }

          filter.projectId = projectId;
        }

        const tasks = await Task.find(filter)
          .populate('projectId', 'name color')
          .sort({ createdAt: -1 })
          .lean();

        return reply.send({
          tasks,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch tasks',
        });
      }
    }
  );

  // Create a new task
  fastify.post(
    '/tasks',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Create a new task',
        tags: ['Tasks'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'projectId'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100},
            description: { type: 'string', maxLength: 500},
            projectId: { type: 'string'},
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical']},
            status: { type: 'string', enum: ['pending', 'in-progress', 'completed']},
            estimatedHours: { type: 'number', minimum: 0},
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              message: { type: 'string'},
              task: { $ref: 'TaskPopulated#' },
            },
          },
          400: { $ref: 'Error#' },
          401: { $ref: 'Error#' },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        // Validate request body
        const validationResult = createTaskSchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: validationResult.error.errors,
          });
        }

        const { name, description, projectId, priority, status, estimatedHours } = validationResult.data;

        // Verify the project belongs to the user
        const project = await Project.findOne({
          _id: projectId,
          userId: request.user.id,
        });

        if (!project) {
          return reply.status(404).send({
            error: 'Project not found',
            message: 'Project does not exist or you do not have access to it',
          });
        }

        // Check if task with same name already exists in this project
        const existingTask = await Task.findOne({
          userId: request.user.id,
          projectId,
          name,
        });

        if (existingTask) {
          return reply.status(400).send({
            error: 'Task already exists',
            message: 'A task with this name already exists in this project',
          });
        }

        const task = new Task({
          name,
          description,
          projectId,
          priority,
          status,
          estimatedHours,
          userId: request.user.id,
        });

        await task.save();
        await task.populate('projectId', 'name color');

        return reply.status(201).send({
          message: 'Task created successfully',
          task: task.toObject(),
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create task',
        });
      }
    }
  );

  // Get a specific task
  fastify.get(
    '/tasks/:id',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Get a specific task by ID',
        tags: ['Tasks'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string'},
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              task: { $ref: 'TaskPopulated#' },
            },
          },
          401: { $ref: 'Error#' },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };

        const task = await Task.findOne({
          _id: id,
          userId: request.user.id,
        })
          .populate('projectId', 'name color')
          .lean();

        if (!task) {
          return reply.status(404).send({
            error: 'Task not found',
            message: 'Task does not exist or you do not have access to it',
          });
        }

        return reply.send({
          task,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch task',
        });
      }
    }
  );

  // Update a task
  fastify.put(
    '/tasks/:id',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Update a task',
        tags: ['Tasks'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string'},
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100},
            description: { type: 'string', maxLength: 500},
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical']},
            status: { type: 'string', enum: ['pending', 'in-progress', 'completed']},
            estimatedHours: { type: 'number', minimum: 0},
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string'},
              task: { $ref: 'TaskPopulated#' },
            },
          },
          400: { $ref: 'Error#' },
          401: { $ref: 'Error#' },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };

        // Validate request body
        const validationResult = updateTaskSchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: validationResult.error.errors,
          });
        }

        const updateData = validationResult.data;

        const task = await Task.findOne({
          _id: id,
          userId: request.user.id,
        });

        if (!task) {
          return reply.status(404).send({
            error: 'Task not found',
            message: 'Task does not exist or you do not have access to it',
          });
        }

        // Check if name is being updated and if it conflicts with existing task
        if (updateData.name && updateData.name !== task.name) {
          const existingTask = await Task.findOne({
            userId: request.user.id,
            projectId: task.projectId,
            name: updateData.name,
            _id: { $ne: id },
          });

          if (existingTask) {
            return reply.status(400).send({
              error: 'Task name already exists',
              message: 'A task with this name already exists in this project',
            });
          }
        }

        Object.assign(task, updateData);
        await task.save();
        await task.populate('projectId', 'name color');

        return reply.send({
          message: 'Task updated successfully',
          task: task.toObject(),
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update task',
        });
      }
    }
  );

  // Delete a task
  fastify.delete(
    '/tasks/:id',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Delete a task and all associated time entries',
        tags: ['Tasks'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string'},
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string'},
            },
          },
          401: { $ref: 'Error#' },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };

        const task = await Task.findOne({
          _id: id,
          userId: request.user.id,
        });

        if (!task) {
          return reply.status(404).send({
            error: 'Task not found',
            message: 'Task does not exist or you do not have access to it',
          });
        }

        // Delete all associated time entries
        await TimeEntry.deleteMany({ taskId: id });
        await Task.deleteOne({ _id: id });

        return reply.send({
          message: 'Task deleted successfully',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete task',
        });
      }
    }
  );
};
