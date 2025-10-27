import { useState, useEffect } from "react"
import { useCreateProject, useUpdateProject } from "@/hooks/useProjects"
import type { Project } from "@/types"
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

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
}

const COLORS = [
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Red" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#84CC16", label: "Lime" },
]

export function ProjectFormDialog({
  open,
  onOpenChange,
  project = null,
}: ProjectFormDialogProps) {
  const isEditMode = !!project

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#3B82F6")
  const [client, setClient] = useState("")
  const [status, setStatus] = useState<"active" | "archived">("active")
  const [budget, setBudget] = useState("")

  const createProject = useCreateProject()
  const updateProject = useUpdateProject()

  // Populate form when editing
  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description || "")
      setColor(project.color || "#3B82F6")
      setClient(project.client || "")
      setStatus(project.status)
      setBudget(project.budget?.toString() || "")
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const formData = {
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      client: client.trim() || undefined,
      status,
      budget: budget ? parseFloat(budget) : undefined,
    }

    if (isEditMode && project) {
      await updateProject.mutateAsync({
        id: project._id,
        data: formData,
      })
    } else {
      await createProject.mutateAsync(formData)
      // Reset form on successful create
      setName("")
      setDescription("")
      setColor("#3B82F6")
      setClient("")
      setStatus("active")
      setBudget("")
    }

    onOpenChange(false)
  }

  const isLoading = isEditMode ? updateProject.isPending : createProject.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Project" : "Create New Project"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update the project details." : "Add a new project to track your work."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="Enter project name"
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
                placeholder="Describe the project"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                placeholder="Client name"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: "active" | "archived") => setStatus(value)}>
                <SelectTrigger id="status" disabled={isLoading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger id="color" disabled={isLoading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((colorOption) => (
                    <SelectItem key={colorOption.value} value={colorOption.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: colorOption.value }}
                        />
                        {colorOption.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (hours)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="e.g., 80"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
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
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                ? "Save Changes"
                : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

