import { FastifyInstance, FastifyRequest } from 'fastify';
import { authenticateToken } from '../middleware/auth';
import { taskTimerService } from '../services/taskTimer.service';
import { taskStreamBroadcaster } from '../services/taskStreamBroadcaster';

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.get(
    '/tasks/:id/timer',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Get current task timer view',
        tags: ['Task Timer'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              taskView: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string' },
                  timerStatus: { type: 'string', enum: ['idle', 'running', 'paused', 'stopped'] },
                  accumulatedSeconds: { type: 'number' },
                  runningSessionStartAt: { type: 'string' },
                  serverNow: { type: 'string' },
                },
              },
            },
          },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const taskView = await taskTimerService.getTaskView(id, request.user.id);
        return reply.send({ taskView });
      } catch (error: any) {
        if (error.message === 'Task not found or access denied') {
          return reply.status(404).send({
            error: 'Task not found',
            message: error.message,
          });
        }
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch task timer view',
        });
      }
    }
  );

  fastify.post(
    '/tasks/:id/timer/start',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Start task timer (idempotent)',
        tags: ['Task Timer'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              taskView: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string' },
                  timerStatus: { type: 'string', enum: ['idle', 'running', 'paused', 'stopped'] },
                  accumulatedSeconds: { type: 'number' },
                  runningSessionStartAt: { type: 'string' },
                  serverNow: { type: 'string' },
                },
              },
            },
          },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const taskView = await taskTimerService.startTask(id, request.user.id);
        taskStreamBroadcaster.broadcast(id, taskView);
        return reply.send({ taskView });
      } catch (error: any) {
        if (error.message === 'Task not found or access denied') {
          return reply.status(404).send({
            error: 'Task not found',
            message: error.message,
          });
        }
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to start timer',
        });
      }
    }
  );

  fastify.post(
    '/tasks/:id/timer/pause',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Pause task timer',
        tags: ['Task Timer'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              taskView: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string' },
                  timerStatus: { type: 'string', enum: ['idle', 'running', 'paused', 'stopped'] },
                  accumulatedSeconds: { type: 'number' },
                  runningSessionStartAt: { type: 'string' },
                  serverNow: { type: 'string' },
                },
              },
            },
          },
          400: { $ref: 'Error#' },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const taskView = await taskTimerService.pauseTask(id, request.user.id);
        taskStreamBroadcaster.broadcast(id, taskView);
        return reply.send({ taskView });
      } catch (error: any) {
        if (error.message === 'Task not found or access denied') {
          return reply.status(404).send({
            error: 'Task not found',
            message: error.message,
          });
        }
        if (error.message === 'Task is not running') {
          return reply.status(400).send({
            error: 'Bad Request',
            message: error.message,
          });
        }
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to pause timer',
        });
      }
    }
  );

  fastify.post(
    '/tasks/:id/timer/resume',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Resume task timer',
        tags: ['Task Timer'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              taskView: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string' },
                  timerStatus: { type: 'string', enum: ['idle', 'running', 'paused', 'stopped'] },
                  accumulatedSeconds: { type: 'number' },
                  runningSessionStartAt: { type: 'string' },
                  serverNow: { type: 'string' },
                },
              },
            },
          },
          400: { $ref: 'Error#' },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const taskView = await taskTimerService.resumeTask(id, request.user.id);
        taskStreamBroadcaster.broadcast(id, taskView);
        return reply.send({ taskView });
      } catch (error: any) {
        if (error.message === 'Task not found or access denied') {
          return reply.status(404).send({
            error: 'Task not found',
            message: error.message,
          });
        }
        if (error.message === 'Task is not paused') {
          return reply.status(400).send({
            error: 'Bad Request',
            message: error.message,
          });
        }
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to resume timer',
        });
      }
    }
  );

  fastify.post(
    '/tasks/:id/timer/stop',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Stop task timer',
        tags: ['Task Timer'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              taskView: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string' },
                  timerStatus: { type: 'string', enum: ['idle', 'running', 'paused', 'stopped'] },
                  accumulatedSeconds: { type: 'number' },
                  runningSessionStartAt: { type: 'string' },
                  serverNow: { type: 'string' },
                },
              },
            },
          },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const taskView = await taskTimerService.stopTask(id, request.user.id);
        taskStreamBroadcaster.broadcast(id, taskView);
        return reply.send({ taskView });
      } catch (error: any) {
        if (error.message === 'Task not found or access denied') {
          return reply.status(404).send({
            error: 'Task not found',
            message: error.message,
          });
        }
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to stop timer',
        });
      }
    }
  );
};

