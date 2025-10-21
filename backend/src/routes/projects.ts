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
});

const updateProjectSchema = createProjectSchema.partial();

export default async (fastify: FastifyInstance): Promise<void> => {
  // Get all projects for the authenticated user
  fastify.get(
    '/projects',
    {
      preHandler: authenticateToken,
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

        const { name, description, color } = validationResult.data;

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
