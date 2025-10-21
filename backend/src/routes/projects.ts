import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { TimeEntry } from '../models/TimeEntry';
import { authenticateToken } from '../middleware/auth';

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

const updateProjectSchema = createProjectSchema.partial();

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
        const projects = await Project.find({ userId: request.user.id }).sort({
          createdAt: -1,
        });

        return reply.send({
          projects,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch projects',
        });
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

        const { name, description, color, client, status, budget } = validationResult.data;

        // Check if project with same name already exists for this user
        const existingProject = await Project.findOne({
          userId: request.user.id,
          name,
        });

        if (existingProject) {
          return reply.status(400).send({
            error: 'Project already exists',
            message: 'A project with this name already exists',
          });
        }

        const project = new Project({
          name,
          description,
          color,
          client,
          status,
          budget,
          userId: request.user.id,
        });

        await project.save();

        return reply.status(201).send({
          message: 'Project created successfully',
          project,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create project',
        });
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

        const project = await Project.findOne({
          _id: id,
          userId: request.user.id,
        });

        if (!project) {
          return reply.status(404).send({
            error: 'Project not found',
            message: 'Project does not exist or you do not have access to it',
          });
        }

        return reply.send({
          project,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch project',
        });
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

        const updateData = validationResult.data;

        const project = await Project.findOne({
          _id: id,
          userId: request.user.id,
        });

        if (!project) {
          return reply.status(404).send({
            error: 'Project not found',
            message: 'Project does not exist or you do not have access to it',
          });
        }

        // Check if name is being updated and if it conflicts with existing project
        if (updateData.name && updateData.name !== project.name) {
          const existingProject = await Project.findOne({
            userId: request.user.id,
            name: updateData.name,
            _id: { $ne: id },
          });

          if (existingProject) {
            return reply.status(400).send({
              error: 'Project name already exists',
              message: 'A project with this name already exists',
            });
          }
        }

        Object.assign(project, updateData);
        await project.save();

        return reply.send({
          message: 'Project updated successfully',
          project,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update project',
        });
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

        const project = await Project.findOne({
          _id: id,
          userId: request.user.id,
        });

        if (!project) {
          return reply.status(404).send({
            error: 'Project not found',
            message: 'Project does not exist or you do not have access to it',
          });
        }

        // Delete all associated tasks and time entries
        await Task.deleteMany({ projectId: id });
        await TimeEntry.deleteMany({
          taskId: { $in: await Task.find({ projectId: id }).distinct('_id') },
        });
        await Project.deleteOne({ _id: id });

        return reply.send({
          message: 'Project deleted successfully',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete project',
        });
      }
    }
  );
};
