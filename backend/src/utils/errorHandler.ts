import { FastifyReply } from 'fastify';

// Custom error classes
export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = 'Invalid input data',
    public details?: unknown
  ) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Access Denied') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
  }
}

// Error formatting utility
export function formatError(error: unknown): {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
} {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      error: error.code,
      message: error.message,
      details: 'details' in error ? error.details : undefined,
    };
  }

  // Unknown error
  return {
    statusCode: 500,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  };
}

// Error handler for routes
export function handleError(error: unknown, reply: FastifyReply): void {
  const formattedError = formatError(error);
  reply.status(formattedError.statusCode).send(formattedError);
}

