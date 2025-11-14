import { TimeEntry } from '../models/TimeEntry';
import { Task } from '../models/Task';

export interface TaskSummary {
  taskId: string;
  taskName: string;
  projectId?: string;
  projectName?: string;
  totalHours: number;
  totalSeconds: number;
  entryCount: number;
}

export interface WeeklySummaryResult {
  weekStart: Date;
  weekEnd: Date;
  taskSummaries: TaskSummary[];
  totalHours: number;
  totalEntries: number;
}

/**
 * Calculate the start and end of a week (Sunday-Saturday)
 */
function getWeekBounds(weekStartDate?: Date): { weekStart: Date; weekEnd: Date } {
  // Use current date/time if not provided
  const date = weekStartDate ? new Date(weekStartDate) : new Date();
  
  // Create a new date object to avoid mutating the input
  const workingDate = new Date(date);
  
  // Get the day of the week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = workingDate.getDay();
  
  // Calculate days to subtract to get to Sunday
  const daysToSubtract = dayOfWeek;
  
  // Set to start of day (00:00:00) in local timezone
  const weekStart = new Date(workingDate);
  weekStart.setDate(workingDate.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0);
  
  // Week end is Saturday 23:59:59.999
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
}

/**
 * Get weekly summary of time entries grouped by task
 */
export async function getWeeklySummary(
  userId: string,
  weekStartDate?: string
): Promise<WeeklySummaryResult> {
  // Parse weekStartDate if provided, otherwise use current week
  // When parsing YYYY-MM-DD format, create date in local timezone to avoid timezone shifts
  let date: Date | undefined;
  if (weekStartDate) {
    // Parse YYYY-MM-DD format as local date (not UTC)
    const parts = weekStartDate.split('-').map(Number);
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      if (year && month && day && !isNaN(year) && !isNaN(month) && !isNaN(day)) {
        date = new Date(year, month - 1, day); // month is 0-indexed
      }
    }
  }
  const { weekStart, weekEnd } = getWeekBounds(date);
  
  // Query time entries for the week (only completed entries with duration)
  const timeEntries = await TimeEntry.find({
    userId,
    startTime: {
      $gte: weekStart,
      $lte: weekEnd,
    },
    status: 'completed', // Only include completed entries
    duration: { $exists: true, $gt: 0 }, // Must have valid duration
  })
    .populate({
      path: 'taskId',
      select: 'name projectId',
      populate: {
        path: 'projectId',
        select: 'name',
      },
    })
    .lean();
  
  // Group entries by task and aggregate
  const taskMap = new Map<string, TaskSummary>();
  
  for (const entry of timeEntries) {
    // Get task info (could be populated or just ID)
    let taskId: string;
    let taskName = 'Unknown Task';
    let projectId: string | undefined;
    let projectName: string | undefined;
    
    if (entry.taskId && typeof entry.taskId === 'object' && '_id' in entry.taskId) {
      // Task is populated
      taskId = String((entry.taskId as any)._id);
      taskName = (entry.taskId as any).name || 'Unknown Task';
      
      // Get project info
      const taskProjectId = (entry.taskId as any).projectId;
      if (taskProjectId) {
        if (typeof taskProjectId === 'object' && '_id' in taskProjectId) {
          projectId = String(taskProjectId._id);
          projectName = taskProjectId.name;
        } else {
          projectId = String(taskProjectId);
        }
      }
    } else {
      // Task is not populated, just an ID
      taskId = String(entry.taskId);
      // Fetch task info
      const task = await Task.findById(taskId).populate('projectId', 'name').lean();
      if (task) {
        taskName = task.name;
        if (task.projectId) {
          if (typeof task.projectId === 'object' && '_id' in task.projectId) {
            projectId = String((task.projectId as any)._id);
            projectName = (task.projectId as any).name;
          } else {
            projectId = String(task.projectId);
          }
        }
      }
    }
    
    // Initialize task summary if not exists
    if (!taskMap.has(taskId)) {
      const summary: TaskSummary = {
        taskId,
        taskName,
        totalHours: 0,
        totalSeconds: 0,
        entryCount: 0,
      };
      if (projectId) summary.projectId = projectId;
      if (projectName) summary.projectName = projectName;
      taskMap.set(taskId, summary);
    }
    
    // Aggregate duration
    const summary = taskMap.get(taskId)!;
    const duration = entry.duration || 0;
    summary.totalSeconds += duration;
    summary.totalHours = summary.totalSeconds / 3600;
    summary.entryCount += 1;
  }
  
  // Convert map to array and sort by total hours (descending)
  const taskSummaries = Array.from(taskMap.values()).sort(
    (a, b) => b.totalHours - a.totalHours
  );
  
  // Calculate totals
  const totalHours = taskSummaries.reduce((sum, task) => sum + task.totalHours, 0);
  const totalEntries = timeEntries.length;
  
  return {
    weekStart,
    weekEnd,
    taskSummaries,
    totalHours,
    totalEntries,
  };
}

/**
 * Get time entries for CSV export (one row per entry)
 */
export async function getWeeklySummaryEntries(
  userId: string,
  weekStartDate?: string
): Promise<any[]> {
  // Parse weekStartDate if provided, otherwise use current week
  // When parsing YYYY-MM-DD format, create date in local timezone to avoid timezone shifts
  let date: Date | undefined;
  if (weekStartDate) {
    // Parse YYYY-MM-DD format as local date (not UTC)
    const parts = weekStartDate.split('-').map(Number);
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      if (year && month && day && !isNaN(year) && !isNaN(month) && !isNaN(day)) {
        date = new Date(year, month - 1, day); // month is 0-indexed
      }
    }
  }
  const { weekStart, weekEnd } = getWeekBounds(date);
  
  // Query time entries for the week (only completed entries)
  const timeEntries = await TimeEntry.find({
    userId,
    startTime: {
      $gte: weekStart,
      $lte: weekEnd,
    },
    status: 'completed',
    duration: { $exists: true, $gt: 0 },
  })
    .populate({
      path: 'taskId',
      select: 'name projectId',
      populate: {
        path: 'projectId',
        select: 'name',
      },
    })
    .sort({ startTime: 1 }) // Sort by start time ascending
    .lean();
  
  // Format entries for CSV
  return timeEntries.map((entry) => {
    let taskName = 'Unknown Task';
    let projectName = '';
    
    if (entry.taskId && typeof entry.taskId === 'object' && 'name' in entry.taskId) {
      taskName = (entry.taskId as any).name as string;
      
      const taskProjectId = (entry.taskId as any).projectId;
      if (taskProjectId && typeof taskProjectId === 'object' && 'name' in taskProjectId) {
        projectName = (taskProjectId as any).name as string;
      }
    }
    
    const durationHours = entry.duration ? (entry.duration / 3600).toFixed(2) : '0.00';
    const startTime = entry.startTime ? new Date(entry.startTime) : new Date();
    const endTime = entry.endTime ? new Date(entry.endTime) : null;
    
    const startTimeStr = startTime.toTimeString();
    const startTimeParts = startTimeStr.split(' ');
    const startTimeFormatted = startTimeParts[0] ? startTimeParts[0].substring(0, 5) : '00:00';
    
    let endTimeFormatted = '';
    if (endTime) {
      const endTimeStr = endTime.toTimeString();
      const endTimeParts = endTimeStr.split(' ');
      endTimeFormatted = endTimeParts[0] ? endTimeParts[0].substring(0, 5) : '';
    }
    
    return {
      taskName,
      projectName: projectName || '',
      date: startTime.toISOString().split('T')[0], // YYYY-MM-DD
      startTime: startTimeFormatted, // HH:MM
      endTime: endTimeFormatted, // HH:MM
      durationHours,
      description: entry.description || '',
    };
  });
}

