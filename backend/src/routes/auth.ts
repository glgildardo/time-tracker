import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { authController } from '../controllers/auth.controller';
import { handleError } from '../utils/errorHandler';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export default async (fastify: FastifyInstance): Promise<void> => {
  // Register endpoint
  fastify.post('/register', {
    schema: {
      description: 'Register a new user account',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string', minLength: 1, maxLength: 50 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string' },
            user: { $ref: 'User#' },
          },
        },
        400: { $ref: 'Error#' },
        500: { $ref: 'Error#' },
      },
    },
  }, async (request, reply) => {
    try {
      // Validate request body
      const validationResult = registerSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationResult.error.errors,
        });
      }

      const result = await authController.register(validationResult.data);
      return reply.status(201).send(result);
    } catch (error) {
      fastify.log.error(error);
      handleError(error, reply);
    }
  });

  // Login endpoint
  fastify.post('/login', {
    schema: {
      description: 'Authenticate user and get access token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email'},
          password: { type: 'string'},
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string'},
            token: { type: 'string'},
            user: { $ref: 'User#' },
          },
        },
        400: { $ref: 'Error#' },
        401: { $ref: 'Error#' },
        500: { $ref: 'Error#' },
      },
    },
  }, async (request, reply) => {
    try {
      // Validate request body
      const validationResult = loginSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationResult.error.errors,
        });
      }

      const result = await authController.login(validationResult.data);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      handleError(error, reply);
    }
  });

  // Get current user endpoint (protected)
  fastify.get(
    '/me',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Get current authenticated user information',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              user: { $ref: 'User#' },
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
        const result = await authController.getCurrentUser(request.user.id);
        return reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        handleError(error, reply);
      }
    }
  );
};
