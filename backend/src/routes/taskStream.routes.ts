import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';
import { taskStreamBroadcaster } from '../services/taskStreamBroadcaster';

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.get(
    '/tasks/stream',
    {
      // Custom auth for SSE: allow token via Authorization header OR token query param
      preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const authHeader = request.headers.authorization;
          const headerToken = authHeader && authHeader.split(' ')[1];
          const { token: queryToken } = (request.query as { token?: string }) ?? {};

          const token = headerToken || queryToken;
          if (!token) {
            return reply.status(401).send({ error: 'Access Denied', message: 'No token provided' });
          }

          const decoded = verifyToken(token);
          const user = await User.findById(decoded.userId).select('-password');
          if (!user) {
            return reply.status(401).send({ error: 'Access Denied', message: 'Invalid token' });
          }

          request.user = {
            id: String(user._id),
            email: user.email,
            name: user.name,
          };
        } catch (err) {
          return reply.status(401).send({ error: 'Access Denied', message: 'Invalid token' });
        }
      },
    },
    async (request: FastifyRequest, reply) => {
      const { taskId } = request.query as { taskId?: string };

      if (!taskId) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'taskId query parameter is required',
        });
      }

      // Set SSE headers
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('X-Accel-Buffering', 'no');

      // Subscribe to task updates
      taskStreamBroadcaster.subscribe(taskId, reply);

      // Send initial connection message
      reply.raw.write(':connected\n\n');

      // Keep connection alive (client may not receive close event reliably)
      const keepAliveInterval = setInterval(() => {
        try {
          reply.raw.write(':ping\n\n');
        } catch (error) {
          clearInterval(keepAliveInterval);
        }
      }, 25000);

      // Clean up on client disconnect
      reply.raw.on('close', () => {
        clearInterval(keepAliveInterval);
        taskStreamBroadcaster.unsubscribe(taskId, reply);
      });

      // Don't call reply.send() - connection stays open
    }
  );
};

