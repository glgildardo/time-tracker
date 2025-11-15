import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, FolderKanban, CheckSquare, TrendingUp, Pause, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { useProjects } from "@/hooks/useProjects"
import { useTimeEntries, useActiveTimer, useStopTimer } from "@/hooks/useTimeEntries"
import { useWeeklySummary, useDownloadWeeklySummaryCSV } from "@/hooks/useWeeklySummary"
import { Button } from "@/components/ui/button"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, startOfMonth, endOfMonth, addWeeks, subWeeks } from "date-fns"
import { formatDurationHuman } from "@/lib/utils"
import type { Project, Task, TimeEntry } from "@/types"
import { useState } from "react"

// Utility functions for calculations
const calculateTotalHours = (timeEntries: TimeEntry[]) => {
  return timeEntries.reduce((total, entry) => {
    if (entry.duration) {
      return total + entry.duration / 3600; // Convert seconds to hours
    }
    return total;
  }, 0);
};

const calculateWeeklyHours = (timeEntries: TimeEntry[]) => {
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  
  const weeklyEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.startTime);
    return entryDate >= weekStart && entryDate <= weekEnd;
  });

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  return days.map((day: Date) => {
    const dayEntries = weeklyEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate.toDateString() === day.toDateString();
    });
    
    const hours = calculateTotalHours(dayEntries);
    
    return {
      day: format(day, 'EEE'),
      hours: Math.round(hours * 10) / 10
    };
  });
};

const calculateProjectHours = (timeEntries: TimeEntry[], projects: Project[]) => {
  const projectHours: { [key: string]: number } = {};
  
  timeEntries.forEach(entry => {
    let projectId: string;
    if (typeof entry.taskId === 'object') {
      const taskProjectId = (entry.taskId as Task).projectId;
      projectId = typeof taskProjectId === 'object' ? taskProjectId._id : taskProjectId;
    } else {
      // If taskId is a string, we need to find the task to get the projectId
      // For now, we'll skip entries where we can't determine the project
      return;
    }
    
    const project = projects.find((p: Project) => p._id === projectId);
    
    if (project) {
      const hours = entry.duration ? entry.duration / 3600 : 0;
      projectHours[project.name] = (projectHours[project.name] || 0) + hours;
    }
  });

  return Object.entries(projectHours)
    .map(([name, hours]) => ({
      name,
      hours: Math.round(hours * 10) / 10,
      color: `bg-chart-${Math.floor(Math.random() * 4) + 1}`
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 4);
};

const calculateProductivityChange = (timeEntries: TimeEntry[]) => {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subDays(now, 30));
  const lastMonthEnd = endOfMonth(subDays(now, 30));

  const thisMonthEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.startTime);
    return entryDate >= thisMonthStart && entryDate <= thisMonthEnd;
  });

  const lastMonthEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.startTime);
    return entryDate >= lastMonthStart && entryDate <= lastMonthEnd;
  });

  const thisMonthHours = calculateTotalHours(thisMonthEntries);
  const lastMonthHours = calculateTotalHours(lastMonthEntries);

  if (lastMonthHours === 0) return 0;
  
  const change = ((thisMonthHours - lastMonthHours) / lastMonthHours) * 100;
  return Math.round(change * 10) / 10;
};

export default function DashboardPage() {
  // Weekly summary state
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | undefined>(undefined);
  
  // Fetch data
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: timeEntriesData, isLoading: timeEntriesLoading } = useTimeEntries({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const { data: activeTimer } = useActiveTimer();
  const { data: weeklySummary, isLoading: weeklySummaryLoading } = useWeeklySummary(selectedWeekStart);
  const downloadCSV = useDownloadWeeklySummaryCSV();
  
  const timeEntries = timeEntriesData?.timeEntries || [];
  const stopTimer = useStopTimer();

  // Week navigation handlers
  const handlePreviousWeek = () => {
    if (!weeklySummary) return;
    const currentWeekStart = new Date(weeklySummary.weekStart);
    const newWeekStart = subWeeks(currentWeekStart, 1);
    setSelectedWeekStart(format(startOfWeek(newWeekStart), 'yyyy-MM-dd'));
  };

  const handleNextWeek = () => {
    if (!weeklySummary) return;
    const currentWeekStart = new Date(weeklySummary.weekStart);
    const newWeekStart = addWeeks(currentWeekStart, 1);
    setSelectedWeekStart(format(startOfWeek(newWeekStart), 'yyyy-MM-dd'));
  };

  const handleCurrentWeek = () => {
    setSelectedWeekStart(undefined);
  };

  const handleDownloadCSV = () => {
    downloadCSV.mutate(selectedWeekStart);
  };

  // Calculate stats
  const totalHours = calculateTotalHours(timeEntries);
  const activeProjects = projects.filter((project: Project) => 
    project.status === 'active'
  ).length;
  // Count tasks from the selected week's weekly summary
  const completedTasks = weeklySummary?.taskSummaries?.length || 0;
  const productivityChange = calculateProductivityChange(timeEntries);
  
  const weeklyData = calculateWeeklyHours(timeEntries);
  const topProjects = calculateProjectHours(timeEntries, projects);

  const stats = [
    {
      title: "Total Hours",
      value: totalHours.toFixed(1),
      icon: Clock,
      description: "This month",
    },
    {
      title: "Active Projects",
      value: activeProjects.toString(),
      icon: FolderKanban,
      description: "In progress",
    },
    {
      title: "Total Tasks",
      value: completedTasks.toString(),
      icon: CheckSquare,
      description: weeklySummary ? `Week of ${format(new Date(weeklySummary.weekStart), 'MMM d')}` : "This week",
    },
    {
      title: "Productivity",
      value: `${productivityChange >= 0 ? '+' : ''}${productivityChange}%`,
      icon: TrendingUp,
      description: "vs last month",
    },
  ];

  const isLoading = projectsLoading || timeEntriesLoading;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="font-bold text-3xl text-balance">Dashboard</h1>
          <p className="text-muted-foreground">Loading your time tracking overview...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl text-balance">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your time tracking overview.</p>
      </div>

      {/* Active Timer Widget */}
      {activeTimer && (
        <Card className="mb-8 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Active Timer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {typeof activeTimer.taskId === 'object' ? activeTimer.taskId.name : 'Task'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Started at {format(new Date(activeTimer.startTime), 'HH:mm')}
                </p>
              </div>
              <Button onClick={() => stopTimer.mutate({})} variant="outline" size="sm">
                <Pause className="h-4 w-4 mr-2" />
                Stop Timer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{stat.value}</div>
                <p className="text-muted-foreground text-xs">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Weekly Summary Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Weekly Summary</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                disabled={weeklySummaryLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCurrentWeek}
                disabled={weeklySummaryLoading || !selectedWeekStart}
              >
                Current Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                disabled={weeklySummaryLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCSV}
                disabled={weeklySummaryLoading || downloadCSV.isPending || !weeklySummary || weeklySummary.totalEntries === 0}
              >
                {downloadCSV.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
          </div>
          {weeklySummary && (
            <p className="text-sm text-muted-foreground mt-2">
              {format(new Date(weeklySummary.weekStart), 'MMM d')} - {format(new Date(weeklySummary.weekEnd), 'MMM d, yyyy')}
              {' • '}
              Total: {weeklySummary.totalHours.toFixed(2)} hours ({weeklySummary.totalEntries} entries)
            </p>
          )}
        </CardHeader>
        <CardContent>
          {weeklySummaryLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : weeklySummary && weeklySummary.taskSummaries.length > 0 ? (
            <div className="space-y-3">
              {weeklySummary.taskSummaries.map((task) => (
                <div key={task.taskId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{task.taskName}</p>
                      {task.projectName && (
                        <span className="text-xs text-muted-foreground">({task.projectName})</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {task.entryCount} {task.entryCount === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-semibold">
                      {task.totalHours.toFixed(2)}h
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDurationHuman(task.totalSeconds)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No time entries for this week</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number) => [`${value}h`, 'Hours']}
                />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProjects.length > 0 ? (
                topProjects.map((project) => (
                  <div key={project.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{project.name}</span>
                      <span className="text-muted-foreground">{formatDurationHuman(project.hours * 3600)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div 
                        className={`h-full ${project.color}`} 
                        style={{ 
                          width: `${Math.min((project.hours / Math.max(...topProjects.map(p => p.hours))) * 100, 100)}%` 
                        }} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No time entries found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeEntries.slice(0, 5).map((entry: TimeEntry) => (
              <div key={entry._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  <div>
                    <p className="font-medium">
                      {typeof entry.taskId === 'object' ? entry.taskId.name : 'Task'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(entry.startTime), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {entry.duration ? formatDurationHuman(entry.duration) : 'Running...'}
                  </p>
                  {entry.description && (
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                  )}
                </div>
              </div>
            ))}
            {timeEntries.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
