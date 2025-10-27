import { create } from 'zustand';
import type { TaskView, TimerStatus } from '@/types/taskTimer.types';
import { computeElapsedSeconds } from '@/lib/time';

interface TaskTimerState {
  taskId?: string;
  timerStatus: TimerStatus;
  accumulatedSeconds: number;
  runningStartMs?: number | null;
  serverOffsetMs: number;

  setFromView: (view: TaskView) => void;
  getDisplayedSeconds: () => number;
}

export const useTaskTimer = create<TaskTimerState>((set, get) => {
  // Internal timer for UI updates (does not fetch from API)
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const startTicker = () => {
    if (intervalId) return; // Already running

    intervalId = setInterval(() => {
      // Trigger re-render by updating a dummy counter
      // The actual computation happens in getDisplayedSeconds selector
      set({});
    }, 1000);
  };

  const stopTicker = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return {
    taskId: undefined,
    timerStatus: 'idle',
    accumulatedSeconds: 0,
    runningStartMs: null,
    serverOffsetMs: 0,

    setFromView: (view: TaskView) => {
      const serverOffsetMs = Date.parse(view.serverNow) - Date.now();
      const runningStartMs = view.runningSessionStartAt
        ? Date.parse(view.runningSessionStartAt) + serverOffsetMs
        : null;

      set({
        taskId: view.id,
        timerStatus: view.timerStatus,
        accumulatedSeconds: view.accumulatedSeconds,
        runningStartMs,
        serverOffsetMs,
      });

      // Start/stop ticker based on timer status
      if (view.timerStatus === 'running') {
        startTicker();
      } else {
        stopTicker();
      }
    },

    getDisplayedSeconds: () => {
      const state = get();
      return computeElapsedSeconds(
        state.accumulatedSeconds,
        state.runningStartMs,
        Date.now() + state.serverOffsetMs
      );
    },
  };
});

