import { TimeEntry } from '../models/TimeEntry';
import { Task } from '../models/Task';
import { ValidationError, NotFoundError, BadRequestError } from '../utils/errorHandler';
import { getWeeklySummary, getWeeklySummaryEntries } from '../services/weeklySummary.service';
import { getDateRangeFromFilter, type DateFilterType } from '../utils/dateFilter';

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
  dateFilter?: DateFilterType;
  limit?: number;
  offset?: number;
  orderDirection?: 'asc' | 'desc';
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const { 
      projectId, 
      taskId, 
      startDate, 
      endDate,
      dateFilter,
      limit = 50, 
      offset = 0,
      orderDirection = 'desc'
    } = query;

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

    // Add date filters - dateFilter takes precedence over startDate/endDate
    if (dateFilter && dateFilter !== 'all') {
      const dateRange = getDateRangeFromFilter(dateFilter);
      if (dateRange) {
        filter.startTime = {};
        filter.startTime.$gte = new Date(dateRange.startDate);
        const endDateObj = new Date(dateRange.endDate);
        endDateObj.setHours(23, 59, 59, 999);
        filter.startTime.$lte = endDateObj;
      }
    } else if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) {
        filter.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        filter.startTime.$lte = endDateObj;
      }
    }

    const total = await TimeEntry.countDocuments(filter);
    const sortDirection = orderDirection === 'asc' ? 1 : -1;

    // Sort by date (startTime)
    const timeEntries = await TimeEntry.find(filter)
      .populate('taskId', 'name projectId')
      .sort({ startTime: sortDirection })
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

  async getWeeklySummary(userId: string, weekStart?: string) {
    // Validate weekStart format if provided (YYYY-MM-DD)
    if (weekStart) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(weekStart)) {
        throw new ValidationError('Invalid weekStart format. Expected YYYY-MM-DD');
      }
      
      // Validate that it's a valid date
      const date = new Date(weekStart);
      if (isNaN(date.getTime())) {
        throw new ValidationError('Invalid date provided for weekStart');
      }
    }

    const summary = await getWeeklySummary(userId, weekStart);
    
    return {
      weekStart: summary.weekStart.toISOString(),
      weekEnd: summary.weekEnd.toISOString(),
      taskSummaries: summary.taskSummaries,
      totalHours: Math.round(summary.totalHours * 100) / 100, // Round to 2 decimal places
      totalEntries: summary.totalEntries,
    };
  }

  async getWeeklySummaryEntries(userId: string, weekStart?: string) {
    // Validate weekStart format if provided (YYYY-MM-DD)
    if (weekStart) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(weekStart)) {
        throw new ValidationError('Invalid weekStart format. Expected YYYY-MM-DD');
      }
      
      // Validate that it's a valid date
      const date = new Date(weekStart);
      if (isNaN(date.getTime())) {
        throw new ValidationError('Invalid date provided for weekStart');
      }
    }

    return await getWeeklySummaryEntries(userId, weekStart);
  }
}

export const timeEntriesController = new TimeEntriesController();

