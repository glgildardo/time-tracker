import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a localized date and time string
 */
export function formatDateTime(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("en-US", { ...defaultOptions, ...options });
}

/**
 * Format duration in seconds to HH:MM:SS format
 */
export function formatDurationSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Format duration in seconds to hours with 2 decimal places
 */
export function formatDurationHours(seconds: number): string {
  const hours = seconds / 3600;
  return `${hours.toFixed(2)}h`;
}

/**
 * Format duration in seconds to human-readable format
 * Examples: "20 mins", "1 hour 20 mins", "2 hours 30 mins"
 */
export function formatDurationHuman(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'min' : 'mins'}`);
  }
  
  // If no hours or minutes, show 0 mins
  if (parts.length === 0) {
    return '0 mins';
  }
  
  return parts.join(' ');
}

/**
 * Calculate total hours for a project from time entries
 */
export function calculateProjectHours(projectId: string, timeEntries: any[]): number {
  return timeEntries
    .filter(entry => {
      const task = typeof entry.task === 'object' ? entry.task : null;
      const taskProjectId = task?.projectId;
      const taskProjectIdStr = typeof taskProjectId === 'object' ? taskProjectId?._id : taskProjectId;
      return taskProjectIdStr === projectId;
    })
    .reduce((total, entry) => total + (entry.duration || 0), 0) / 3600;
}

/**
 * Calculate total hours logged for a specific task from time entries
 */
export function calculateTaskHours(taskId: string, timeEntries: any[]): number {
  return timeEntries
    .filter(entry => {
      const entryTaskId = typeof entry.taskId === 'object' ? entry.taskId?._id : entry.taskId;
      return entryTaskId === taskId && entry.status === 'completed';
    })
    .reduce((total, entry) => total + (entry.duration || 0), 0) / 3600;
}

/**
 * Group tasks by their project
 */
export function groupTasksByProject(tasks: any[], projects: any[]): Record<string, any[]> {
  const projectMap = projects.reduce((acc, project) => {
    acc[project._id] = project;
    return acc;
  }, {} as Record<string, any>);

  const grouped = tasks.reduce((acc, task) => {
    const projectId = typeof task.projectId === 'object' ? task.projectId?._id : task.projectId;
    const projectName = projectMap[projectId]?.name || 'Unassigned';
    
    if (!acc[projectName]) {
      acc[projectName] = [];
    }
    acc[projectName].push(task);
    return acc;
  }, {} as Record<string, any[]>);

  return grouped;
}
