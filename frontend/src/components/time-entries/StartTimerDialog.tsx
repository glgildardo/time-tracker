import { useState } from "react"
import { useProjects } from "@/hooks/useProjects"
import { useTasks } from "@/hooks/useTasks"
import { useStartTask } from "@/hooks/useTaskTimer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StartTimerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StartTimerDialog({ open, onOpenChange }: StartTimerDialogProps) {
  const [projectId, setProjectId] = useState<string>("")
  const [taskId, setTaskId] = useState<string>("")
  const [description, setDescription] = useState("")

  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(projectId)
  const startTimer = useStartTask()

  // Tasks will only be fetched when projectId is provided (due to enabled: !!projectId in useTasks)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskId) return

    await startTimer.mutateAsync(taskId)

    // Reset form
    setProjectId("")
    setTaskId("")
    setDescription("")
    onOpenChange(false)
  }

  const isLoading = projectsLoading || tasksLoading || startTimer.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Start Timer</DialogTitle>
            <DialogDescription>
              Select a task and start tracking your time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="project" disabled={isLoading || projects.length === 0}>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task">Task</Label>
              <Select
                value={taskId}
                onValueChange={setTaskId}
                disabled={!projectId || isLoading || tasks.length === 0}
              >
                <SelectTrigger id="task">
                  <SelectValue placeholder={!projectId ? "Select a project first" : "Select a task"} />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task._id} value={task._id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!taskId || isLoading}>
              {startTimer.isPending ? "Starting..." : "Start Timer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

