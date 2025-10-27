import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTaskTimer } from '@/stores/useTaskTimer';
import { useTaskTimerView, useStartTask, usePauseTask, useResumeTask, useStopTask } from '@/hooks/useTaskTimer';
import { useTaskStream } from '@/hooks/useTaskStream';
import { formatHHMMSS } from '@/lib/time';
import { Play, Pause, Square } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface TaskTimerWidgetProps {
  taskId: string;
}

export function TaskTimerWidget({ taskId }: TaskTimerWidgetProps) {
  const { data: taskView, isLoading } = useTaskTimerView(taskId);
  const displayedSeconds = useTaskTimer((state) => state.getDisplayedSeconds());
  const timerStatus = useTaskTimer((state) => state.timerStatus);
  
  const startTask = useStartTask();
  const pauseTask = usePauseTask();
  const resumeTask = useResumeTask();
  const stopTask = useStopTask();
  
  // Subscribe to SSE updates
  useTaskStream(taskId);

  const handleStart = () => {
    startTask.mutate(taskId);
  };

  const handlePause = () => {
    pauseTask.mutate(taskId);
  };

  const handleResume = () => {
    resumeTask.mutate(taskId);
  };

  const handleStop = () => {
    stopTask.mutate(taskId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            {timerStatus === 'running' && <Play className="h-6 w-6 fill-primary-foreground text-primary-foreground" />}
            {timerStatus === 'paused' && <Pause className="h-6 w-6 text-primary-foreground" />}
          </div>
          <div>
            <h3 className="font-semibold">{taskView?.taskView.name || 'Task'}</h3>
            <p className="text-sm text-muted-foreground">Timer {timerStatus}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-mono text-2xl font-bold">{formatHHMMSS(displayedSeconds)}</p>
            <p className="text-sm text-muted-foreground">
              {timerStatus === 'running' && 'Running...'}
              {timerStatus === 'paused' && 'Paused'}
              {timerStatus === 'stopped' && 'Stopped'}
              {timerStatus === 'idle' && 'Ready to start'}
            </p>
          </div>

          <div className="flex gap-2">
            {timerStatus === 'idle' && (
              <Button onClick={handleStart} disabled={startTask.isPending}>
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
            )}

            {timerStatus === 'running' && (
              <>
                <Button variant="secondary" onClick={handlePause} disabled={pauseTask.isPending}>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
                <Button variant="destructive" onClick={handleStop} disabled={stopTask.isPending}>
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </>
            )}

            {timerStatus === 'paused' && (
              <>
                <Button onClick={handleResume} disabled={resumeTask.isPending}>
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
                <Button variant="destructive" onClick={handleStop} disabled={stopTask.isPending}>
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </>
            )}

            {timerStatus === 'stopped' && (
              <Button onClick={handleStart} disabled={startTask.isPending}>
                <Play className="mr-2 h-4 w-4" />
                Start New
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

