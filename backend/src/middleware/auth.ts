import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';

export const authenticateToken = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return reply.status(401).send({
        error: 'Access Denied',
        message: 'No token provided',
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return reply.status(401).send({
        error: 'Access Denied',
        message: 'Invalid token',
      });
    }

    request.user = {
      id: (user._id as string).toString(),
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    return reply.status(401).send({
      error: 'Access Denied',
      message: 'Invalid token',
    });
  }
};
