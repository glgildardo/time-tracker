import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { projectsController } from '../controllers/projects.controller';
import { handleError } from '../utils/errorHandler';

// Validation schemas
const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name cannot exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code')
    .default('#3B82F6'),
  client: z
    .string()
    .max(100, 'Client name cannot exceed 100 characters')
    .optional(),
  status: z
    .enum(['active', 'archived'], {
      errorMap: () => ({ message: 'Status must be active or archived' }),
    })
    .default('active'),
  budget: z
    .number()
    .min(0, 'Budget cannot be negative')
    .optional(),
});

const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name cannot exceed 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code')
    .optional(),
  client: z
    .string()
    .max(100, 'Client name cannot exceed 100 characters')
    .optional(),
  status: z
    .enum(['active', 'archived'], {
      errorMap: () => ({ message: 'Status must be active or archived' }),
    })
    .optional(),
  budget: z
    .number()
    .min(0, 'Budget cannot be negative')
    .optional(),
});

export default async (fastify: FastifyInstance): Promise<void> => {
  // Get all projects for the authenticated user
  fastify.get(
    '/projects',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Get all projects for the authenticated user',
        tags: ['Projects'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              projects: {
                type: 'array',
                items: { $ref: 'Project#' },
              },
            },
          },
          401: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const result = await projectsController.getAllProjects(request.user.id);
        return reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        handleError(error, reply);
      }
    }
  );

  // Create a new project
  fastify.post(
    '/projects',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Create a new project',
        tags: ['Projects'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100},
            description: { type: 'string', maxLength: 500},
            color: { type: 'string', pattern: '^#[0-9A-F]{6}$'},
            client: { type: 'string', maxLength: 100},
            status: { type: 'string', enum: ['active', 'archived']},
            budget: { type: 'number', minimum: 0},
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              message: { type: 'string'},
              project: { $ref: 'Project#' },
            },
          },
          400: { $ref: 'Error#' },
          401: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        // Validate request body
        const validationResult = createProjectSchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: validationResult.error.errors,
          });
        }

        const result = await projectsController.createProject(request.user.id, validationResult.data);
        return reply.status(201).send(result);
      } catch (error) {
        fastify.log.error(error);
        handleError(error, reply);
      }
    }
  );

  // Get a specific project
  fastify.get(
    '/projects/:id',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Get a specific project by ID',
        tags: ['Projects'],
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
              project: { $ref: 'Project#' },
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
        const result = await projectsController.getProjectById(request.user.id, id);
        return reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        handleError(error, reply);
      }
    }
  );

  // Update a project
  fastify.put(
    '/projects/:id',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Update a project',
        tags: ['Projects'],
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
            color: { type: 'string', pattern: '^#[0-9A-F]{6}$'},
            client: { type: 'string', maxLength: 100},
            status: { type: 'string', enum: ['active', 'archived']},
            budget: { type: 'number', minimum: 0},
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string'},
              project: { $ref: 'Project#' },
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
        const validationResult = updateProjectSchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: validationResult.error.errors,
          });
        }

        const result = await projectsController.updateProject(request.user.id, id, validationResult.data);
        return reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        handleError(error, reply);
      }
    }
  );

  // Delete a project
  fastify.delete(
    '/projects/:id',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Delete a project and all associated tasks and time entries',
        tags: ['Projects'],
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
        const result = await projectsController.deleteProject(request.user.id, id);
        return reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        handleError(error, reply);
      }
    }
  );
};
