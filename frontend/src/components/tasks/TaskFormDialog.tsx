import { useState, useEffect } from "react"
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks"
import { useProjects } from "@/hooks/useProjects"
import type { Task } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task = null,
}: TaskFormDialogProps) {
  const isEditMode = !!task

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [projectId, setProjectId] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [status, setStatus] = useState<"pending" | "in-progress" | "completed">("pending")
  const [estimatedHours, setEstimatedHours] = useState("")

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const { data: projects = [] } = useProjects()

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setName(task.name)
      setDescription(task.description || "")
      const taskProjectId = typeof task.projectId === 'object' ? task.projectId?._id : task.projectId
      setProjectId(taskProjectId || "")
      setPriority(task.priority)
      setStatus(task.status)
      setEstimatedHours(task.estimatedHours?.toString() || "")
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || (!isEditMode && !projectId)) return

    const formData = {
      name: name.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
    }

    if (isEditMode && task) {
      await updateTask.mutateAsync({
        id: task._id,
        data: formData,
      })
    } else {
      await createTask.mutateAsync({...formData, projectId})
      // Reset form on successful create
      setName("")
      setDescription("")
      setProjectId("")
      setPriority("medium")
      setStatus("pending")
      setEstimatedHours("")
    }

    onOpenChange(false)
  }

  const isLoading = isEditMode ? updateTask.isPending : createTask.isPending
  const isValid = name.trim() && (isEditMode || projectId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Task" : "Create New Task"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update the task details." : "Add a new task to track your work."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Task Name *</Label>
              <Input
                id="name"
                placeholder="Enter task name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the task"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">{isEditMode ? "Project" : "Project *"}</Label>
              <Select 
                value={projectId} 
                onValueChange={setProjectId}
                disabled={isEditMode || isLoading}
              >
                <SelectTrigger id="projectId">
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
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={priority} 
                onValueChange={(value: "low" | "medium" | "high" | "critical") => setPriority(value)}
              >
                <SelectTrigger id="priority" disabled={isLoading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status} 
                onValueChange={(value: "pending" | "in-progress" | "completed") => setStatus(value)}
              >
                <SelectTrigger id="status" disabled={isLoading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                placeholder="e.g., 8"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                disabled={isLoading}
                min="0"
                step="0.5"
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
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                ? "Save Changes"
                : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

