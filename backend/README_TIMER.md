# Task Timer Architecture

## Overview

The task timer system uses a session-based model with Server-Sent Events (SSE) to provide real-time timer updates without per-second polling.

## Architecture

### Database Model

- **susks**: Stores task information with a `timerStatus` field (`'idle' | 'running' | 'paused' | 'stopped'`)
- **TaskSession**: Stores time intervals with `startAt` and `endAt` timestamps
  - Unique partial index ensures only one open session per task
  - Total time = sum of closed sessions + (now - startAt) for open session

### API Endpoints

- `GET /api/tasks/:id/timer` - Get current task view with accumulated time
- `POST /api/tasks/:id/timer/start` - Start timer (idempotent)
- `POST /api/tasks/:id/timer/pause` - Pause timer
- `POST /api/tasks/:id/timer/resume` - Resume timer
- `POST /api/tasks/:id/timer/stop` - Stop timer
- `GET /api/tasks/stream?taskId=...` - SSE endpoint for real-time updates

### Response Format

```typescript
{
  taskView: {
    id: string;
    name: string;
    status: string;
    timerStatus: 'idle' | 'running' | 'paused' | 'stopped';
    accumulatedSeconds: number;      // Sum of all closed sessions
    runningSessionStartAt?: string;   // ISO string if running
    serverNow: string;                // Current server time (ISO)
  }
}
```

### SSE Events

SSE stream sends events in this format:

```
data: {"type":"task.updated","taskId":"...","payload":{...TaskView}}
```

Heartbeat pings are sent every 25 seconds:

```
:ping
```

## Service Layer

### TaskTimerService

- **getTaskView**: Calculate accumulated seconds and current state
- **startTask**: Create open session, set status to 'running' (idempotent)
- **pauseTask**: Close open session, set status to 'paused'
- **resumeTask**: Create new open session, set status to 'running'
- **stopTask**: Close open session, set status to 'stopped'

### TaskStreamBroadcaster

Singleton managing SSE connections:
- **subscribe**: Add subscriber for a task
- **unsubscribe**: Remove subscriber
- **broadcast**: Send TaskView to all subscribers
- Automatic ping off to keep connections alive

## Extending

To add new timer states or actions:

1. Update `TimerStatus` type in models and types
2. Add transition method in `TaskTimerService`
3. Add LTE endpoint in `taskTimer.routes.ts`
4. Call `taskStreamBroadcaster.broadcast()` after state changes

