import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { TimeEntry } from '../models/TimeEntry';
import { Task } from '../models/Task';
import { authenticateToken } from '../middleware/auth';

// Validation schemas
const startTimerSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
});

const stopTimerSchema = z.object({
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
});

const updateTimeEntrySchema = z.object({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
});

const getTimeEntriesQuerySchema = z.object({
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});

export default async (fastify: FastifyInstance): Promise<void> => {
  // Start timer for a task
  fastify.post(
    '/time-entries/start',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Start a timer for a specific task',
        tags: ['Time Entries'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['taskId'],
          properties: {
            taskId: { type: 'string'},
            description: { type: 'string', maxLength: 500},
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              message: { type: 'string'},
              timeEntry: { $ref: 'TimeEntry#' },
            },
          },
          400: { $ref: 'Error#' },
          401: { $ref: 'Error#' },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        // Validate request body
        const validationResult = startTimerSchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: validationResult.error.errors,
          });
        }

        const { taskId, description } = validationResult.data;

        // Verify the task belongs to the user
        const task = await Task.findOne({
          _id: taskId,
          userId: request.user.id,
        });

        if (!task) {
          return reply.status(404).send({
            error: 'Task not found',
            message: 'Task does not exist or you do not have access to it',
          });
        }

        // Check if there's already an active timer
        const activeTimer = await TimeEntry.findOne({
          userId: request.user.id,
          endTime: { $exists: false },
        });

        if (activeTimer) {
          return reply.status(400).send({
            error: 'Timer already running',
            message:
              'You already have an active timer. Please stop it before starting a new one.',
          });
        }

        const timeEntry = new TimeEntry({
          taskId,
          userId: request.user.id,
          startTime: new Date(),
          description,
        });

        await timeEntry.save();
        await timeEntry.populate('taskId', 'name projectId');

        return reply.status(201).send({
          message: 'Timer started successfully',
          timeEntry,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to start timer',
        });
      }
    }
  );

  // Stop active timer
  fastify.post(
    '/time-entries/stop',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Stop the currently active timer',
        tags: ['Time Entries'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            description: { type: 'string', maxLength: 500},
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string'},
              timeEntry: { $ref: 'TimeEntry#' },
            },
          },
          400: { $ref: 'Error#' },
          401: { $ref: 'Error#' },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        // Validate request body (optional)
        const validationResult = stopTimerSchema.safeParse(request.body || {});
        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: validationResult.error.errors,
          });
        }

        const { description } = validationResult.data;

        // Find the active timer
        const activeTimer = await TimeEntry.findOne({
          userId: request.user.id,
          endTime: { $exists: false },
        });

        if (!activeTimer) {
          return reply.status(404).send({
            error: 'No active timer',
            message: 'No active timer found to stop',
          });
        }

        // Update the timer with end time
        activeTimer.endTime = new Date();
        if (description) {
          activeTimer.description = description;
        }

        await activeTimer.save();
        await activeTimer.populate('taskId', 'name projectId');

        return reply.send({
          message: 'Timer stopped successfully',
          timeEntry: activeTimer,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to stop timer',
        });
      }
    }
  );

  // Get currently active timer
  fastify.get(
    '/time-entries/active',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Get the currently active timer',
        tags: ['Time Entries'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              timeEntry: {
                oneOf: [
                  { $ref: 'TimeEntry#' },
                  { type: 'null' }
                ]
              },
            },
          },
          401: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const activeTimer = await TimeEntry.findOne({
          userId: request.user.id,
          endTime: { $exists: false },
        }).populate('taskId', 'name projectId');

        if (!activeTimer) {
          return reply.send({
            timeEntry: null,
          });
        }

        return reply.send({
          timeEntry: activeTimer,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch active timer',
        });
      }
    }
  );

  // Get time entries with filters
  fastify.get(
    '/time-entries',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Get time entries with optional filters',
        tags: ['Time Entries'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            projectId: { type: 'string'},
            taskId: { type: 'string'},
            startDate: { type: 'string', format: 'date-time'},
            endDate: { type: 'string', format: 'date-time'},
            limit: { type: 'string', default: '50'},
            offset: { type: 'string', default: '0'},
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              timeEntries: {
                type: 'array',
                items: { $ref: 'TimeEntry#' },
              },
              total: { type: 'number'},
              limit: { type: 'number'},
              offset: { type: 'number'},
            },
          },
          401: { $ref: 'Error#' },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const { projectId, taskId, startDate, endDate, limit, offset } =
          request.query as z.infer<typeof getTimeEntriesQuerySchema>;

        const filter: {
          userId: string;
          taskId?: string | { $in: string[] };
          startTime?: { $gte?: Date; $lte?: Date };
        } = { userId: request.user.id };

        // Add task filter
        if (taskId) {
          const task = await Task.findOne({
            _id: taskId,
            userId: request.user.id,
          });

          if (!task) {
            return reply.status(404).send({
              error: 'Task not found',
              message: 'Task does not exist or you do not have access to it',
            });
          }

          filter.taskId = taskId;
        } else if (projectId) {
          // Filter by project - get all tasks in the project
          const tasks = await Task.find({
            projectId,
            userId: request.user.id,
          });

          if (tasks.length === 0) {
            return reply.send({
              timeEntries: [],
              total: 0,
            });
          }

          filter.taskId = { $in: tasks.map(task => (task._id as string).toString()) };
        }

        // Add date filters
        if (startDate || endDate) {
          filter.startTime = {};
          if (startDate) {
            filter.startTime.$gte = new Date(startDate);
          }
          if (endDate) {
            filter.startTime.$lte = new Date(endDate);
          }
        }

        const total = await TimeEntry.countDocuments(filter);
        const timeEntries = await TimeEntry.find(filter)
          .populate('taskId', 'name projectId')
          .sort({ startTime: -1 })
          .limit(limit)
          .skip(offset);

        return reply.send({
          timeEntries,
          total,
          limit,
          offset,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch time entries',
        });
      }
    }
  );

  // Update a time entry
  fastify.put(
    '/time-entries/:id',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Update a time entry',
        tags: ['Time Entries'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string'},
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            startTime: { type: 'string', format: 'date-time'},
            endTime: { type: 'string', format: 'date-time'},
            description: { type: 'string', maxLength: 500},
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string'},
              timeEntry: { $ref: 'TimeEntry#' },
            },
          },
          400: { $ref: 'Error#' },
          401: { $ref: 'Error#' },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };

        // Validate request body
        const validationResult = updateTimeEntrySchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: validationResult.error.errors,
          });
        }

        const updateData = validationResult.data;

        const timeEntry = await TimeEntry.findOne({
          _id: id,
          userId: request.user.id,
        });

        if (!timeEntry) {
          return reply.status(404).send({
            error: 'Time entry not found',
            message:
              'Time entry does not exist or you do not have access to it',
          });
        }

        // Convert date strings to Date objects (without changing types in updateData)
        const parsedStartTime = updateData.startTime ? new Date(updateData.startTime) : undefined;
        const parsedEndTime = updateData.endTime ? new Date(updateData.endTime) : undefined;

        // Validate that end time is after start time
        const startTime = parsedStartTime || timeEntry.startTime;
        const endTime = parsedEndTime || timeEntry.endTime;

        if (endTime && startTime && endTime <= startTime) {
          return reply.status(400).send({
            error: 'Invalid time range',
            message: 'End time must be after start time',
          });
        }

        // TODO: REVIEW IF TIME ENTRIES ARE NOT WORKING AS EXPECTED
        Object.assign(timeEntry, {
          ...updateData,
          startTime,
          endTime,
        });
        await timeEntry.save();
        await timeEntry.populate('taskId', 'name projectId');

        return reply.send({
          message: 'Time entry updated successfully',
          timeEntry,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update time entry',
        });
      }
    }
  );

  // Delete a time entry
  fastify.delete(
    '/time-entries/:id',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Delete a time entry',
        tags: ['Time Entries'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string'},
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string'},
            },
          },
          401: { $ref: 'Error#' },
          404: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };

        const timeEntry = await TimeEntry.findOne({
          _id: id,
          userId: request.user.id,
        });

        if (!timeEntry) {
          return reply.status(404).send({
            error: 'Time entry not found',
            message:
              'Time entry does not exist or you do not have access to it',
          });
        }

        await TimeEntry.deleteOne({ _id: id });

        return reply.send({
          message: 'Time entry deleted successfully',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete time entry',
        });
      }
    }
  );
};
