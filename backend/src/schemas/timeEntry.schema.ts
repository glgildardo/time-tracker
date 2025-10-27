import { FastifyInstance } from 'fastify';

export async function registerTimeEntrySchemas(fastify: FastifyInstance) {
  // TimeEntryBase: taskId as string (ObjectId reference)
  fastify.addSchema({
    $id: 'TimeEntryBase',
    type: 'object',
    properties: {
      _id: { type: 'string' },
      taskId: { type: 'string' }, // <- base = ObjectId string
      userId: { type: 'string' },
      startTime: { type: 'string', format: 'date-time' },
      endTime: { type: 'string', format: 'date-time', nullable: true },
      duration: { type: 'number', nullable: true },
      description: { type: 'string', nullable: true },
      status: { type: 'string', enum: ['in-progress', 'completed'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['_id', 'taskId', 'userId', 'startTime', 'status', 'createdAt', 'updatedAt']
  });

  // TimeEntryPopulated: taskId as object (populated with name and projectId)
  fastify.addSchema({
    $id: 'TimeEntryPopulated',
    type: 'object',
    properties: {
      _id: { type: 'string' },
      taskId: { // <- populated = object
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          projectId: { type: 'string' }
        },
        required: ['_id', 'name']
      },
      userId: { type: 'string' },
      startTime: { type: 'string', format: 'date-time' },
      endTime: { type: 'string', format: 'date-time', nullable: true },
      duration: { type: 'number', nullable: true },
      description: { type: 'string', nullable: true },
      status: { type: 'string', enum: ['in-progress', 'completed'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['_id', 'taskId', 'userId', 'startTime', 'status', 'createdAt', 'updatedAt']
  });
}
