import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { TimeEntry } from '../models/TimeEntry';
import { Task } from '../models/Task';
import { authenticateToken } from '../middleware/auth';
import { timeEntriesController } from '../controllers/timeEntries.controller';
import { NotFoundError, ValidationError } from '../utils/errorHandler';

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
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateFilter: z.enum(['day', 'week', 'month', 'all']).optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

const weeklySummaryQuerySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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
              timeEntry: { $ref: 'TimeEntryPopulated#' },
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
          timeEntry: timeEntry.toObject(),
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
              timeEntry: { $ref: 'TimeEntryPopulated#' },
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
          timeEntry: activeTimer.toObject(),
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
                  { 
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      taskId: { 
                        oneOf: [
                          { type: 'string' },
                          { type: 'object' }
                        ]
                      },
                      userId: { type: 'string' },
                      startTime: { type: 'string', format: 'date-time' },
                      endTime: { type: 'string', format: 'date-time' },
                      duration: { type: 'number' },
                      description: { type: 'string' },
                      status: { type: 'string', enum: ['in-progress', 'completed'] },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                  },
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

        // Build a plain serializable object that only includes defined fields
        const serialized: Record<string, unknown> = {
          _id: String((activeTimer as any)._id),
          userId: String((activeTimer as any).userId),
          startTime: (activeTimer as any).startTime instanceof Date
            ? (activeTimer as any).startTime.toISOString()
            : String((activeTimer as any).startTime),
          status: (activeTimer as any).status,
          createdAt: (activeTimer as any).createdAt instanceof Date
            ? (activeTimer as any).createdAt.toISOString()
            : String((activeTimer as any).createdAt),
          updatedAt: (activeTimer as any).updatedAt instanceof Date
            ? (activeTimer as any).updatedAt.toISOString()
            : String((activeTimer as any).updatedAt),
        };

        // taskId can be string or populated object
        const tId = (activeTimer as any).taskId;
        if (tId && typeof tId === 'object' && ('_id' in tId || 'name' in tId)) {
          const projectId = (tId as any).projectId;
          (serialized as any).taskId = {
            _id: String((tId as any)._id ?? ''),
            name: (tId as any).name,
            projectId: projectId && typeof projectId === 'object' && '_id' in projectId
              ? String((projectId as any)._id)
              : (projectId != null ? String(projectId) : undefined),
          };
        } else if (tId != null) {
          (serialized as any).taskId = String(tId);
        }

        if ((activeTimer as any).endTime) {
          (serialized as any).endTime = (activeTimer as any).endTime instanceof Date
            ? (activeTimer as any).endTime.toISOString()
            : String((activeTimer as any).endTime);
        }
        if (typeof (activeTimer as any).duration === 'number') {
          (serialized as any).duration = (activeTimer as any).duration;
        }
        if ((activeTimer as any).description) {
          (serialized as any).description = (activeTimer as any).description;
        }

        return reply.send({ timeEntry: serialized });
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
            startDate: { type: 'string', format: 'date'},
            endDate: { type: 'string', format: 'date'},
            dateFilter: { type: 'string', enum: ['day', 'week', 'month', 'all']},
            limit: { type: 'string', default: '50'},
            offset: { type: 'string', default: '0'},
            orderDirection: { type: 'string', enum: ['asc', 'desc'], default: 'desc'},
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              timeEntries: {
                type: 'array',
                items: { $ref: 'TimeEntryPopulated#' },
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
        // Validate query parameters
        const validationResult = getTimeEntriesQuerySchema.safeParse(request.query);
        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid query parameters',
            details: validationResult.error.errors,
          });
        }

        const { projectId, taskId, startDate, endDate, dateFilter, limit, offset, orderDirection } =
          validationResult.data;

        const query: {
          projectId?: string;
          taskId?: string;
          startDate?: string;
          endDate?: string;
          dateFilter?: 'day' | 'week' | 'month' | 'all';
          limit: number;
          offset: number;
          orderDirection: 'asc' | 'desc';
        } = {
          limit,
          offset,
          orderDirection,
        };

        if (projectId) query.projectId = projectId;
        if (taskId) query.taskId = taskId;
        if (startDate) query.startDate = startDate;
        if (endDate) query.endDate = endDate;
        if (dateFilter) query.dateFilter = dateFilter;

        const result = await timeEntriesController.getTimeEntries(request.user.id, query);

        return reply.send(result);
      } catch (error: unknown) {
        fastify.log.error(error);
        
        // Handle known errors
        if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: 'Not Found',
            message: error.message,
          });
        }

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
              timeEntry: { $ref: 'TimeEntryPopulated#' },
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
          timeEntry: timeEntry.toObject(),
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

  // Get weekly summary
  fastify.get(
    '/time-entries/weekly-summary',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Get weekly summary of time entries grouped by task',
        tags: ['Time Entries'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            weekStart: { type: 'string', format: 'date', description: 'Week start date (YYYY-MM-DD). Defaults to current week.' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              weekStart: { type: 'string', format: 'date-time' },
              weekEnd: { type: 'string', format: 'date-time' },
              taskSummaries: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    taskId: { type: 'string' },
                    taskName: { type: 'string' },
                    projectId: { type: 'string' },
                    projectName: { type: 'string' },
                    totalHours: { type: 'number' },
                    totalSeconds: { type: 'number' },
                    entryCount: { type: 'number' },
                  },
                },
              },
              totalHours: { type: 'number' },
              totalEntries: { type: 'number' },
            },
          },
          400: { $ref: 'Error#' },
          401: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        // Validate query parameters
        const validationResult = weeklySummaryQuerySchema.safeParse(request.query);
        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid query parameters',
            details: validationResult.error.errors,
          });
        }

        const { weekStart } = validationResult.data;
        const result = await timeEntriesController.getWeeklySummary(request.user.id, weekStart);

        return reply.send(result);
      } catch (error: unknown) {
        fastify.log.error(error);
        
        if (error instanceof ValidationError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: error.message,
          });
        }

        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch weekly summary',
        });
      }
    }
  );

  // Export weekly summary as CSV
  fastify.get(
    '/time-entries/weekly-summary/csv',
    {
      preHandler: authenticateToken,
      schema: {
        description: 'Export weekly summary as CSV file',
        tags: ['Time Entries'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            weekStart: { type: 'string', format: 'date', description: 'Week start date (YYYY-MM-DD). Defaults to current week.' },
          },
        },
        response: {
          200: {
            type: 'string',
            contentEncoding: 'binary',
            contentMediaType: 'text/csv',
          },
          400: { $ref: 'Error#' },
          401: { $ref: 'Error#' },
          500: { $ref: 'Error#' },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        // Validate query parameters
        const validationResult = weeklySummaryQuerySchema.safeParse(request.query);
        if (!validationResult.success) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid query parameters',
            details: validationResult.error.errors,
          });
        }

        const { weekStart } = validationResult.data;
        const entries = await timeEntriesController.getWeeklySummaryEntries(request.user.id, weekStart);

        // Generate CSV content
        const headers = ['Task Name', 'Project Name', 'Date', 'Start Time', 'End Time', 'Duration (hours)', 'Description'];
        const csvRows = [
          headers.join(','),
          ...entries.map((entry) => {
            // Escape commas and quotes in CSV values
            const escapeCsv = (value: string) => {
              if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            };
            
            return [
              escapeCsv(entry.taskName),
              escapeCsv(entry.projectName),
              entry.date,
              entry.startTime,
              entry.endTime,
              entry.durationHours,
              escapeCsv(entry.description),
            ].join(',');
          }),
        ];

        const csvContent = csvRows.join('\n');

        // Generate filename with week range
        const weekStartDate = weekStart ? new Date(weekStart) : new Date();
        const dayOfWeek = weekStartDate.getDay();
        const daysToSubtract = dayOfWeek;
        const actualWeekStart = new Date(weekStartDate);
        actualWeekStart.setDate(weekStartDate.getDate() - daysToSubtract);
        const weekEndDate = new Date(actualWeekStart);
        weekEndDate.setDate(actualWeekStart.getDate() + 6);
        
        const filename = `weekly-summary-${actualWeekStart.toISOString().split('T')[0]}-to-${weekEndDate.toISOString().split('T')[0]}.csv`;

        reply
          .header('Content-Type', 'text/csv')
          .header('Content-Disposition', `attachment; filename="${filename}"`)
          .send(csvContent);
      } catch (error: unknown) {
        fastify.log.error(error);
        
        if (error instanceof ValidationError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: error.message,
          });
        }

        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to generate CSV export',
        });
      }
    }
  );
};
