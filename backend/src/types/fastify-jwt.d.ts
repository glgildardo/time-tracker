// Type augmentation for @fastify/jwt to type request.user and JWT payload
import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string };
    user: { id: string; email: string; name: string };
  }
}


