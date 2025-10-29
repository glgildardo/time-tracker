import { TimeEntry } from '../models/TimeEntry';
import { Task } from '../models/Task';
import { ValidationError, NotFoundError, BadRequestError } from '../utils/errorHandler';

interface StartTimerData {
  taskId: string;
  description?: string;
}

interface StopTimerData {
  description?: string;
}

interface UpdateTimeEntryData {
  startTime?: string;
  endTime?: string;
  description?: string;
}

interface GetTimeEntriesQuery {
  projectId?: string;
  taskId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

class TimeEntriesController {
  async startTimer(userId: string, data: StartTimerData) {
    const { taskId, description } = data;

    // Verify the task belongs to the user
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw new NotFoundError('Task does not exist or you do not have access to it');
    }

    // Check if there's already an active timer
    const activeTimer = await TimeEntry.findOne({
      userId,
      endTime: { $exists: false },
    });

    if (activeTimer) {
      throw new BadRequestError('You already have an active timer. Please stop it before starting a new one.');
    }

    const timeEntry = new TimeEntry({
      taskId,
      userId,
      startTime: new Date(),
      description,
    });

    await timeEntry.save();
    await timeEntry.populate('taskId', 'name projectId');

    return {
      message: 'Timer started successfully',
      timeEntry: timeEntry.toObject(),
    };
  }

  async stopTimer(userId: string, data: StopTimerData) {
    const { description } = data;

    // Find the active timer
    const activeTimer = await TimeEntry.findOne({
      userId,
      endTime: { $exists: false },
    });

    if (!activeTimer) {
      throw new NotFoundError('No active timer found to stop');
    }

    // Update the timer with end time
    activeTimer.endTime = new Date();
    if (description) {
      activeTimer.description = description;
    }

    await activeTimer.save();
    await activeTimer.populate('taskId', 'name projectId');

    return {
      message: 'Timer stopped successfully',
      timeEntry: activeTimer.toObject(),
    };
  }

  async getActiveTimer(userId: string) {
    const activeTimer = await TimeEntry.findOne({
      userId,
      endTime: { $exists: false },
    }).populate('taskId', 'name projectId');

    if (!activeTimer) {
      return { timeEntry: null };
    }

    // Build a plain serializable object that only includes defined fields
    const serialized: Record<string, unknown> = {
      _id: String(activeTimer._id),
      userId: String(activeTimer.userId),
      startTime: activeTimer.startTime instanceof Date
        ? activeTimer.startTime.toISOString()
        : String(activeTimer.startTime),
      status: activeTimer.status,
      createdAt: activeTimer.createdAt instanceof Date
        ? activeTimer.createdAt.toISOString()
        : String(activeTimer.createdAt),
      updatedAt: activeTimer.updatedAt instanceof Date
        ? activeTimer.updatedAt.toISOString()
        : String(activeTimer.updatedAt),
    };

    // taskId can be string or populated object
    const tId = (activeTimer as any).taskId;
    if (tId && typeof tId === 'object' && ('_id' in tId || 'name' in tId)) {
      const projectId = tId.projectId;
      serialized['taskId'] = {
        _id: String(tId._id ?? ''),
        name: tId.name,
        projectId: projectId && typeof projectId === 'object' && '_id' in projectId
          ? String(projectId._id)
          : (projectId != null ? String(projectId) : undefined),
      };
    } else if (tId != null) {
      serialized['taskId'] = String(tId);
    }

    if (activeTimer.endTime) {
      serialized['endTime'] = activeTimer.endTime instanceof Date
        ? activeTimer.endTime.toISOString()
        : String(activeTimer.endTime);
    }
    if (typeof activeTimer.duration === 'number') {
      serialized['duration'] = activeTimer.duration;
    }
    if (activeTimer.description) {
      serialized['description'] = activeTimer.description;
    }

    return { timeEntry: serialized };
  }

  async getTimeEntries(userId: string, query: GetTimeEntriesQuery) {
    const { projectId, taskId, startDate, endDate, limit = 50, offset = 0 } = query;

    const filter: {
      userId: string;
      taskId?: string | { $in: string[] };
      startTime?: { $gte?: Date; $lte?: Date };
    } = { userId };

    // Add task filter
    if (taskId) {
      const task = await Task.findOne({ _id: taskId, userId });
      if (!task) {
        throw new NotFoundError('Task does not exist or you do not have access to it');
      }
      filter.taskId = taskId;
    } else if (projectId) {
      // Filter by project - get all tasks in the project
      const tasks = await Task.find({ projectId, userId });
      if (tasks.length === 0) {
        return { timeEntries: [], total: 0 };
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
      .skip(offset)
      .lean();

    return { timeEntries, total, limit, offset };
  }

  async updateTimeEntry(userId: string, timeEntryId: string, data: UpdateTimeEntryData) {
    const timeEntry = await TimeEntry.findOne({ _id: timeEntryId, userId });

    if (!timeEntry) {
      throw new NotFoundError('Time entry does not exist or you do not have access to it');
    }

    const parsedStartTime = data.startTime ? new Date(data.startTime) : undefined;
    const parsedEndTime = data.endTime ? new Date(data.endTime) : undefined;

    // Validate that end time is after start time
    const startTime = parsedStartTime || timeEntry.startTime;
    const endTime = parsedEndTime || timeEntry.endTime;

    if (endTime && startTime && endTime <= startTime) {
      throw new ValidationError('End time must be after start time');
    }

    Object.assign(timeEntry, {
      ...data,
      startTime: parsedStartTime !== undefined ? parsedStartTime : timeEntry.startTime,
      endTime: parsedEndTime !== undefined ? parsedEndTime : timeEntry.endTime,
    });

    await timeEntry.save();
    await timeEntry.populate('taskId', 'name projectId');

    return {
      message: 'Time entry updated successfully',
      timeEntry: timeEntry.toObject(),
    };
  }

  async deleteTimeEntry(userId: string, timeEntryId: string) {
    const timeEntry = await TimeEntry.findOne({ _id: timeEntryId, userId });

    if (!timeEntry) {
      throw new NotFoundError('Time entry does not exist or you do not have access to it');
    }

    await TimeEntry.deleteOne({ _id: timeEntryId });

    return {
      message: 'Time entry deleted successfully',
    };
  }
}

export const timeEntriesController = new TimeEntriesController();

