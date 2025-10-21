import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { User } from '../models/User';
import { hashPassword, comparePassword, generateToken } from '../utils/jwt';
import { authenticateToken } from '../middleware/auth';

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
  fastify.post('/register', async (request, reply) => {
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

      const { email, password, name } = validationResult.data;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return reply.status(400).send({
          error: 'User already exists',
          message: 'A user with this email already exists',
        });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = new User({
        email,
        password: hashedPassword,
        name,
      });

      await user.save();

      // Generate token
      const token = generateToken((user._id as string).toString());

      return reply.status(201).send({
        message: 'User created successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to create user',
      });
    }
  });

  // Login endpoint
  fastify.post('/login', async (request, reply) => {
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

      const { email, password } = validationResult.data;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return reply.status(401).send({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        });
      }

      // Compare password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return reply.status(401).send({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        });
      }

      // Generate token
      const token = generateToken((user._id as string).toString());

      return reply.send({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to login',
      });
    }
  });

  // Get current user endpoint (protected)
  fastify.get(
    '/me',
    {
      preHandler: authenticateToken,
    },
    async (request: FastifyRequest, reply) => {
      try {
        const user = await User.findById(request.user!.id).select('-password');

        if (!user) {
          return reply.status(404).send({
            error: 'User not found',
            message: 'User does not exist',
          });
        }

        return reply.send({
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get user data',
        });
      }
    }
  );
};
