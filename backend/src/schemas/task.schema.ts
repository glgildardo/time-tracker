import { FastifyInstance } from 'fastify';

export async function registerTaskSchemas(fastify: FastifyInstance) {
  // TaskBase: projectId as string (ObjectId reference)
  fastify.addSchema({
    $id: 'TaskBase',
    type: 'object',
    properties: {
      _id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string', nullable: true },
      projectId: { type: 'string' }, // <- base = ObjectId string
      userId: { type: 'string' },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      status: { type: 'string', enum: ['pending', 'in-progress', 'completed'] },
      estimatedHours: { type: 'number', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['_id', 'name', 'projectId', 'userId', 'priority', 'status', 'createdAt', 'updatedAt']
  });

  // TaskPopulated: projectId as object (populated with name and color)
  fastify.addSchema({
    $id: 'TaskPopulated',
    type: 'object',
    properties: {
      _id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string', nullable: true },
      projectId: { // <- populated = object
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          color: { type: 'string' }
        },
        required: ['_id', 'name', 'color']
      },
      userId: { type: 'string' },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      status: { type: 'string', enum: ['pending', 'in-progress', 'completed'] },
      estimatedHours: { type: 'number', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['_id', 'name', 'projectId', 'userId', 'priority', 'status', 'createdAt', 'updatedAt']
  });
}
