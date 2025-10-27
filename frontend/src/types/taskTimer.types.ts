export type TimerStatus = 'idle' | 'running' | 'paused' | 'stopped';

export interface TaskView {
  id: string;
  name: string;
  status: string;
  timerStatus: TimerStatus;
  accumulatedSeconds: number;
  runningSessionStartAt?: string | null;
  serverNow: string;
}

export interface TaskViewResponse {
  taskView: TaskView;
}

export type TaskUpdatedEvent = {
  type: 'task.updated';
  taskId: string;
  payload: TaskView;
};

