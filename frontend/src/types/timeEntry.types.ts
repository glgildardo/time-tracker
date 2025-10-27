import type { Task } from './task.types';

// Time Entry types
export interface TimeEntry {
  _id: string;
  taskId: string | Task;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  status: 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// Time Entry request types
export interface StartTimerRequest {
  taskId: string;
  description?: string;
}

export interface StopTimerRequest {
  description?: string;
}

export interface UpdateTimeEntryRequest {
  startTime?: string;
  endTime?: string;
  description?: string;
}

export interface TimeEntriesFilters {
  projectId?: string;
  taskId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Time Entry response types
export interface TimeEntriesResponse {
  timeEntries: TimeEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface TimeEntryResponse {
  timeEntry: TimeEntry | null;
}

export interface StartTimerResponse {
  message: string;
  timeEntry: TimeEntry;
}

export interface StopTimerResponse {
  message: string;
  timeEntry: TimeEntry;
}

export interface UpdateTimeEntryResponse {
  message: string;
  timeEntry: TimeEntry;
}

export interface DeleteTimeEntryResponse {
  message: string;
}
