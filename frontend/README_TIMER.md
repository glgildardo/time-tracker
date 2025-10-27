# Task Timer Frontend Architecture

## Overview

The frontend implements a client-side ticking timer synchronized with server time via offset calculation, with real-time updates via SSE.

## Architecture Components

### Zustand Store (`stores/useTaskTimer.ts`)

Manages timer state and client-side ticking:

- **State**:
  - `timerStatus`: Current timer state
  - `accumulatedSeconds`: Sum of closed sessions
  - `runningStartMs`: Client timestamp of running session start
  - `serverOffsetMs`: Clock skew offset (serverTime - clientTime)

- **Actions**:
  - `setFromView(view)`: Update state from server TaskView
  - `getDisplayedSeconds()`: Compute current elapsed time using local clock + offset

Internal `setInterval(1000)` updates UI every second without API calls.

### TanStack Query Hooks (`hooks/useTaskTimer.ts`)

- **useTaskTimerView**: Fetch task view (staleTime: 60s)
- **useStartTask**: Start timer mutation
- **usePauseTask**: Pause timer mutation
- **useResumeTask**: Resume timer mutation
- **useStopTask**: Stop timer mutation

All mutations call `setFromView()` and invalidate queries.

### SSE Hook (`hooks/useTaskStream.ts`)

- Opens `EventSource` to `/tasks/stream?taskId=...`
- Listens for `task.updated` events
- Calls `setFromView()` on updates
- Auto-reconnects with exponential backoff (1s → 30s max)
- Cleans up on unmount

### Time Utilities (`lib/time.ts`)

Pure functions for time calculations:

- `computeServerOffset`: Calculate clock skew
- `computeElapsedSeconds`: Calculate elapsed time
- `formatHHMMSS`: Format seconds as "01:23:45"

## Usage

### Basic Component

```tsx
import { TaskTimerWidget } from '@/components/time-entries/TaskTimerWidget';

function MyComponent() {
  return <TaskTimerWidget taskId="..." />;
}
```

### Manual Integration

```tsx
import { useTaskTimer } from '@/hooks/useTaskTimer';
import { useTaskStream } from '@/hooks/useTaskStream';
import { useTaskTimer as useStore } from '@/stores/useTaskTimer';

function TimerDisplay({ taskId }: { taskId: string }) {
  // Fetch initial view
  useTaskTimerView(taskId);
  
  // Subscribe to SSE updates
  useTaskStream(taskId);
  
  // Get displayed seconds from store
  const displayedSeconds = useStore((s) => s.getDisplayedSeconds());
  
  return <div>{formatHHMMSS(displayedSeconds)}</div>;
}
```

## Client-Side Ticking

1. On mount, `useTaskTimerView` fetches TaskView with `serverNow`
2. Store calculates `serverOffsetMs = Date.parse(serverNow) - Date.now()`
3. Internal interval updates UI every second
4. `getDisplayedSeconds()` computes elapsed using:
   - `accumulatedSeconds` + (serverTimestamp - runningStartMs)
   - Where `serverTimestamp = Date.now() + serverOffsetMs`

This ensures accuracy even if:
- Tab is hidden/sleeping (uses timestamps, not intervals)
- Clock skew exists (offset applied)
- Network is slow (no per-second fetches)

## Multi-Tab Sync

SSE broadcasts task state changes across all tabs/devices:
- When one tab starts/pauses/stops, all tabs receive update
- Each tab keeps own local ticking for UI responsiveness
- Server offset recalculated on each TaskView update

For future: Add `BroadcastChannel` to share last TaskView between tabs and reduce SSE connections.


