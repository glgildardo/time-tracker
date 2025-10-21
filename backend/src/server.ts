import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
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

  // Health check endpoint
  server.get('/health', async () => {
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
