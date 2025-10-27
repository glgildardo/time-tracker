import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge, badgeVariants } from "@/components/ui/badge"
import type { VariantProps } from "class-variance-authority"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Clock, MoreVertical, Pencil, Trash2, Play, Square, Loader2 } from "lucide-react"
import { useTasks } from "@/hooks/useTasks"
import { useProjects } from "@/hooks/useProjects"
import { useTimeEntries, useActiveTimer, useStopTimer, useStartTimer } from "@/hooks/useTimeEntries"
import { useUpdateTask } from "@/hooks/useTasks"
import { calculateTaskHours, groupTasksByProject, formatDateTime, formatDurationSeconds, formatDurationHuman } from "@/lib/utils"
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog"
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog"
import { DeleteTaskDialog } from "@/components/tasks/DeleteTaskDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Task } from "@/types"

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

const statusColors: Record<string, BadgeVariant> = {
  completed: "success",
  "in-progress": "info",
  pending: "secondary",
}

// Helper function to format status labels
function formatStatusLabel(status: string): string {
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function TasksPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00")

  // Fetch all tasks
  const { data: allTasks = [], isLoading: tasksLoading } = useTasks()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: timeEntriesData } = useTimeEntries()
  const { data: activeTimer, isLoading: activeLoading } = useActiveTimer()
  const timeEntries = timeEntriesData?.timeEntries || []

  const updateTask = useUpdateTask()
  const startTimer = useStartTimer()
  const stopTimer = useStopTimer()

  // Client-side elapsed time calculation for active timer
  useEffect(() => {
    if (!activeTimer) {
      setElapsedTime("00:00:00")
      return
    }

    const updateElapsed = () => {
      const startTime = new Date(activeTimer.startTime).getTime()
      const now = Date.now()
      const elapsedSeconds = Math.floor((now - startTime) / 1000)
      setElapsedTime(formatDurationSeconds(elapsedSeconds))
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)

    return () => clearInterval(interval)
  }, [activeTimer])

  const handleStatusToggle = async (task: Task) => {
    const newStatus = task.status === "completed" ? "in-progress" : "completed"
    await updateTask.mutateAsync({
      id: task._id,
      data: { status: newStatus },
    })
  }

  const handleLogTime = async (task: Task) => {
    await startTimer.mutateAsync({
      taskId: task._id,
    })
  }

  const handleStopTimer = async () => {
    await stopTimer.mutateAsync(undefined)
  }

  const handleEdit = (task: Task) => {
    setSelectedTask(task)
    setEditDialogOpen(true)
  }

  const handleDelete = (task: Task) => {
    setSelectedTask(task)
    setDeleteDialogOpen(true)
  }

  if (tasksLoading || projectsLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading tasks...</div>
      </div>
    )
  }

  const groupedTasks = groupTasksByProject(allTasks, projects)

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl text-balance">Tasks</h1>
          <p className="text-muted-foreground">Organize and track your work items.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Active Timer Card */}
      {activeLoading ? (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      ) : activeTimer ? (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Play className="h-6 w-6 fill-primary-foreground text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {typeof activeTimer.taskId === "object"
                    ? activeTimer.taskId.name
                    : "Task"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(activeTimer.startTime, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Started at {formatDateTime(activeTimer.startTime, { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="font-mono text-2xl font-bold">{elapsedTime}</p>
              </div>
              <Button variant="destructive" size="lg" onClick={handleStopTimer} disabled={stopTimer.isPending}>
                <Square className="mr-2 h-4 w-4" />
                {stopTimer.isPending ? "Stopping..." : "Stop"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {allTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No tasks yet. Create your first task to get started!
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTasks).map(([projectName, tasks]) => (
            <div key={projectName}>
              <h2 className="mb-4 text-xl font-semibold">{projectName}</h2>
              <div className="space-y-3">
                {tasks.map((task) => {
                  const loggedHours = calculateTaskHours(task._id, timeEntries)
                  const estimatedHours = task.estimatedHours || 0
                  const progressPercentage = estimatedHours > 0
                    ? Math.min((loggedHours / estimatedHours) * 100, 100)
                    : 0

                  const projectColor = projects.find(
                    p => p._id === (typeof task.projectId === 'object' ? task.projectId?._id : task.projectId)
                  )?.color || "#3B82F6"

                  return (
                    <Card key={task._id}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <Checkbox
                          checked={task.status === "completed"}
                          onCheckedChange={() => handleStatusToggle(task)}
                          className="h-5 w-5"
                          disabled={updateTask.isPending}
                        />

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3
                              className={`font-medium ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}
                            >
                              {task.name}
                            </h3>
                            <Badge
                              variant={statusColors[task.status]}
                              className="text-xs"
                            >
                              {formatStatusLabel(task.status)}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-muted-foreground text-sm line-clamp-1">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-muted-foreground text-sm">
                            <span>{projectName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {estimatedHours > 0 && (
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{formatDurationHuman(loggedHours * 3600)}</span>
                                <span className="text-muted-foreground">/ {formatDurationHuman(estimatedHours * 3600)}</span>
                              </div>
                              <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                                <div
                                  className="h-full"
                                  style={{ 
                                    width: `${progressPercentage}%`,
                                    backgroundColor: projectColor
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleLogTime(task)}
                            disabled={startTimer.isPending || task.status === "completed"}
                          >
                            Log Time
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(task)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(task)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditTaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={selectedTask}
      />

      <DeleteTaskDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        task={selectedTask}
      />
    </div>
  )
}
