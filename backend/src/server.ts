import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config/environment';
import { database } from './config/database';

export const createServer = async (): Promise<FastifyInstance> => {
  const server = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // Register plugins
  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  await server.register(cors, {
    origin: config.FRONTEND_URL,
    credentials: true,
  });

  await server.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_TIME_WINDOW,
  });

  await server.register(jwt, {
    secret: config.JWT_SECRET,
    sign: {
      expiresIn: config.JWT_EXPIRES_IN,
    },
  });

  // Register shared JSON Schemas for AJV ($ref via $id)
  server.addSchema({
    $id: 'Error',
    type: 'object',
    properties: {
      error: { type: 'string' },
      message: { type: 'string' },
      details: { type: 'array', items: { type: 'object' } },
    },
  });

  server.addSchema({
    $id: 'User',
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  });

  server.addSchema({
    $id: 'Project',
    type: 'object',
    properties: {
      _id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      color: { type: 'string' },
      userId: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  });

  server.addSchema({
    $id: 'Task',
    type: 'object',
    properties: {
      _id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      projectId: { type: 'string' },
      userId: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  });

  server.addSchema({
    $id: 'TimeEntry',
    type: 'object',
    properties: {
      _id: { type: 'string' },
      taskId: { type: 'string' },
      userId: { type: 'string' },
      startTime: { type: 'string', format: 'date-time' },
      endTime: { type: 'string', format: 'date-time' },
      description: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  });

  // Swagger configuration
  await server.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Time Tracker API',
        description: 'A comprehensive API for managing projects, tasks, and time tracking',
        version: '1.0.0',
        contact: {
          name: 'Time Tracker Team',
          email: 'support@timetracker.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: `http://localhost:${config.PORT}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          Project: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              color: { type: 'string' },
              userId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          Task: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              projectId: { type: 'string' },
              userId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          TimeEntry: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              taskId: { type: 'string' },
              userId: { type: 'string' },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              description: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      tags: [
        { name: 'Authentication', description: 'User authentication endpoints' },
        { name: 'Projects', description: 'Project management endpoints' },
        { name: 'Tasks', description: 'Task management endpoints' },
        { name: 'Time Entries', description: 'Time tracking endpoints' },
        { name: 'Health', description: 'System health check endpoints' },
      ],
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (_request, _reply, next) {
        next();
      },
      preHandler: function (_request, _reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  // Health check endpoint
  server.get('/health', {
    schema: {
      description: 'Health check endpoint to verify server and database status',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string'},
            timestamp: { type: 'string', format: 'date-time' },
            database: { type: 'string', enum: ['connected', 'disconnected'] },
            environment: { type: 'string', enum: ['development', 'production', 'test'] },
          },
        },
      },
    },
  }, async () => {
    const dbStatus = database.getConnectionStatus();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected',
      environment: config.NODE_ENV,
    };
  });

  // Register API routes
  await server.register(import('./routes/auth'), { prefix: '/api/auth' });
  await server.register(import('./routes/projects'), { prefix: '/api' });
  await server.register(import('./routes/tasks'), { prefix: '/api' });
  await server.register(import('./routes/timeEntries'), { prefix: '/api' });

  // Error handling
  server.setErrorHandler((error, _request, reply) => {
    server.log.error(error);
    
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
      });
    }

    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        error: error.name || 'Error',
        message: error.message,
      });
    }

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: config.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    server.log.info(`Received ${signal}, shutting down gracefully`);
    try {
      await server.close();
      await database.disconnect();
      process.exit(0);
    } catch (error) {
      server.log.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
};
