import { Task } from '../models/Task';
import { TaskSession } from '../models/TaskSession';

export interface TaskView {
  id: string;
  name: string;
  status: string;
  timerStatus: 'idle' | 'running' | 'paused' | 'stopped';
  accumulatedSeconds: number;
  runningSessionStartAt?: string | null;
  serverNow: string;
}

async function getTaskView(taskId: string, userId: string): Promise<TaskView> {
  const task = await Task.findOne({ _id: taskId, userId }).lean();
  
  if (!task) {
    throw new Error('Task not found or access denied');
  }

  const now = new Date();
  const serverNowISO = now.toISOString();

  // Get all closed sessions (endAt exists)
  const closedSessions = await TaskSession.find({
    taskId: task._id,
    endAt: { $exists: true, $ne: null },
  }).lean();

  // Calculate accumulated seconds from closed sessions
  let accumulatedSeconds = 0;
  for (const session of closedSessions) {
    if (session.endAt) {
      const duration = Math.floor(
        (new Date(session.endAt).getTime() - new Date(session.startAt).getTime()) / 1000
      );
      accumulatedSeconds += duration;
    }
  }

  // Get open session if any (endAt is null)
  const openSession = await TaskSession.findOne({
    taskId: task._id,
    endAt: null,
  }).lean();

  const runningSessionStartAt = openSession ? openSession.startAt.toISOString() : null;

  return {
    id: task._id.toString(),
    name: task.name,
    status: task.status,
    timerStatus: task.timerStatus,
    accumulatedSeconds,
    runningSessionStartAt,
    serverNow: serverNowISO,
  };
}

async function startTask(taskId: string, userId: string): Promise<TaskView> {
  // Verify task exists and belongs to user
  const task = await Task.findOne({ _id: taskId, userId });
  
  if (!task) {
    throw new Error('Task not found or access denied');
  }

  // Check if already running
  if (task.timerStatus === 'running') {
    return getTaskView(taskId, userId);
  }

  // Create new open session (idempotent check at DB level via unique index)
  await TaskSession.create({
    taskId: task._id,
    startAt: new Date(),
  });

  // Update task timer status
  task.timerStatus = 'running';
  await task.save();

  return getTaskView(taskId, userId);
}

async function pauseTask(taskId: string, userId: string): Promise<TaskView> {
  const task = await Task.findOne({ _id: taskId, userId });
  
  if (!task) {
    throw new Error('Task not found or access denied');
  }

  if (task.timerStatus !== 'running') {
    throw new Error('Task is not running');
  }

  // Close open session
  const openSession = await TaskSession.findOne({
    taskId: task._id,
    endAt: null,
  });

  if (openSession) {
    openSession.endAt = new Date();
    await openSession.save();
  }

  task.timerStatus = 'paused';
  await task.save();

  return getTaskView(taskId, userId);
}

async function resumeTask(taskId: string, userId: string): Promise<TaskView> {
  const task = await Task.findOne({ _id: taskId, userId });
  
  if (!task) {
    throw new Error('Task not found or access denied');
  }

  if (task.timerStatus !== 'paused') {
    throw new Error('Task is not paused');
  }

  // Create new open session
  await TaskSession.create({
    taskId: task._id,
    startAt: new Date(),
  });

  task.timerStatus = 'running';
  await task.save();

  return getTaskView(taskId, userId);
}

async function stopTask(taskId: string, userId: string): Promise<TaskView> {
  const task = await Task.findOne({ _id: taskId, userId });
  
  if (!task) {
    throw new Error('Task not found or access denied');
  }

  // Close open session if any
  const openSession = await TaskSession.findOne({
    taskId: task._id,
    endAt: null,
  });

  if (openSession) {
    openSession.endAt = new Date();
    await openSession.save();
  }

  task.timerStatus = 'stopped';
  await task.save();

  return getTaskView(taskId, userId);
}

export const taskTimerService = {
  getTaskView,
  startTask,
  pauseTask,
  resumeTask,
  stopTask,
};

