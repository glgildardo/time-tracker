export interface TaskSummary {
  taskId: string;
  taskName: string;
  projectId?: string;
  projectName?: string;
  totalHours: number;
  totalSeconds: number;
  entryCount: number;
}

export interface WeeklySummaryResponse {
  weekStart: string;
  weekEnd: string;
  taskSummaries: TaskSummary[];
  totalHours: number;
  totalEntries: number;
}

