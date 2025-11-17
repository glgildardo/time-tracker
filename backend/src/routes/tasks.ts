import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { tasksController } from '../controllers/tasks.controller';
import { handleError } from '../utils/errorHandler';

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
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
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
            search: { type: 'string'},
            limit: { type: 'number', minimum: 1, maximum: 100},
            offset: { type: 'number', minimum: 0},
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
              total: { type: 'number'},
              limit: { type: 'number'},
              offset: { type: 'number'},
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
        const { projectId, search, limit, offset } = request.query as z.infer<
          typeof getTasksQuerySchema
        >;
        const result = await tasksController.getAllTasks(
          request.user.id, 
          projectId, 
          search,
          limit,
          offset
        );
        return reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        handleError(error, reply);
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

        const result = await tasksController.createTask(request.user.id, validationResult.data);
        return reply.status(201).send(result);
      } catch (error) {
        fastify.log.error(error);
        handleError(error, reply);
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
        const result = await tasksController.getTaskById(request.user.id, id);
        return reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        handleError(error, reply);
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

        const result = await tasksController.updateTask(request.user.id, id, validationResult.data);
        return reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        handleError(error, reply);
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
        const result = await tasksController.deleteTask(request.user.id, id);
        return reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        handleError(error, reply);
      }
    }
  );
};
