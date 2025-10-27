import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';
import { taskStreamBroadcaster } from '../services/taskStreamBroadcaster';
import { BadRequestError } from '../utils/errorHandler';

class TaskStreamController {
  async streamTaskUpdates(_request: FastifyRequest, reply: FastifyReply, taskId: string) {
    if (!taskId) {
      throw new BadRequestError('taskId query parameter is required');
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

    // Keep connection alive
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
  }

  async authenticateStream(request: FastifyRequest, _reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    const headerToken = authHeader && authHeader.split(' ')[1];
    const { token: queryToken } = (request.query as { token?: string }) ?? {};

    const token = headerToken || queryToken;
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new Error('Invalid token');
    }

    request.user = {
      id: String(user._id),
      email: user.email,
      name: user.name,
    };
  }
}

export const taskStreamController = new TaskStreamController();

