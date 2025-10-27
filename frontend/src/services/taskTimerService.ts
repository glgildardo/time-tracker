import { api } from '@/lib/api';
import type { TaskViewResponse } from '@/types/taskTimer.types';

export const taskTimerService = {
  getTaskTimerView: async (id: string): Promise<TaskViewResponse> => {
    const response = await api.get(`/tasks/${id}/timer`);
    return response.data;
  },

  startTask: async (id: string): Promise<TaskViewResponse> => {
    const response = await api.post(`/tasks/${id}/timer/start`);
    return response.data;
  },

  pauseTask: async (id: string): Promise<TaskViewResponse> => {
    const response = await api.post(`/tasks/${id}/timer/pause`);
    return response.data;
  },

  resumeTask: async (id: string): Promise<TaskViewResponse> => {
    const response = await api.post(`/tasks/${id}/timer/resume`);
    return response.data;
  },

  stopTask: async (id: string): Promise<TaskViewResponse> => {
    const response = await api.post(`/tasks/${id}/timer/stop`);
    return response.data;
  },
};

