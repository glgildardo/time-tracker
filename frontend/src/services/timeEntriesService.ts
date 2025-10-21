import { api } from '@/lib/api';
import type {
  StartTimerRequest,
  StopTimerRequest,
  UpdateTimeEntryRequest,
  TimeEntriesFilters,
  TimeEntriesResponse,
  TimeEntryResponse,
  StartTimerResponse,
  StopTimerResponse,
  UpdateTimeEntryResponse,
  DeleteTimeEntryResponse,
} from '@/types';

export const timeEntriesService = {
  /**
   * Start a timer for a specific task
   */
  async startTimer(data: StartTimerRequest): Promise<StartTimerResponse> {
    const response = await api.post('/time-entries/start', data);
    return response.data;
  },

  /**
   * Stop the currently active timer
   */
  async stopTimer(data?: StopTimerRequest): Promise<StopTimerResponse> {
    const response = await api.post('/time-entries/stop', data || {});
    return response.data;
  },

  /**
   * Get the currently active timer
   */
  async getActiveTimer(): Promise<TimeEntryResponse> {
    const response = await api.get('/time-entries/active');
    return response.data;
  },

  /**
   * Get time entries with optional filters
   */
  async getTimeEntries(filters?: TimeEntriesFilters): Promise<TimeEntriesResponse> {
    const response = await api.get('/time-entries', { params: filters });
    return response.data;
  },

  /**
   * Update a time entry
   */
  async updateTimeEntry(id: string, data: UpdateTimeEntryRequest): Promise<UpdateTimeEntryResponse> {
    const response = await api.put(`/time-entries/${id}`, data);
    return response.data;
  },

  /**
   * Delete a time entry
   */
  async deleteTimeEntry(id: string): Promise<DeleteTimeEntryResponse> {
    const response = await api.delete(`/time-entries/${id}`);
    return response.data;
  },
};
